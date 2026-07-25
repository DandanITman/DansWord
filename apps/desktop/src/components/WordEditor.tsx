import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { DocumentFootnote, HeaderFooter, PageSetup, Watermark } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';
import { createExtensions } from '../editor/extensions';
import { trackChangesPlugin, trackChangesKey } from '../editor/trackChangesPlugin';
import { spellErrorAt } from '../extensions/HunspellCheck';
import { SpellSuggestionMenu, type SpellSuggestionState } from './SpellSuggestionMenu';
import { getPlatform } from '../platform';

const EMPTY_WORDS: string[] = [];

function FootnoteTextField({
  id,
  text,
  index,
  onChange,
}: {
  id: string;
  text: string;
  index: number;
  onChange?: (id: string, text: string) => void;
}) {
  const fieldRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || document.activeElement === field) return;
    if (field.textContent !== text) {
      field.textContent = text;
    }
  }, [text]);

  return (
    <span
      ref={fieldRef}
      className="doc-footnote-text"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Footnote ${index + 1}`}
      data-placeholder="Type footnote text"
      onInput={(event) => onChange?.(id, event.currentTarget.textContent ?? '')}
    />
  );
}

export interface WordEditorProps {
  content: unknown;
  pageSetup: PageSetup;
  headerFooter: HeaderFooter;
  watermark: Watermark;
  footnotes: DocumentFootnote[];
  spellCheckEnabled?: boolean;
  language?: string;
  /** Words the user added to their dictionary; never flagged. */
  ignoredWords?: string[];
  trackChangesEnabled?: boolean;
  /** Attributed to tracked changes and comments. */
  author?: string;
  onUpdate?: (json: unknown) => void;
  onReady?: (editor: Editor) => void;
  onPageCountChange?: (count: number) => void;
  onFootnoteChange?: (id: string, text: string) => void;
  onAddToDictionary?: (word: string) => void;
}

export function WordEditor({
  content,
  pageSetup,
  headerFooter,
  watermark,
  footnotes,
  spellCheckEnabled = true,
  language = 'en-US',
  ignoredWords = EMPTY_WORDS,
  trackChangesEnabled = false,
  author = 'You',
  onUpdate,
  onReady,
  onPageCountChange,
  onFootnoteChange,
  onAddToDictionary,
}: WordEditorProps) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const pageWidth = pageSetup.orientation === 'portrait' ? dims.width : dims.height;
  const pageHeight = pageSetup.orientation === 'portrait' ? dims.height : dims.width;
  const { margins } = pageSetup;
  const contentAreaHeight = pageHeight - margins.top - margins.bottom - 80;
  const [pageCount, setPageCount] = useState(1);
  const [spellMenu, setSpellMenu] = useState<SpellSuggestionState | null>(null);

  // Built once. Settings changes are applied by reconfiguring the live
  // extension below rather than by rebuilding the editor: useEditor was called
  // with no deps argument, so a changed extensions array was simply ignored and
  // toggling spell check or switching language did nothing until a remount.
  const extensions = useMemo(
    () =>
      createExtensions({
        spellCheckEnabled,
        language,
        ignoredWords,
        checkWords: (words, lang) => getPlatform().spellCheckWords(words, lang),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    extensions,
    content: content as object,
    onUpdate: ({ editor: ed }) => onUpdate?.(ed.getJSON()),
    onCreate: ({ editor: ed }) => {
      onReady?.(ed);
      if (document.documentElement.getAttribute('data-test-mode') === 'true') {
        window.__DANSWORD_TEST__?.setEditor(ed);
      }
    },
    editorProps: {
      attributes: {
        spellcheck: 'false',
        class: 'prose-editor',
        'data-testid': 'word-editor',
      },
    },
  });

  // Apply spell-check settings to the running editor.
  useEffect(() => {
    if (!editor) return;
    const spell = editor.extensionManager.extensions.find((e) => e.name === 'hunspellCheck');
    if (!spell) return;
    spell.options.enabled = spellCheckEnabled;
    spell.options.language = language;
    spell.options.ignoredWords = ignoredWords;
    // Nudge the plugin's view so it notices the new options.
    editor.view.dispatch(editor.state.tr.setMeta('hunspellSettings', Date.now()));
  }, [editor, spellCheckEnabled, language, ignoredWords]);

  // Track changes reads its flags through refs so toggling does not tear the
  // plugin down and lose in-flight state.
  const trackEnabledRef = useRef(trackChangesEnabled);
  trackEnabledRef.current = trackChangesEnabled;
  const authorRef = useRef(author);
  authorRef.current = author;

  useEffect(() => {
    if (!editor) return;
    const plugin = trackChangesPlugin(
      () => trackEnabledRef.current,
      () => authorRef.current,
    );
    editor.registerPlugin(plugin);
    return () => {
      editor.unregisterPlugin(trackChangesKey);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onFootnoteClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.footnote-ref') as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute('data-footnote-id');
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    dom.addEventListener('click', onFootnoteClick);

    const onSpellContextMenu = (e: MouseEvent) => {
      // Resolve the click to a document position, then read the flagged range
      // straight off the decoration set. Deriving it from posAtDOM plus the
      // word's string length mis-targeted the replacement whenever the word sat
      // inside nested inline marks.
      const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!coords) return;

      const range = spellErrorAt(editor.state, coords.pos);
      if (!range) return;

      e.preventDefault();

      const word = editor.state.doc.textBetween(range.from, range.to, '');
      if (!word) return;

      void getPlatform()
        .spellSuggest(word, language)
        .then((suggestions) => {
          setSpellMenu({ x: e.clientX, y: e.clientY, word, from: range.from, to: range.to, suggestions });
        });
    };
    dom.addEventListener('contextmenu', onSpellContextMenu);

    const measureContentHeight = () => {
      const savedMinHeight = dom.style.minHeight;
      dom.style.minHeight = '0';
      const height = dom.scrollHeight;
      dom.style.minHeight = savedMinHeight;
      return height;
    };

    const measure = () => {
      const height = measureContentHeight();
      const count = Math.max(1, Math.ceil(height / contentAreaHeight));
      setPageCount(count);
      onPageCountChange?.(count);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(dom);
    editor.on('update', measure);
    return () => {
      dom.removeEventListener('click', onFootnoteClick);
      dom.removeEventListener('contextmenu', onSpellContextMenu);
      ro.disconnect();
      editor.off('update', measure);
    };
  }, [editor, contentAreaHeight, onPageCountChange, language]);

  const applySpellReplacement = (replacement: string) => {
    if (!editor || !spellMenu) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: spellMenu.from, to: spellMenu.to })
      .insertContent(replacement)
      .run();
    setSpellMenu(null);
  };

  if (!editor) return null;

  const columnStyle =
    pageSetup.columns.count > 1
      ? {
          columnCount: pageSetup.columns.count,
          columnGap: pageSetup.columns.gap,
        }
      : undefined;

  return (
    <>
    <div className="doc-pages-wrap print-area">
      <div className="doc-pages-stack" aria-hidden>
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            className="doc-page-shell"
            style={{
              width: pageWidth,
              height: pageHeight,
              marginBottom: i < pageCount - 1 ? 24 : 0,
            }}
          >
            <div className="doc-page-shell-label">
              {headerFooter.showPageNumbers ? `Page ${i + 1} of ${pageCount}` : `Page ${i + 1}`}
            </div>
          </div>
        ))}
      </div>
      <div
        className="doc-page doc-page-active"
        style={{
          width: pageWidth,
          minHeight: pageHeight * pageCount,
          padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
          ['--page-height' as string]: `${contentAreaHeight}px`,
          ['--page-count' as string]: String(pageCount),
        }}
      >
        {watermark.enabled && watermark.text && (
          <div className="doc-watermark" style={{ opacity: watermark.opacity }} aria-hidden>
            {watermark.text}
          </div>
        )}
        {headerFooter.header && <div className="doc-header">{headerFooter.header}</div>}
        <div
          className={`doc-body${pageSetup.columns.count > 1 ? ' doc-body-columns' : ''}`}
          style={{ minHeight: contentAreaHeight * pageCount, ...columnStyle }}
          data-testid="document-canvas"
        >
          <EditorContent editor={editor} />
          <div className="page-guides" aria-hidden>
            {Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => (
              <div
                key={i}
                className="page-guide-line"
                style={{ top: (i + 1) * contentAreaHeight }}
              />
            ))}
          </div>
        </div>
        {footnotes.length > 0 && (
          <div className="doc-footnotes" data-testid="doc-footnotes">
            <hr />
            {footnotes.map((fn, i) => (
              <p key={fn.id} id={fn.id} className="doc-footnote-item">
                <sup>{i + 1}</sup>{' '}
                <FootnoteTextField
                  id={fn.id}
                  text={fn.text}
                  index={i}
                  onChange={onFootnoteChange}
                />
              </p>
            ))}
          </div>
        )}
        {headerFooter.footer && <div className="doc-footer">{headerFooter.footer}</div>}
        {headerFooter.showPageNumbers && (
          <div className="doc-footer doc-footer-pages">Page <span className="page-num" /></div>
        )}
      </div>
    </div>
    <SpellSuggestionMenu
      state={spellMenu}
      onPick={applySpellReplacement}
      onAddToDictionary={(word) => {
        setSpellMenu(null);
        onAddToDictionary?.(word);
      }}
      onClose={() => setSpellMenu(null)}
    />
    </>
  );
}

export function getWordCount(editor: Editor | null, pageCount = 1) {
  if (!editor) return { words: 0, characters: 0, pages: 1 };
  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, characters: text.length, pages: pageCount };
}

export function insertFootnote(editor: Editor, footnotes: DocumentFootnote[], text: string) {
  // Date.now() collides when two footnotes are inserted in the same millisecond.
  const id = `fn-${crypto.randomUUID()}`;
  const number = footnotes.length + 1;
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'text',
      text: String(number),
      marks: [{ type: 'footnoteRef', attrs: { id, number } }],
    })
    .run();
  return { id, text, number };
}
