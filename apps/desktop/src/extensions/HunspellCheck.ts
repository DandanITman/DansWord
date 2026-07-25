import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const hunspellKey = new PluginKey<DecorationSet>('hunspell');

/**
 * Split text into candidate words.
 *
 * Uses Unicode letter classes rather than `[A-Za-z']+`. The ASCII-only pattern
 * split "Straße" into "Stra" + "e" and flagged both, which defeated the German,
 * Spanish and French dictionaries the app ships and loads.
 */
export function extractWords(text: string): Array<{ word: string; from: number; to: number }> {
  const results: Array<{ word: string; from: number; to: number }> = [];
  // Letters and combining marks, with internal apostrophes and hyphens.
  const re = /[\p{L}\p{M}](?:[\p{L}\p{M}'’-]*[\p{L}\p{M}])?/gu;
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
  /** Words the user chose to ignore; never flagged. */
  ignoredWords: string[];
}

/**
 * The misspelling range covering a document position, or null.
 *
 * Reading it back from the decoration set gives the exact range that was
 * flagged. The previous approach derived the range from `posAtDOM` plus the
 * word's string length, which mis-targeted the replacement whenever the word
 * sat inside nested inline marks.
 */
export function spellErrorAt(
  state: EditorState,
  pos: number,
): { from: number; to: number } | null {
  const set = hunspellKey.getState(state);
  if (!set) return null;
  const found = set.find(pos, pos);
  if (!found.length) return null;
  const match = found[0];
  return { from: match.from, to: match.to };
}

export const HunspellCheck = Extension.create<HunspellOptions>({
  name: 'hunspellCheck',

  addOptions() {
    return {
      enabled: true,
      language: 'en-US',
      checkWords: async () => [],
      ignoredWords: [],
    };
  },

  addProseMirrorPlugins() {
    const ext = this;
    let generation = 0;

    return [
      new Plugin<DecorationSet>({
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
          // Re-run when the language or enabled flag changes, not only on edits.
          let lastSignature = '';

          const runCheck = () => {
            const { enabled, language, checkWords, ignoredWords } = ext.options;
            if (!enabled) {
              view.dispatch(
                view.state.tr.setMeta(hunspellKey, { decorations: DecorationSet.empty }),
              );
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
              view.dispatch(
                view.state.tr.setMeta(hunspellKey, { decorations: DecorationSet.empty }),
              );
              return;
            }

            const ignored = new Set(ignoredWords.map((w) => w.toLowerCase()));
            const gen = ++generation;
            const uniqueWords = [...new Set(wordEntries.map((w) => w.word))];

            void checkWords(uniqueWords, language).then((results) => {
              // Discard a response that a newer run has already superseded.
              if (gen !== generation) return;
              const bad = new Set(uniqueWords.filter((_, i) => !results[i]));
              const decos: Decoration[] = wordEntries
                .filter((e) => bad.has(e.word) && !ignored.has(e.word.toLowerCase()))
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

          const signature = () =>
            `${ext.options.enabled}|${ext.options.language}|${ext.options.ignoredWords.join(',')}`;

          lastSignature = signature();
          schedule();

          return {
            update(v, prevState) {
              const next = signature();
              if (next !== lastSignature) {
                lastSignature = next;
                schedule();
                return;
              }
              if (v.state.doc !== prevState.doc) schedule();
            },
            destroy() {
              if (timer) clearTimeout(timer);
            },
          };
        },
        props: {
          decorations(state) {
            return hunspellKey.getState(state);
          },
        },
      }),
    ];
  },
});
