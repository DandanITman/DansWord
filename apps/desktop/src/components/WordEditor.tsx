import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { DocumentFootnote, HeaderFooter, PageSetup, Watermark } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';
import { createExtensions } from '../editor/extensions';
import { trackChangesPlugin, trackChangesKey } from '../editor/trackChangesPlugin';
import { proofingIssueAt, type DocumentProofingIssue } from '../extensions/ProofingCheck';
import { formattingMarksKey } from '../extensions/FormattingMarks';
import type { ContextMenuState } from './EditorContextMenu';
import type { MarkupView } from '../ribbon/types';
import { getPlatform } from '../platform';

const EMPTY_WORDS: string[] = [];
/** The nominal line height page measurements and line numbers are based on. */
const LINE_HEIGHT = 24;

function FootnoteTextField({
  id,
  text,
  index,
  label,
  onChange,
}: {
  id: string;
  text: string;
  index: number;
  label: string;
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
      aria-label={`${label} ${index + 1}`}
      data-placeholder={`Type ${label.toLowerCase()} text`}
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
  endnotes: DocumentFootnote[];
  spellCheckEnabled?: boolean;
  grammarCheckEnabled?: boolean;
  autoCorrectEnabled?: boolean;
  showFormattingMarks?: boolean;
  showGridlines?: boolean;
  /** Review > Display for Review. */
  markupView?: MarkupView;
  /** Review > Restrict Editing: the document becomes read-only. */
  readOnly?: boolean;
  /** Mailings > Highlight Merge Fields. */
  highlightMergeFields?: boolean;
  language?: string;
  /** Words the user added to their dictionary; never flagged. */
  ignoredWords?: string[];
  trackChangesEnabled?: boolean;
  /** Attributed to tracked changes and comments. */
  author?: string;
  onUpdate?: (json: unknown) => void;
  onReady?: (editor: Editor) => void;
  onPageCountChange?: (count: number) => void;
  /** Which page the caret is currently on, 1-based. */
  onCurrentPageChange?: (page: number) => void;
  onFootnoteChange?: (id: string, text: string) => void;
  onEndnoteChange?: (id: string, text: string) => void;
  onProofingIssues?: (issues: DocumentProofingIssue[]) => void;
  onContextMenu?: (state: ContextMenuState) => void;
}

export function WordEditor({
  content,
  pageSetup,
  headerFooter,
  watermark,
  footnotes,
  endnotes,
  spellCheckEnabled = true,
  grammarCheckEnabled = true,
  autoCorrectEnabled = true,
  showFormattingMarks = false,
  showGridlines = false,
  markupView = 'all',
  readOnly = false,
  highlightMergeFields = false,
  language = 'en-US',
  ignoredWords = EMPTY_WORDS,
  trackChangesEnabled = false,
  author = 'You',
  onUpdate,
  onReady,
  onPageCountChange,
  onCurrentPageChange,
  onFootnoteChange,
  onEndnoteChange,
  onProofingIssues,
  onContextMenu,
}: WordEditorProps) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const pageWidth = pageSetup.orientation === 'portrait' ? dims.width : dims.height;
  const pageHeight = pageSetup.orientation === 'portrait' ? dims.height : dims.width;
  const { margins } = pageSetup;
  const contentAreaHeight = pageHeight - margins.top - margins.bottom - 80;
  const [pageCount, setPageCount] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  // Built once. Settings changes are applied by reconfiguring the live
  // extensions below rather than by rebuilding the editor: useEditor was called
  // with no deps argument, so a changed extensions array was simply ignored and
  // toggling spell check or switching language did nothing until a remount.
  const proofingCallback = useRef(onProofingIssues);
  proofingCallback.current = onProofingIssues;

  const extensions = useMemo(
    () =>
      createExtensions({
        spellCheckEnabled,
        grammarCheckEnabled,
        autoCorrectEnabled,
        showFormattingMarks,
        language,
        ignoredWords,
        checkWords: (words, lang) => getPlatform().spellCheckWords(words, lang),
        onProofingIssues: (issues) => proofingCallback.current?.(issues),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    extensions,
    content: content as object,
    editable: !readOnly,
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
      /** Pictures dropped from Explorer or the desktop land in the document. */
      handleDrop(view, event) {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        const images = files.filter((file) => file.type.startsWith('image/'));
        if (!images.length) return false;
        event.preventDefault();

        const at = view.posAtCoords({
          left: (event as DragEvent).clientX,
          top: (event as DragEvent).clientY,
        });

        void Promise.all(
          images.map(
            (file) =>
              new Promise<{ src: string; alt: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ src: String(reader.result), alt: file.name });
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
              }),
          ),
        ).then((loaded) => {
          const chain = view.dom.isConnected ? editorRef.current?.chain().focus() : null;
          if (!chain) return;
          if (at) chain.setTextSelection(at.pos);
          for (const image of loaded) chain.setImage(image);
          chain.run();
        });
        return true;
      },
      /** Pasted image data becomes a picture rather than being dropped. */
      handlePaste(_view, event) {
        const items = Array.from((event as ClipboardEvent).clipboardData?.items ?? []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          editorRef.current
            ?.chain()
            .focus()
            .setImage({ src: String(reader.result), alt: 'Pasted picture' })
            .run();
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
  });

  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;

  // Apply proofing settings to the running editor.
  useEffect(() => {
    if (!editor) return;
    const proofing = editor.extensionManager.extensions.find((e) => e.name === 'proofingCheck');
    if (!proofing) return;
    proofing.options.enabled = spellCheckEnabled;
    proofing.options.grammarEnabled = grammarCheckEnabled;
    proofing.options.language = language;
    proofing.options.ignoredWords = ignoredWords;
    // Nudge the plugin's view so it notices the new options.
    editor.view.dispatch(editor.state.tr.setMeta('proofingSettings', Date.now()));
  }, [editor, spellCheckEnabled, grammarCheckEnabled, language, ignoredWords]);

  useEffect(() => {
    if (!editor) return;
    const autoCorrect = editor.extensionManager.extensions.find((e) => e.name === 'autoCorrect');
    if (autoCorrect) autoCorrect.options.enabled = autoCorrectEnabled;
  }, [editor, autoCorrectEnabled]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta(formattingMarksKey, showFormattingMarks));
  }, [editor, showFormattingMarks]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

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

  const openContextMenu = useCallback(
    (event: MouseEvent) => {
      const instance = editorRef.current;
      if (!instance || !onContextMenu) return;

      const target = event.target as HTMLElement;
      const onImage = Boolean(target.closest('.image-block'));
      const coords = instance.view.posAtCoords({ left: event.clientX, top: event.clientY });
      const issue = coords ? proofingIssueAt(instance.state, coords.pos) : null;

      event.preventDefault();

      const show = (suggestions: string[]) =>
        onContextMenu({
          x: event.clientX,
          y: event.clientY,
          issue,
          suggestions,
          onImage,
          hasSelection: !instance.state.selection.empty,
        });

      if (issue?.kind === 'spelling') {
        void getPlatform().spellSuggest(issue.text, language).then(show);
        return;
      }
      show(issue?.suggestions ?? []);
    },
    [language, onContextMenu],
  );

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onNoteClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('.footnote-ref') as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute('data-footnote-id');
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    dom.addEventListener('click', onNoteClick);
    dom.addEventListener('contextmenu', openContextMenu);

    const measureContentHeight = () => {
      const savedMinHeight = dom.style.minHeight;
      dom.style.minHeight = '0';
      const height = dom.scrollHeight;
      dom.style.minHeight = savedMinHeight;
      return height;
    };

    const measure = () => {
      const height = measureContentHeight();
      setContentHeight(height);
      const count = Math.max(1, Math.ceil(height / contentAreaHeight));
      setPageCount(count);
      onPageCountChange?.(count);
    };

    // The status bar showed "1/N" permanently because nothing ever computed
    // the caret's page.
    const reportCurrentPage = () => {
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        const top = coords.top - dom.getBoundingClientRect().top;
        const page = Math.max(1, Math.floor(top / contentAreaHeight) + 1);
        onCurrentPageChange?.(page);
      } catch {
        // coordsAtPos throws while the view is detached; the next update retries.
      }
    };

    measure();
    reportCurrentPage();
    const ro = new ResizeObserver(measure);
    ro.observe(dom);
    editor.on('update', measure);
    editor.on('selectionUpdate', reportCurrentPage);
    editor.on('update', reportCurrentPage);
    return () => {
      dom.removeEventListener('click', onNoteClick);
      dom.removeEventListener('contextmenu', openContextMenu);
      ro.disconnect();
      editor.off('update', measure);
      editor.off('selectionUpdate', reportCurrentPage);
      editor.off('update', reportCurrentPage);
    };
  }, [editor, contentAreaHeight, onPageCountChange, onCurrentPageChange, openContextMenu]);

  if (!editor) return null;

  const columnStyle: CSSProperties | undefined =
    pageSetup.columns.count > 1
      ? {
          columnCount: pageSetup.columns.count,
          columnGap: pageSetup.columns.gap,
          ...(pageSetup.columns.line ? { columnRule: '1px solid var(--border)' } : {}),
        }
      : undefined;

  const pageStyle: CSSProperties = {
    width: pageWidth,
    minHeight: pageHeight * pageCount,
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
    ['--page-height' as string]: `${contentAreaHeight}px`,
    ['--page-count' as string]: String(pageCount),
    ...(pageSetup.pageColor ? { background: pageSetup.pageColor } : {}),
    ...(pageSetup.border.style !== 'none'
      ? { outline: `${pageSetup.border.width}px ${pageSetup.border.style} ${pageSetup.border.color}`, outlineOffset: '-24px' }
      : {}),
  };

  const lineNumbers =
    pageSetup.lineNumbers === 'none'
      ? []
      : Array.from({ length: Math.max(1, Math.ceil(contentHeight / LINE_HEIGHT)) }, (_, index) => {
          const perPage = Math.max(1, Math.floor(contentAreaHeight / LINE_HEIGHT));
          return pageSetup.lineNumbers === 'restartEachPage' ? (index % perPage) + 1 : index + 1;
        });

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
                ...(pageSetup.pageColor ? { background: pageSetup.pageColor } : {}),
              }}
            >
              <div className="doc-page-shell-label">
                {headerFooter.showPageNumbers ? `Page ${i + 1} of ${pageCount}` : `Page ${i + 1}`}
              </div>
            </div>
          ))}
        </div>
        <div
          className={`doc-page doc-page-active markup-${markupView}${
            showGridlines ? ' show-gridlines' : ''
          }${highlightMergeFields ? ' highlight-merge-fields' : ''}${readOnly ? ' is-read-only' : ''}`}
          style={pageStyle}
        >
          {watermark.enabled && watermark.text && (
            <div className="doc-watermark" style={{ opacity: watermark.opacity }} aria-hidden>
              {watermark.text}
            </div>
          )}
          {headerFooter.header && <div className="doc-header">{headerFooter.header}</div>}
          <div
            className={`doc-body${pageSetup.columns.count > 1 ? ' doc-body-columns' : ''}${
              pageSetup.hyphenation ? ' doc-body-hyphenated' : ''
            }`}
            style={{ minHeight: contentAreaHeight * pageCount, ...columnStyle }}
            data-testid="document-canvas"
          >
            {lineNumbers.length > 0 && (
              <div className="doc-line-numbers" aria-hidden data-testid="doc-line-numbers">
                {lineNumbers.map((number, index) => (
                  <span key={index} style={{ top: index * LINE_HEIGHT }}>
                    {number}
                  </span>
                ))}
              </div>
            )}
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
                    label="Footnote"
                    onChange={onFootnoteChange}
                  />
                </p>
              ))}
            </div>
          )}
          {endnotes.length > 0 && (
            <div className="doc-footnotes doc-endnotes" data-testid="doc-endnotes">
              <hr />
              <p className="doc-endnotes-title">Endnotes</p>
              {endnotes.map((note, i) => (
                <p key={note.id} id={note.id} className="doc-footnote-item">
                  <sup>{String.fromCharCode(105 + Math.min(i, 20))}</sup>{' '}
                  <FootnoteTextField
                    id={note.id}
                    text={note.text}
                    index={i}
                    label="Endnote"
                    onChange={onEndnoteChange}
                  />
                </p>
              ))}
            </div>
          )}
          {headerFooter.footer && <div className="doc-footer">{headerFooter.footer}</div>}
          {headerFooter.showPageNumbers && (
            <div className="doc-footer doc-footer-pages">
              Page <span className="page-num" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function getWordCount(editor: Editor | null, pageCount = 1) {
  if (!editor) return { words: 0, characters: 0, pages: 1 };
  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, characters: text.length, pages: pageCount };
}

/**
 * Insert a footnote or endnote reference at the caret.
 *
 * The marker is a mark on the number text, so it flows with the paragraph and
 * survives editing around it.
 */
export function insertNote(
  editor: Editor,
  existing: DocumentFootnote[],
  kind: 'footnote' | 'endnote',
) {
  // Date.now() collides when two notes are inserted in the same millisecond.
  const id = `${kind === 'endnote' ? 'en' : 'fn'}-${crypto.randomUUID()}`;
  const number = existing.length + 1;
  const label = kind === 'endnote' ? String.fromCharCode(105 + Math.min(existing.length, 20)) : String(number);

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'text',
      text: label,
      marks: [{ type: 'footnoteRef', attrs: { id, number, kind } }],
    })
    .run();
  return { id, text: '', number };
}
