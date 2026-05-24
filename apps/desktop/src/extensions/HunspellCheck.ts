import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const hunspellKey = new PluginKey('hunspell');

function extractWords(text: string): Array<{ word: string; from: number; to: number }> {
  const results: Array<{ word: string; from: number; to: number }> = [];
  const re = /[A-Za-z']+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    results.push({ word: match[0], from: match.index, to: match.index + match[0].length });
  }
  return results;
}

export interface HunspellOptions {
  enabled: boolean;
  language: string;
  checkWords: (words: string[], language: string) => Promise<boolean[]>;
}

export const HunspellCheck = Extension.create<HunspellOptions>({
  name: 'hunspellCheck',

  addOptions() {
    return {
      enabled: true,
      language: 'en-US',
      checkWords: async () => [],
    };
  },

  addProseMirrorPlugins() {
    const ext = this;
    let generation = 0;

    return [
      new Plugin({
        key: hunspellKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, set) {
            const meta = tr.getMeta(hunspellKey);
            if (meta?.decorations) return meta.decorations as DecorationSet;
            return set.map(tr.mapping, tr.doc);
          },
        },
        view(view) {
          let timer: ReturnType<typeof setTimeout> | null = null;

          const runCheck = () => {
            const { enabled, language, checkWords } = ext.options;
            if (!enabled) {
              view.dispatch(view.state.tr.setMeta(hunspellKey, { decorations: DecorationSet.empty }));
              return;
            }

            const { doc } = view.state;
            const wordEntries: Array<{ word: string; from: number; to: number }> = [];
            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              for (const entry of extractWords(node.text)) {
                wordEntries.push({ word: entry.word, from: pos + entry.from, to: pos + entry.to });
              }
            });

            if (!wordEntries.length) {
              view.dispatch(view.state.tr.setMeta(hunspellKey, { decorations: DecorationSet.empty }));
              return;
            }

            const gen = ++generation;
            const uniqueWords = [...new Set(wordEntries.map((w) => w.word))];
            void checkWords(uniqueWords, language).then((results) => {
              if (gen !== generation) return;
              const bad = new Set(uniqueWords.filter((_, i) => !results[i]));
              const decos: Decoration[] = wordEntries
                .filter((e) => bad.has(e.word))
                .map((e) =>
                  Decoration.inline(e.from, e.to, {
                    class: 'spell-error',
                    title: 'Misspelled word',
                  }),
                );
              view.dispatch(
                view.state.tr.setMeta(hunspellKey, {
                  decorations: DecorationSet.create(view.state.doc, decos),
                }),
              );
            });
          };

          const schedule = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(runCheck, 400);
          };

          schedule();
          return {
            update(v, prevState) {
              if (v.state.doc !== prevState.doc) schedule();
            },
            destroy() {
              if (timer) clearTimeout(timer);
            },
          };
        },
        props: {
          decorations(state) {
            return hunspellKey.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});
