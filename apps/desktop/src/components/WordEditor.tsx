import { useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { ResizableImage } from '../extensions/ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { DocumentFootnote, HeaderFooter, PageSetup, Watermark } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';
import { TrackInsert } from '../extensions/TrackInsert';
import { PageBreak } from '../extensions/PageBreak';
import { TableOfContents } from '../extensions/TableOfContents';
import { CommentAnchor } from '../extensions/CommentAnchor';
import { DocShape } from '../extensions/DocShape';
import { FootnoteRef } from '../extensions/FootnoteRef';
import { MergeField } from '../extensions/MergeField';
import { HunspellCheck } from '../extensions/HunspellCheck';
import { SuperscriptMark, SubscriptMark } from '../extensions/TextMarks';
import { ParagraphFormatting } from '../extensions/ParagraphFormatting';
import { SpellSuggestionMenu, type SpellSuggestionState } from './SpellSuggestionMenu';

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const trackChangesKey = new PluginKey('trackChanges');

function trackChangesPlugin(enabled: boolean) {
  return new Plugin({
    key: trackChangesKey,
    appendTransaction(transactions, _oldState, newState) {
      if (!enabled) return null;
      const tr = newState.tr;
      let modified = false;
      for (const transaction of transactions) {
        if (!transaction.docChanged) continue;
        transaction.steps.forEach((step) => {
          step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
            if (newEnd > newStart && newState.schema.marks.trackInsert) {
              tr.addMark(newStart, newEnd, newState.schema.marks.trackInsert.create());
              modified = true;
            }
          });
        });
      }
      return modified ? tr : null;
    },
  });
}


export interface WordEditorProps {
  content: unknown;
  pageSetup: PageSetup;
  headerFooter: HeaderFooter;
  watermark: Watermark;
  footnotes: DocumentFootnote[];
  spellCheckEnabled?: boolean;
  language?: string;
  trackChangesEnabled?: boolean;
  onUpdate?: (json: unknown) => void;
  onReady?: (editor: Editor) => void;
  onPageCountChange?: (count: number) => void;
}

export function WordEditor({
  content,
  pageSetup,
  headerFooter,
  watermark,
  footnotes,
  spellCheckEnabled = true,
  language = 'en-US',
  trackChangesEnabled = false,
  onUpdate,
  onReady,
  onPageCountChange,
}: WordEditorProps) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const pageWidth = pageSetup.orientation === 'portrait' ? dims.width : dims.height;
  const pageHeight = pageSetup.orientation === 'portrait' ? dims.height : dims.width;
  const { margins } = pageSetup;
  const contentAreaHeight = pageHeight - margins.top - margins.bottom - 80;
  const [pageCount, setPageCount] = useState(1);
  const [spellMenu, setSpellMenu] = useState<SpellSuggestionState | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      SuperscriptMark,
      SubscriptMark,
      ParagraphFormatting,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Placeholder.configure({ placeholder: 'Start typing your document…' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TrackInsert,
      PageBreak,
      TableOfContents,
      CommentAnchor,
      DocShape,
      FootnoteRef,
      MergeField,
      HunspellCheck.configure({
        enabled: spellCheckEnabled,
        language,
        checkWords: (words, lang) => window.dansword.spellCheckWords(words, lang),
      }),
    ],
    [spellCheckEnabled, language],
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

  useEffect(() => {
    if (!editor) return;
    const plugin = trackChangesPlugin(trackChangesEnabled);
    editor.registerPlugin(plugin);
    return () => {
      editor.unregisterPlugin(trackChangesKey);
    };
  }, [editor, trackChangesEnabled]);

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
      const target = e.target as Node | null;
      const element = target?.nodeType === Node.ELEMENT_NODE ? (target as HTMLElement) : target?.parentElement;
      const spellError = element?.closest('.spell-error') as HTMLElement | null;
      if (!spellError) return;

      e.preventDefault();

      const word = spellError.textContent?.trim();
      if (!word) return;

      try {
        const pos = editor.view.posAtDOM(spellError.firstChild || spellError, 0);
        const from = pos;
        const to = pos + word.length;

        void window.dansword.spellSuggest(word, language).then((suggestions) => {
          setSpellMenu({
            x: e.clientX,
            y: e.clientY,
            word,
            from,
            to,
            suggestions,
          });
        });
      } catch (err) {
        console.error('Failed to resolve spell error position:', err);
      }
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
          <div className="doc-footnotes">
            <hr />
            {footnotes.map((fn, i) => (
              <p key={fn.id} id={fn.id}>
                <sup>{i + 1}</sup> {fn.text}
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
  const id = `fn-${Date.now()}`;
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
