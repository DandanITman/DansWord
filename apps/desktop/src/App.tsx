import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  DEFAULT_SETTINGS,
  TEMPLATES,
  MARGIN_PRESETS,
  PARAGRAPH_SPACING_PRESETS,
  applyStyleSet,
  createDocumentEnvelope,
  builtinStylesWithDefaults,
  formatBibliography,
  formatCitation,
  addressBlock,
  greetingLine,
  includedRecords,
  mergeFieldPlaceholder,
  applyMergeToDocument,
  parseRecipientList,
  type AppSettings,
  type AppView,
  type CaptionLabel,
  type CitationStyle,
  type MailMergeData,
  type MergeDocumentType,
  type RecentFile,
  type RibbonTab,
  type PageSetup,
  type DocumentComment,
  type DocumentRevision,
  type DocumentEnvelope,
} from '@dansword/core';
import {
  exportToDocx,
  importDocxEnvelope,
  exportToRtf,
  importFromRtf,
  exportToHtml,
  importFromHtml,
  importFromDocText,
  wrapDansWordFile,
  unwrapDansWordFile,
  type DocxExportOptions,
} from '@dansword/openxml';
import { applyPrintPageSetup } from './utils/printStyles';
import { StyleEditorDialog } from './components/StyleEditorDialog';
import { WatermarkDialog } from './components/WatermarkDialog';
import { WordCountDialog } from './components/WordCountDialog';
import { HomeScreen } from './components/HomeScreen';
import { Ribbon } from './ribbon/Ribbon';
import type { MarkupOptions, MarkupView, RibbonActions, ViewMode } from './ribbon/types';
import { StatusBar } from './components/StatusBar';
import { Backstage, type BackstageSection } from './components/Backstage';
import { WordEditor, insertNote } from './components/WordEditor';
import { FindReplaceBar } from './components/FindReplaceBar';
import { NavigationPane } from './components/NavigationPane';
import { DocumentRulers } from './components/DocumentRulers';
import { EditorTitleBar } from './components/EditorTitleBar';
import { PageSetupDialog, HeaderFooterDialog } from './components/PageSetupDialog';
import { CommentsPane } from './components/CommentsPane';
import { UiPromptHost } from './components/UiPromptHost';
import { ProofingPane } from './components/ProofingPane';
import { ThesaurusPane } from './components/ThesaurusPane';
import { ReviewingPane } from './components/ReviewingPane';
import { MiniToolbar } from './components/MiniToolbar';
import { EditorContextMenu, type ContextMenuState } from './components/EditorContextMenu';
import {
  BordersShadingDialog,
  ColumnsDialog,
  FontDialog,
  PageBordersDialog,
  ParagraphDialog,
  TablePropertiesDialog,
  ZoomDialog,
} from './components/dialogs/FormatDialogs';
import {
  AltTextDialog,
  CrossReferenceDialog,
  PictureLayoutDialog,
  SymbolDialog,
} from './components/dialogs/InsertDialogs';
import { RecipientsDialog, SourcesDialog } from './components/dialogs/ReferenceDialogs';
import { useFormatPainter } from './hooks/useFormatPainter';
import { useDocumentStats } from './hooks/useDocumentStats';
import { useRibbonState } from './ribbon/useRibbonState';
import { uiAlert, uiConfirm, uiPrompt } from './utils/uiPrompt';
import { promptForLink } from './utils/hyperlink';
import { bytesToDataUrl, mimeForImageExt } from './utils/imageInsert';
import { pasteFromClipboard } from './utils/clipboard';
import { insertTableOfContents } from './utils/headings';
import { restyleDocument } from './utils/applyStyle';
import {
  collectCaptions,
  collectIndexEntries,
  commentAnchorPositions,
  nextCaptionNumber,
  sortParagraphs,
  trackedChangePositions,
  updateGeneratedBlocks,
} from './utils/documentIndex';
import { compareDocuments } from './utils/compareDocuments';
import { COVER_PAGE_TEMPLATES } from './constants/coverPages';
import type { DocumentProofingIssue } from './extensions/ProofingCheck';
import type { InkTool } from './extensions/InkDrawing';
import { getPlatform, joinPath, baseName as getFileName, extensionOf as extOf } from './platform';

/** How long after the last keystroke the React copy of the document catches up. */
const CONTENT_MIRROR_DELAY_MS = 300;

function suggestedSavePath(defaultDir: string, name: string, ext = 'docx') {
  const base = name.replace(/\.[^.]+$/, '') || 'Untitled';
  return joinPath(defaultDir, `${base}.${ext}`);
}

function newComment(text: string, author: string, anchorText?: string): DocumentComment {
  return {
    id: crypto.randomUUID(),
    text,
    author,
    created: new Date().toISOString(),
    resolved: false,
    anchorText,
  };
}

function docxExportOpts(envelope: DocumentEnvelope, title: string): DocxExportOptions {
  return {
    title,
    pageSetup: envelope.pageSetup,
    headerFooter: envelope.headerFooter,
    footnotes: envelope.footnotes,
    watermark: envelope.watermark,
    customStyles: envelope.customStyles,
    comments: envelope.comments,
  };
}

function pdfPageSize(pageSetup: PageSetup): string {
  if (pageSetup.size === 'a4') return 'A4';
  if (pageSetup.size === 'legal') return 'Legal';
  return 'Letter';
}

const DEFAULT_MARKUP_OPTIONS: MarkupOptions = {
  insertionsAndDeletions: true,
  formatting: true,
  comments: true,
};

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [recents, setRecents] = useState<RecentFile[]>([]);
  const [envelope, setEnvelope] = useState<DocumentEnvelope>(() =>
    createDocumentEnvelope(TEMPLATES[0].content),
  );
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Untitled');
  const [isDirty, setIsDirty] = useState(false);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [zoom, setZoom] = useState(100);
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [backstageSection, setBackstageSection] = useState<BackstageSection>('info');
  const [findOpen, setFindOpen] = useState(false);
  const [findFocus, setFindFocus] = useState<'find' | 'replace'>('find');
  const [navOpen, setNavOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('print');
  const focusMode = viewMode === 'focus';
  const [showGridlines, setShowGridlines] = useState(false);
  const [markupView, setMarkupView] = useState<MarkupView>('all');
  const [markupOptions, setMarkupOptions] = useState<MarkupOptions>(DEFAULT_MARKUP_OPTIONS);
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  const [headerFooterOpen, setHeaderFooterOpen] = useState(false);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [wordCountOpen, setWordCountOpen] = useState(false);
  const [dialog, setDialog] = useState<
    | null
    | 'font'
    | 'paragraph'
    | 'columns'
    | 'borders'
    | 'pageBorders'
    | 'zoom'
    | 'symbol'
    | 'crossReference'
    | 'altText'
    | 'pictureLayout'
    | 'tableProperties'
    | 'sources'
    | 'recipients'
  >(null);
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [userDictionary, setUserDictionary] = useState<string[]>([]);
  const [sessionIgnored, setSessionIgnored] = useState<string[]>([]);
  const [proofingIssues, setProofingIssues] = useState<DocumentProofingIssue[]>([]);
  const [proofingOpen, setProofingOpen] = useState(false);
  const [thesaurusOpen, setThesaurusOpen] = useState(false);
  const [reviewingPaneOpen, setReviewingPaneOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [themeFontId, setThemeFontId] = useState('office');
  const [themeColorId, setThemeColorId] = useState('office');
  const [ink, setInk] = useState<{ tool: InkTool; color: string; width: number }>({
    tool: 'pen',
    color: '#000000',
    width: 2,
  });
  const [mergeDocumentType, setMergeDocumentType] = useState<MergeDocumentType>('letters');
  const [mergePreview, setMergePreview] = useState({ active: false, index: 0, highlight: false });
  const mergeSource = useRef<unknown>(null);
  const autoSaveTimer = useRef<number | null>(null);
  const contentMirrorTimer = useRef<number | null>(null);
  const { active: formatPainterActive, copyFormat, applyFormat } = useFormatPainter(editor);

  const wordStats = useDocumentStats(editor, pageCount);
  const ribbonState = useRibbonState(editor);

  const ignoredWords = useMemo(
    () => [...userDictionary, ...sessionIgnored],
    [userDictionary, sessionIgnored],
  );

  // The ink pen is a property of the tool, not of each drawing, so the canvases
  // read it from here rather than from their own attributes.
  useEffect(() => {
    window.__DANSWORD_INK__ = ink;
    window.dispatchEvent(new Event('dansword:ink-settings'));
  }, [ink]);

  const cancelContentMirror = useCallback(() => {
    if (contentMirrorTimer.current !== null) {
      window.clearTimeout(contentMirrorTimer.current);
      contentMirrorTimer.current = null;
    }
  }, []);

  /**
   * Mirror the document into React state on a short debounce.
   *
   * This ran on every keystroke: each character replaced `envelope.content`,
   * re-rendering App and the whole editor chrome below it. Nothing needs the
   * mirror to be keystroke-exact — saving reads the editor directly (see
   * `writeDocumentTo`) and the panes only need to be current once the user
   * pauses.
   */
  const handleEditorUpdate = useCallback(
    (json: unknown) => {
      setIsDirty(true);
      cancelContentMirror();
      contentMirrorTimer.current = window.setTimeout(() => {
        contentMirrorTimer.current = null;
        setEnvelope((prev) => ({ ...prev, content: json }));
      }, CONTENT_MIRROR_DELAY_MS);
    },
    [cancelContentMirror],
  );

  useEffect(() => cancelContentMirror, [cancelContentMirror]);

  const updateEnvelope = useCallback((partial: Partial<DocumentEnvelope>) => {
    setEnvelope((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

  const updatePageSetup = useCallback(
    (partial: Partial<PageSetup>) => {
      setEnvelope((prev) => ({ ...prev, pageSetup: { ...prev.pageSetup, ...partial } }));
      setIsDirty(true);
    },
    [],
  );

  const loadRevisions = useCallback(async (path: string) => {
    const list = await getPlatform().listRevisions(path);
    setRevisions(list);
  }, []);

  useEffect(() => {
    applyPrintPageSetup(envelope.pageSetup, envelope.headerFooter);
  }, [envelope.pageSetup, envelope.headerFooter]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty(
      '--accent-hover',
      `color-mix(in srgb, ${settings.accentColor} 85%, black)`,
    );
    document.documentElement.style.setProperty('--font-doc', settings.defaultFontFamily);
    document.documentElement.style.setProperty('--font-doc-size', `${settings.defaultFontSize}pt`);
    getPlatform().setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const initApp = async () => {
      const savedSettings = await getPlatform().getSettings();
      if (savedSettings) {
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      }
      const savedRecents = await getPlatform().getRecents();
      if (savedRecents && savedRecents.length) {
        setRecents(savedRecents);
      }
      setUserDictionary(await getPlatform().getUserDictionary());
    };
    initApp();
  }, []);

  const persistRecents = useCallback(async (next: RecentFile[]) => {
    setRecents(next);
    await getPlatform().setRecents(next);
  }, []);

  const updateRecentFile = useCallback(async (path: string) => {
    const name = getFileName(path);
    const nextRecents = recents.filter((r) => r.path !== path);
    const existing = recents.find((r) => r.path === path);
    const updated = [
      { path, name, lastOpened: Date.now(), pinned: existing?.pinned ?? false },
      ...nextRecents,
    ].slice(0, 30);
    await persistRecents(updated);
  }, [persistRecents, recents]);

  const openDocumentEnvelope = useCallback(
    (env: DocumentEnvelope, path: string | null, name: string) => {
      // A pending mirror belongs to the document being replaced; letting it
      // fire would write the old content over the new one.
      cancelContentMirror();
      setEnvelope(env);
      setFilePath(path);
      setFileName(name);
      setBackstageOpen(false);
      setCommentsOpen(false);
      setNavOpen(false);
      setFindOpen(false);
      setProofingOpen(false);
      setThesaurusOpen(false);
      setReviewingPaneOpen(false);
      setMergePreview({ active: false, index: 0, highlight: false });
      setView('editor');
      setEditorSyncKey((k) => k + 1);
    },
    [cancelContentMirror],
  );

  /** Read a document file into an envelope, for Open and for Compare. */
  const readDocumentAt = useCallback(async (path: string): Promise<DocumentEnvelope | null> => {
    const ext = extOf(path);
    if (ext === 'dansword') {
      const raw = await getPlatform().readTextFile(path);
      try {
        return unwrapDansWordFile(JSON.parse(raw));
      } catch {
        await uiAlert('That .dansword file is corrupted and could not be opened.');
        return null;
      }
    }
    if (ext === 'docx') {
      const buffer = await getPlatform().readFile(path);
      const arrayBuffer = (buffer.buffer as ArrayBuffer).slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
      return importDocxEnvelope(arrayBuffer);
    }
    if (ext === 'doc') {
      const res = await getPlatform().importDoc(path);
      if (res.format === 'docx') return importDocxEnvelope(res.data);
      await uiAlert(res.warning);
      return createDocumentEnvelope(importFromDocText(res.data));
    }
    if (ext === 'rtf') {
      return createDocumentEnvelope(importFromRtf(await getPlatform().readTextFile(path)));
    }
    if (ext === 'html' || ext === 'htm') {
      return createDocumentEnvelope(importFromHtml(await getPlatform().readTextFile(path)));
    }
    if (ext === 'txt') {
      const raw = await getPlatform().readTextFile(path);
      const lines = raw.split(/\r?\n/).map((line) => ({
        type: 'paragraph' as const,
        content: line ? [{ type: 'text' as const, text: line }] : [],
      }));
      return createDocumentEnvelope({ type: 'doc', content: lines });
    }
    await uiAlert('Unsupported file type.');
    return null;
  }, []);

  const openDocumentAtPath = useCallback(
    async (path: string) => {
      const loaded = await readDocumentAt(path);
      if (!loaded) return;
      openDocumentEnvelope(loaded, path, getFileName(path));
      await updateRecentFile(path);
      await loadRevisions(path);
    },
    [readDocumentAt, openDocumentEnvelope, loadRevisions, updateRecentFile],
  );

  /**
   * Write the document to a path in the format its extension names.
   *
   * `adopt` controls whether this becomes the open document. Exports pass
   * false: every Backstage export used to call saveDocument(path), which
   * reassigned filePath and cleared the dirty flag, so after "Export as HTML"
   * the open document *was* the .html file and the next Ctrl+S overwrote it.
   */
  const writeDocumentTo = useCallback(
    async (targetPath: string, adopt: boolean) => {
      const ext = extOf(targetPath);

      // Read the document from the editor, not from `envelope.content`: the
      // mirror is debounced, so saving straight after a keystroke would
      // otherwise write the document as it was up to a third of a second ago.
      const doc: DocumentEnvelope = editor
        ? { ...envelope, content: editor.getJSON() }
        : envelope;

      if (ext === 'docx') {
        const docxBlob = await exportToDocx(doc.content, docxExportOpts(doc, fileName));
        const arrayBuffer = await docxBlob.arrayBuffer();
        await getPlatform().writeFile(targetPath, new Uint8Array(arrayBuffer));
      } else if (ext === 'txt') {
        await getPlatform().writeFile(targetPath, editor?.getText() ?? '');
      } else if (ext === 'rtf') {
        await getPlatform().writeFile(targetPath, exportToRtf(doc.content, fileName));
      } else if (ext === 'html' || ext === 'htm') {
        await getPlatform().writeFile(
          targetPath,
          exportToHtml(doc.content, doc.metadata.title || fileName, {
            author: doc.metadata.author,
            subject: doc.metadata.subject,
          }),
        );
      } else if (ext === 'dansword') {
        const wrapped = wrapDansWordFile(doc.content, doc.metadata, {
          pageSetup: doc.pageSetup,
          headerFooter: doc.headerFooter,
          comments: doc.comments,
          trackChangesEnabled: doc.trackChangesEnabled,
          watermark: doc.watermark,
          customStyles: doc.customStyles,
          footnotes: doc.footnotes,
        });
        await getPlatform().writeFile(targetPath, JSON.stringify(wrapped, null, 2));
      } else {
        // Previously the fallback branch: typing "Report.pdf" in the save
        // dialog silently wrote a .dansword JSON blob under that name.
        await uiAlert(
          `Cannot save as ".${ext || 'unknown'}". Choose .docx, .dansword, .rtf, .html or .txt.`,
        );
        return false;
      }

      // A version snapshot for every format, not just .dansword. Since .docx is
      // the default save format, Version History was empty for normal users.
      await getPlatform()
        .saveRevision(targetPath, doc, `Saved ${new Date().toLocaleString()}`)
        .catch(() => undefined);

      if (adopt) {
        setFilePath(targetPath);
        setFileName(getFileName(targetPath));
        setIsDirty(false);
        await loadRevisions(targetPath);
        await updateRecentFile(targetPath);
      }
      return true;
    },
    [editor, envelope, fileName, loadRevisions, updateRecentFile],
  );

  const saveDocument = useCallback(
    async (pathOverride?: string | null, forceDialog = false) => {
      let targetPath = pathOverride ?? filePath;
      if (!targetPath || forceDialog) {
        const defaultDir = await getPlatform().getDefaultSaveDir();
        const suggested = targetPath ?? suggestedSavePath(defaultDir, fileName, 'docx');
        targetPath = await getPlatform().saveFile(suggested);
        if (!targetPath) return false;
      }
      return writeDocumentTo(targetPath, true);
    },
    [fileName, filePath, writeDocumentTo],
  );

  /** Write a copy in another format without adopting it as the open document. */
  const exportDocumentAs = useCallback(
    async (ext: string) => {
      const defaultDir = await getPlatform().getDefaultSaveDir();
      const path = await getPlatform().saveFile(suggestedSavePath(defaultDir, fileName, ext));
      if (!path) return false;
      return writeDocumentTo(path, false);
    },
    [fileName, writeDocumentTo],
  );

  // Mirror the unsaved-changes flag to the host so it can prompt on close.
  useEffect(() => {
    void getPlatform().setDirty(isDirty);
  }, [isDirty]);

  // Electron adopts the page title for the native window frame, so the OS
  // title bar names the open document instead of just repeating the app name.
  useEffect(() => {
    document.title =
      view === 'editor' ? `${fileName}${isDirty ? ' *' : ''} — DansWord` : 'DansWord';
  }, [view, fileName, isDirty]);

  // The host paused a close so we could save; finish, then let it proceed.
  useEffect(() => {
    return getPlatform().onSaveAndClose(() => {
      void (async () => {
        const saved = await saveDocument().catch(() => false);
        await getPlatform().closeNow(!!saved);
      })();
    });
  }, [saveDocument]);

  // A document opened from Explorer, either at launch or while running.
  useEffect(() => {
    void (async () => {
      const pending = await getPlatform().takePendingFile();
      if (pending) await openDocumentAtPath(pending);
    })();
    return getPlatform().onOpenFile((incoming) => {
      void openDocumentAtPath(incoming);
    });
  }, [openDocumentAtPath]);

  useEffect(() => {
    if (!filePath || settings.autoSaveIntervalMs <= 0) return;
    autoSaveTimer.current && window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(() => {
      saveDocument(filePath);
    }, settings.autoSaveIntervalMs);
    return () => {
      autoSaveTimer.current && window.clearTimeout(autoSaveTimer.current);
    };
  }, [envelope, filePath, saveDocument, settings.autoSaveIntervalMs]);

  const newFromTemplate = useCallback(
    (templateId: string) => {
      const tpl = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
      // The default font belongs in the document, not only in a CSS variable:
      // export reads the document's Normal style, so a new document has to
      // carry the preference for it to reach the .docx.
      const envelopeForTemplate = createDocumentEnvelope(tpl.content, {
        customStyles: builtinStylesWithDefaults(
          settings.defaultFontFamily,
          settings.defaultFontSize,
        ),
      });
      openDocumentEnvelope(envelopeForTemplate, null, 'Untitled');
      setEditorSyncKey((k) => k + 1);
      setIsDirty(false);
      setBackstageOpen(false);
    },
    [openDocumentEnvelope, settings.defaultFontFamily, settings.defaultFontSize],
  );

  const handleInsertImage = useCallback(async () => {
    const path = await getPlatform().openImageFile();
    if (!path || !editor) return;
    const ext = extOf(path);
    if (!['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      await uiAlert('Please choose an image file.');
      return;
    }
    const bytes = await getPlatform().readFile(path);
    const dataUrl = bytesToDataUrl(bytes, mimeForImageExt(ext));
    editor.chain().focus().setImage({ src: dataUrl, alt: getFileName(path) }).run();
  }, [editor]);

  const handleInsertNote = useCallback(
    (kind: 'footnote' | 'endnote') => {
      if (!editor) return;
      // The editor mutation happens here, not inside the state updater: React
      // StrictMode double-invokes updaters, which inserted two references per
      // click in development.
      const existing = kind === 'endnote' ? envelope.endnotes : envelope.footnotes;
      const note = insertNote(editor, existing, kind);
      setEnvelope((prev) =>
        kind === 'endnote'
          ? { ...prev, endnotes: [...prev.endnotes, { id: note.id, text: '' }] }
          : { ...prev, footnotes: [...prev.footnotes, { id: note.id, text: '' }] },
      );
      setIsDirty(true);
      window.setTimeout(() => {
        const selector = kind === 'endnote' ? '.doc-endnotes' : '.doc-footnotes';
        const field = document.querySelector<HTMLElement>(
          `${selector} .doc-footnote-text:last-of-type`,
        );
        field?.focus();
      }, 0);
    },
    [editor, envelope.endnotes, envelope.footnotes],
  );

  const handleNoteChange = useCallback(
    (kind: 'footnote' | 'endnote') => (id: string, text: string) => {
      setEnvelope((prev) => {
        const list = kind === 'endnote' ? prev.endnotes : prev.footnotes;
        const next = list.map((note) => (note.id === id ? { ...note, text } : note));
        return kind === 'endnote' ? { ...prev, endnotes: next } : { ...prev, footnotes: next };
      });
      setIsDirty(true);
    },
    [],
  );

  const exportPdf = useCallback(async () => {
    const defaultDir = await getPlatform().getDefaultSaveDir();
    const suggested = fileName.replace(/\.[^.]+$/, '') || 'Document';
    const targetPath = await getPlatform().saveFile(joinPath(defaultDir, `${suggested}.pdf`));
    if (!targetPath) return;

    applyPrintPageSetup(envelope.pageSetup, envelope.headerFooter);

    // Reset zoom before rendering: the CSS transform would otherwise scale the
    // exported page. Waiting on two animation frames is tied to the browser
    // actually having painted, rather than the previous bare 200ms timeout.
    const originalZoom = zoom;
    setZoom(100);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    try {
      await getPlatform().exportPdf(targetPath, pdfPageSize(envelope.pageSetup));
    } finally {
      setZoom(originalZoom);
    }
  }, [envelope.headerFooter, envelope.pageSetup, fileName, zoom]);

  const togglePin = async (path: string) => {
    const next = recents.map((r) => (r.path === path ? { ...r, pinned: !r.pinned } : r));
    await persistRecents(next);
  };

  const restoreRevision = async (id: string) => {
    if (!filePath) return;
    const snapshot = (await getPlatform().loadRevision(filePath, id)) as Partial<DocumentEnvelope>;
    // Normalise through createDocumentEnvelope: a snapshot written by an older
    // build has none of the fields added since, and the ribbon reads them
    // directly (mailMerge.fields, sources, endnotes…).
    const { content, ...rest } = snapshot;
    setEnvelope(createDocumentEnvelope(content, rest));
    setEditorSyncKey((k) => k + 1);
    setIsDirty(true);
    setBackstageOpen(false);
  };

  /** Design: restyle the document when a style set or theme is picked. */
  const applyDesign = useCallback(
    (styleSetId: string, fontId: string, colorId: string) => {
      const base = builtinStylesWithDefaults(settings.defaultFontFamily, settings.defaultFontSize);
      const styles = applyStyleSet(base, styleSetId, fontId, colorId);
      setEnvelope((prev) => ({ ...prev, customStyles: styles, styleSetId }));
      setIsDirty(true);
      if (editor) restyleDocument(editor, styles);
    },
    [editor, settings.defaultFontFamily, settings.defaultFontSize],
  );

  const goToNextIn = useCallback(
    (positions: number[], delta: number) => {
      if (!editor || !positions.length) return;
      const caret = editor.state.selection.from;
      const ordered = delta > 0 ? positions : [...positions].reverse();
      const next =
        ordered.find((pos) => (delta > 0 ? pos > caret : pos < caret)) ?? ordered[0];
      editor.chain().focus().setTextSelection(next).scrollIntoView().run();
    },
    [editor],
  );

  const insertMergeField = useCallback(
    (field: string) => {
      editor?.chain().focus().insertContent(mergeFieldPlaceholder(field)).run();
    },
    [editor],
  );

  /** Mailings > Preview Results: swap the fields for a recipient's details. */
  const setMergePreviewIndex = useCallback(
    (index: number) => {
      if (!editor) return;
      const records = includedRecords(envelope.mailMerge);
      if (!records.length) return;
      const bounded = Math.max(0, Math.min(records.length - 1, index));
      if (!mergeSource.current) mergeSource.current = editor.getJSON();
      const merged = applyMergeToDocument(mergeSource.current, records[bounded]);
      editor.commands.setContent(merged as never);
      setMergePreview((prev) => ({ ...prev, active: true, index: bounded }));
    },
    [editor, envelope.mailMerge],
  );

  const stopMergePreview = useCallback(() => {
    if (editor && mergeSource.current) {
      editor.commands.setContent(mergeSource.current as never);
    }
    mergeSource.current = null;
    setMergePreview((prev) => ({ ...prev, active: false, index: 0 }));
  }, [editor]);

  const finishMerge = useCallback(
    async (mode: 'documents' | 'print') => {
      if (!editor) return;
      const records = includedRecords(envelope.mailMerge);
      if (!records.length) {
        await uiAlert('Attach a recipient list first: Mailings > Select Recipients.');
        return;
      }
      if (mode === 'print') {
        await uiAlert(
          `Printing merges one page set per recipient. DansWord will print the previewed recipient; step through them with the arrows to print the rest.`,
        );
        await getPlatform().printDocument();
        return;
      }

      const template = mergeSource.current ?? editor.getJSON();
      const defaultDir = await getPlatform().getDefaultSaveDir();
      const base = fileName.replace(/\.[^.]+$/, '') || 'Merged';
      let written = 0;

      for (const [index, record] of records.entries()) {
        const merged = applyMergeToDocument(template, record);
        const doc: DocumentEnvelope = { ...envelope, content: merged };
        const target = joinPath(defaultDir, `${base}-${index + 1}.docx`);
        const blob = await exportToDocx(doc.content, docxExportOpts(doc, `${base} ${index + 1}`));
        const buffer = await blob.arrayBuffer();
        await getPlatform().writeFile(target, new Uint8Array(buffer));
        written += 1;
      }

      await uiAlert(`Wrote ${written} merged ${written === 1 ? 'document' : 'documents'} to ${defaultDir}.`);
    },
    [editor, envelope, fileName],
  );

  const addComment = useCallback(
    async () => {
      if (!editor) return;
      const { from, to, empty } = editor.state.selection;
      const text = await uiPrompt('Comment text');
      if (!text?.trim()) return;
      const anchorText = empty ? undefined : editor.state.doc.textBetween(from, to, ' ');
      const comment = newComment(text.trim(), settings.authorName || 'You', anchorText);
      setEnvelope((prev) => ({ ...prev, comments: [...prev.comments, comment] }));
      setIsDirty(true);
      setCommentsOpen(true);
      if (!empty) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setMark('commentAnchor', { commentId: comment.id })
          .run();
      }
    },
    [editor, settings.authorName],
  );

  const ribbonActions: RibbonActions = useMemo(
    () => ({
      onNew: () => newFromTemplate('blank'),
      onOpenFile: async () => {
        const path = await getPlatform().openFile();
        if (path) await openDocumentAtPath(path);
      },
      onSave: () => void saveDocument(),
      onSaveAs: () => void saveDocument(null, true),
      onOpenBackstage: () => {
        setBackstageOpen(true);
        setBackstageSection('save');
      },
      onPrint: () => void getPlatform().printDocument(),
      onExportPdf: () => void exportPdf(),

      onPaste: (mode) => {
        if (editor) void pasteFromClipboard(editor, mode);
      },
      onFormatPainterCopy: copyFormat,
      onFormatPainterApply: applyFormat,
      onOpenStyleEditor: () => setStyleEditorOpen(true),
      onOpenFontDialog: () => setDialog('font'),
      onOpenParagraphDialog: () => setDialog('paragraph'),
      onOpenBordersDialog: () => setDialog('borders'),
      onSortParagraphs: (direction) => {
        if (editor) sortParagraphs(editor, direction);
      },
      onToggleFormattingMarks: () =>
        setSettings((prev) => ({ ...prev, showFormattingMarks: !prev.showFormattingMarks })),
      onToggleFindReplace: (field) => {
        setFindFocus(field ?? 'find');
        setFindOpen((open) => (field ? true : !open));
      },

      onInsertImage: () => void handleInsertImage(),
      onInsertShape: (type) => editor?.chain().focus().insertShape({ shapeType: type }).run(),
      onInsertTextBox: (style) => editor?.chain().focus().insertTextBox(style).run(),
      onInsertCoverPage: (id) => {
        const blocks = COVER_PAGE_TEMPLATES[id];
        if (!editor || !blocks) return;
        editor.chain().focus().setTextSelection(1).insertContentAt(0, blocks as never).run();
      },
      onInsertBlankPage: () =>
        editor?.chain().focus().insertPageBreak().insertContent({ type: 'paragraph' }).insertPageBreak().run(),
      onOpenHeaderFooter: () => setHeaderFooterOpen(true),
      onInsertPageNumbers: (show) =>
        updateEnvelope({ headerFooter: { ...envelope.headerFooter, showPageNumbers: show } }),
      onOpenSymbolPicker: () => setDialog('symbol'),
      onInsertBookmark: () => {
        if (!editor) return;
        void (async () => {
          // A bookmark is a mark, so it needs a range to attach to. Word allows
          // a collapsed bookmark; here the honest equivalent is to ask for the
          // text it should name rather than silently inserting the name.
          if (editor.state.selection.empty) {
            await uiAlert('Select the text you want to bookmark first.');
            return;
          }
          const name = await uiPrompt('Bookmark name', ribbonState.selectionText.slice(0, 40));
          if (!name?.trim()) return;
          editor.chain().focus().setBookmark(name.trim()).run();
        })();
      },
      onOpenCrossReference: () => setDialog('crossReference'),

      onInsertDrawingCanvas: () => editor?.chain().focus().insertDrawingCanvas().run(),
      onSetInkTool: (tool) => setInk((prev) => ({ ...prev, tool })),
      onSetInkColor: (color) => setInk((prev) => ({ ...prev, color, tool: prev.tool === 'eraser' ? 'pen' : prev.tool })),
      onSetInkWidth: (width) => setInk((prev) => ({ ...prev, width })),

      onApplyStyleSet: (id) => applyDesign(id, themeFontId, themeColorId),
      onApplyThemeFonts: (id) => {
        setThemeFontId(id);
        applyDesign(envelope.styleSetId, id, themeColorId);
      },
      onApplyThemeColors: (id) => {
        setThemeColorId(id);
        applyDesign(envelope.styleSetId, themeFontId, id);
      },
      onApplyParagraphSpacing: (id) => {
        const preset = PARAGRAPH_SPACING_PRESETS.find((entry) => entry.id === id);
        if (!preset || !editor) return;
        editor
          .chain()
          .focus()
          .selectAll()
          .setParagraphSpacing(preset.before, preset.after)
          .setLineSpacing(preset.lineHeight)
          .run();
      },
      onSetAsDefaultFormatting: () => {
        const normal = envelope.customStyles.find((style) => style.id === 'normal');
        if (!normal) return;
        setSettings((prev) => ({
          ...prev,
          defaultFontFamily: normal.fontFamily ?? prev.defaultFontFamily,
          defaultFontSize: Number(String(normal.fontSize ?? '').replace('pt', '')) || prev.defaultFontSize,
        }));
        void uiAlert('New documents will use this formatting.');
      },
      onOpenWatermark: () => setWatermarkOpen(true),
      onSetPageColor: (color) => updatePageSetup({ pageColor: color }),
      onOpenPageBorders: () => setDialog('pageBorders'),

      onOpenPageSetup: () => setPageSetupOpen(true),
      onApplyMarginPreset: (preset) => {
        const margins = MARGIN_PRESETS[preset];
        if (margins) updatePageSetup({ margins: { ...margins } });
      },
      onSetOrientation: (orientation) => updatePageSetup({ orientation }),
      onSetPageSize: (size) => updatePageSetup({ size }),
      onSetColumns: (count) =>
        updatePageSetup({ columns: { ...envelope.pageSetup.columns, count } }),
      onOpenColumnsDialog: () => setDialog('columns'),
      onSetLineNumbers: (mode) => updatePageSetup({ lineNumbers: mode }),
      onToggleHyphenation: () => updatePageSetup({ hyphenation: !envelope.pageSetup.hyphenation }),

      onInsertToc: () => {
        if (editor) void insertTableOfContents(editor);
      },
      onUpdateToc: () => {
        if (!editor) return;
        // The node view renders from the live document, so it is always current;
        // bumping the generation is what makes Update Table a real transaction
        // (and so undoable) rather than a silent no-op.
        if (!updateGeneratedBlocks(editor, 'tableOfContents', { generation: Date.now() })) {
          void uiAlert('This document has no table of contents yet.');
        }
      },
      onInsertFootnote: () => handleInsertNote('footnote'),
      onInsertEndnote: () => handleInsertNote('endnote'),
      onShowNotes: () => {
        const target = document.querySelector('.doc-footnotes, .doc-endnotes');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else void uiAlert('This document has no footnotes or endnotes yet.');
      },
      onInsertCitation: (sourceId) => {
        const source = envelope.sources.find((entry) => entry.id === sourceId);
        if (!source || !editor) return;
        editor.chain().focus().insertContent(` ${formatCitation(source, envelope.citationStyle)}`).run();
      },
      onManageSources: () => setDialog('sources'),
      onSetCitationStyle: (style: CitationStyle) => updateEnvelope({ citationStyle: style }),
      onInsertBibliography: () => {
        if (!editor) return;
        const entries = formatBibliography(envelope.sources, envelope.citationStyle);
        if (updateGeneratedBlocks(editor, 'bibliography', { entries })) return;
        editor
          .chain()
          .focus()
          .insertContent([
            { type: 'bibliography', attrs: { title: 'Bibliography', entries } },
            { type: 'paragraph' },
          ] as never)
          .run();
      },
      onInsertCaption: (label: CaptionLabel) => {
        if (!editor) return;
        void (async () => {
          const number = nextCaptionNumber(editor, label);
          const text = await uiPrompt(`${label} ${number} caption text`, '');
          if (text === null) return;
          editor
            .chain()
            .focus()
            .insertContent({ type: 'paragraph', content: [{ type: 'text', text: `${label} ${number}. ${text}` }] })
            .markAsCaption(label)
            .run();
        })();
      },
      onInsertTableOfFigures: (label: CaptionLabel) => {
        if (!editor) return;
        const entries = collectCaptions(editor)
          .filter((caption) => caption.label === label)
          .map((caption) => caption.text);
        if (updateGeneratedBlocks(editor, 'tableOfFigures', { title: `Table of ${label}s`, entries })) return;
        editor
          .chain()
          .focus()
          .insertContent([
            { type: 'tableOfFigures', attrs: { title: `Table of ${label}s`, entries } },
            { type: 'paragraph' },
          ] as never)
          .run();
      },
      onMarkIndexEntry: () => {
        if (!editor || editor.state.selection.empty) {
          void uiAlert('Select the text to index first.');
          return;
        }
        const entry = ribbonState.selectionText.trim();
        editor.chain().focus().markIndexEntry(entry).run();
      },
      onInsertIndex: () => {
        if (!editor) return;
        const entries = collectIndexEntries(editor);
        if (updateGeneratedBlocks(editor, 'documentIndex', { entries })) return;
        editor
          .chain()
          .focus()
          .insertContent([
            { type: 'documentIndex', attrs: { title: 'Index', entries } },
            { type: 'paragraph' },
          ] as never)
          .run();
      },

      onStartMailMerge: (type) => setMergeDocumentType(type),
      onSelectRecipients: () => {
        void (async () => {
          const path = await getPlatform().openFile();
          if (!path) return;
          const ext = extOf(path);
          if (!['csv', 'txt', 'tsv'].includes(ext)) {
            await uiAlert('Choose a .csv, .tsv or .txt recipient list.');
            return;
          }
          const raw = await getPlatform().readTextFile(path);
          const data = parseRecipientList(raw, getFileName(path));
          if (!data.records.length) {
            await uiAlert('That file has a header row but no recipients.');
            return;
          }
          updateEnvelope({ mailMerge: data });
          setDialog('recipients');
        })();
      },
      onEditRecipients: () => setDialog('recipients'),
      onInsertMergeField: insertMergeField,
      onInsertAddressBlock: () => {
        const records = includedRecords(envelope.mailMerge);
        if (!records.length || !editor) return;
        // Insert the field placeholders, not one recipient's details: the block
        // has to merge for every recipient, exactly as Word's «AddressBlock» does.
        const sample = addressBlock(records[0]);
        const fields = envelope.mailMerge.fields;
        const lines = sample.split('\n').map((line) => {
          const field = fields.find((name) => records[0][name] && line.includes(records[0][name]));
          return field ? mergeFieldPlaceholder(field) : line;
        });
        editor.chain().focus().insertContent(lines.join('\n')).run();
      },
      onInsertGreetingLine: () => {
        const records = includedRecords(envelope.mailMerge);
        if (!records.length || !editor) return;
        const field =
          envelope.mailMerge.fields.find((name) => /last\s*name|surname/i.test(name)) ??
          envelope.mailMerge.fields.find((name) => /first\s*name|name/i.test(name));
        const greeting = field
          ? `Dear ${mergeFieldPlaceholder(field)},`
          : greetingLine(records[0]);
        editor.chain().focus().insertContent(greeting).run();
      },
      onToggleHighlightMergeFields: () =>
        setMergePreview((prev) => ({ ...prev, highlight: !prev.highlight })),
      onTogglePreviewResults: () => {
        if (mergePreview.active) stopMergePreview();
        else setMergePreviewIndex(0);
      },
      onGoToMergeRecord: (index) => setMergePreviewIndex(index),
      onFinishMerge: (mode) => void finishMerge(mode),

      onOpenProofing: () => {
        setProofingOpen(true);
        setThesaurusOpen(false);
      },
      onOpenThesaurus: () => {
        setThesaurusOpen(true);
        setProofingOpen(false);
      },
      onOpenWordCount: () => setWordCountOpen(true),
      onSetLanguage: (language) => setSettings((prev) => ({ ...prev, language })),
      onToggleSpellCheck: () =>
        setSettings((prev) => ({ ...prev, spellCheckEnabled: !prev.spellCheckEnabled })),
      onToggleGrammarCheck: () =>
        setSettings((prev) => ({ ...prev, grammarCheckEnabled: !prev.grammarCheckEnabled })),
      onNewComment: () => void addComment(),
      onDeleteComment: (scope) => {
        if (scope === 'all') {
          updateEnvelope({ comments: [] });
          return;
        }
        if (scope === 'resolved') {
          updateEnvelope({ comments: envelope.comments.filter((comment) => !comment.resolved) });
          return;
        }
        const last = envelope.comments[envelope.comments.length - 1];
        if (last) updateEnvelope({ comments: envelope.comments.filter((c) => c.id !== last.id) });
      },
      onGoToComment: (delta) => {
        if (!editor) return;
        setCommentsOpen(true);
        goToNextIn(
          commentAnchorPositions(editor).map((anchor) => anchor.pos),
          delta,
        );
      },
      onToggleComments: () => setCommentsOpen((open) => !open),
      onToggleTrackChanges: () =>
        updateEnvelope({ trackChangesEnabled: !envelope.trackChangesEnabled }),
      onSetMarkupView: setMarkupView,
      onToggleMarkupOption: (option) =>
        setMarkupOptions((prev) => ({ ...prev, [option]: !prev[option] })),
      onToggleReviewingPane: () => setReviewingPaneOpen((open) => !open),
      onGoToChange: (delta) => {
        if (editor) goToNextIn(trackedChangePositions(editor), delta);
      },
      onCompareDocuments: () => {
        void (async () => {
          if (!editor) return;
          const path = await getPlatform().openFile();
          if (!path) return;
          const other = await readDocumentAt(path);
          if (!other) return;
          const result = compareDocuments(editor.getJSON(), other.content, getFileName(path));
          if (!result.insertions && !result.deletions) {
            await uiAlert('The two documents have the same paragraphs.');
            return;
          }
          editor.commands.setContent(result.content as never);
          setMarkupView('all');
          setReviewingPaneOpen(true);
          setIsDirty(true);
          await uiAlert(
            `Compared against ${getFileName(path)}: ${result.insertions} added and ${result.deletions} removed paragraphs are marked as tracked changes.`,
          );
        })();
      },
      onToggleRestrictEditing: () => {
        void (async () => {
          if (!envelope.restrictEditing) {
            updateEnvelope({ restrictEditing: true });
            return;
          }
          const allow = await uiConfirm('Allow editing this document again?');
          if (allow) updateEnvelope({ restrictEditing: false });
        })();
      },

      onSetViewMode: setViewMode,
      onToggleFocusMode: () => setViewMode((mode) => (mode === 'focus' ? 'print' : 'focus')),
      onToggleRuler: () => setSettings((prev) => ({ ...prev, showRuler: !prev.showRuler })),
      onToggleGridlines: () => setShowGridlines((value) => !value),
      onToggleNavigation: () => setNavOpen((open) => !open),
      onSetZoom: setZoom,
      onOpenZoomDialog: () => setDialog('zoom'),
      onZoomToFit: (fit) => {
        const workspace = document.querySelector('.editor-main');
        const available = (workspace?.clientWidth ?? 900) - 80;
        const dims = envelope.pageSetup;
        const pageWidth = dims.orientation === 'portrait' ? 816 : 1056;
        if (fit === 'pageWidth') setZoom(Math.max(50, Math.round((available / pageWidth) * 100)));
        else if (fit === 'onePage') setZoom(70);
        else setZoom(45);
      },

      onOpenAltText: () => setDialog('altText'),
      onOpenPictureLayout: () => setDialog('pictureLayout'),
      onResetPicture: () => editor?.chain().focus().resetImage().run(),
      onOpenTableProperties: () => setDialog('tableProperties'),
    }),
    [
      addComment,
      applyDesign,
      applyFormat,
      copyFormat,
      editor,
      envelope,
      exportPdf,
      finishMerge,
      goToNextIn,
      handleInsertImage,
      handleInsertNote,
      insertMergeField,
      mergePreview.active,
      newFromTemplate,
      openDocumentAtPath,
      readDocumentAt,
      ribbonState.selectionText,
      saveDocument,
      setMergePreviewIndex,
      stopMergePreview,
      themeColorId,
      themeFontId,
      updateEnvelope,
      updatePageSetup,
    ],
  );

  // Word's keyboard shortcuts that are not editor commands.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O and Ctrl+N make sense anywhere; the rest act on an open document.
      const editorOnly = view === 'editor';
      const key = e.key.toLowerCase();

      if (editorOnly && e.ctrlKey && key === 's') {
        e.preventDefault();
        // Ctrl+Shift+S is Save As, so it must force the dialog rather than
        // silently overwriting the open file.
        saveDocument(null, e.shiftKey);
      }
      if (e.ctrlKey && key === 'o') {
        e.preventDefault();
        (async () => {
          const path = await getPlatform().openFile();
          if (path) await openDocumentAtPath(path);
        })();
      }
      if (e.ctrlKey && key === 'n') {
        e.preventDefault();
        newFromTemplate('blank');
      }
      if (editorOnly && e.ctrlKey && key === 'f') {
        e.preventDefault();
        setFindOpen(true);
        setFindFocus('find');
      }
      // Ctrl+H is Replace: it must land in the replace field, not repeat Ctrl+F.
      if (editorOnly && e.ctrlKey && key === 'h') {
        e.preventDefault();
        setFindOpen(true);
        setFindFocus('replace');
      }
      if (editorOnly && e.ctrlKey && key === 'p') {
        e.preventDefault();
        void getPlatform().printDocument();
      }
      // Ctrl+K runs the same command as Insert > Link.
      if (editorOnly && e.ctrlKey && key === 'k' && editor) {
        e.preventDefault();
        void promptForLink(editor);
      }
      if (editorOnly && e.key === 'F7') {
        e.preventDefault();
        if (e.shiftKey) {
          setThesaurusOpen(true);
          setProofingOpen(false);
        } else {
          setProofingOpen(true);
          setThesaurusOpen(false);
        }
      }
      if (e.ctrlKey && e.key === 'F1') {
        e.preventDefault();
        setRibbonCollapsed((collapsed) => !collapsed);
      }
      if (editorOnly && e.ctrlKey && e.shiftKey && key === 'e') {
        e.preventDefault();
        updateEnvelope({ trackChangesEnabled: !envelope.trackChangesEnabled });
      }
      if (editorOnly && e.ctrlKey && e.altKey && key === 'm') {
        e.preventDefault();
        void addComment();
      }
      if (editorOnly && e.ctrlKey && e.altKey && key === 'f') {
        e.preventDefault();
        handleInsertNote('footnote');
      }
      if (editorOnly && e.ctrlKey && e.altKey && key === 'd') {
        e.preventDefault();
        handleInsertNote('endnote');
      }
      if (editorOnly && e.ctrlKey && e.shiftKey && key === '8') {
        e.preventDefault();
        setSettings((prev) => ({ ...prev, showFormattingMarks: !prev.showFormattingMarks }));
      }
      if (editorOnly && e.ctrlKey && key === 'enter' && editor) {
        e.preventDefault();
        editor.chain().focus().insertPageBreak().run();
      }
      if (editorOnly && e.altKey && e.shiftKey && key === 'x' && editor) {
        e.preventDefault();
        if (!editor.state.selection.empty) {
          editor.chain().focus().markIndexEntry(ribbonState.selectionText.trim()).run();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    addComment,
    editor,
    envelope.trackChangesEnabled,
    handleInsertNote,
    newFromTemplate,
    openDocumentAtPath,
    ribbonState.selectionText,
    saveDocument,
    updateEnvelope,
    view,
  ]);

  const readOnly = envelope.restrictEditing;
  const showRulers = settings.showRuler && viewMode !== 'read' && viewMode !== 'focus';

  return (
    <div className="app-shell" data-testid="app-shell">
      {view === 'editor' && !focusMode && viewMode !== 'read' && (
        <EditorTitleBar
          fileName={fileName}
          isDirty={isDirty}
          theme={settings.theme}
          onSave={() => void saveDocument()}
          onNew={() => newFromTemplate('blank')}
          onPrint={() => void getPlatform().printDocument()}
          onUndo={() => editor?.chain().focus().undo().run()}
          onRedo={() => editor?.chain().focus().redo().run()}
          canUndo={!!editor?.can().undo()}
          canRedo={!!editor?.can().redo()}
          onHome={() => setView('home')}
          onToggleTheme={() =>
            setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
          }
        />
      )}

      {view === 'editor' && viewMode !== 'read' && (
        <Ribbon
          activeTab={ribbonTab}
          onTabChange={setRibbonTab}
          editor={editor}
          collapsed={ribbonCollapsed}
          onToggleCollapsed={() => setRibbonCollapsed((collapsed) => !collapsed)}
          actions={ribbonActions}
          flags={{
            trackChangesEnabled: envelope.trackChangesEnabled,
            formatPainterActive,
            focusMode,
            customStyles: envelope.customStyles,
            pendingInsertions: wordStats.insertions,
            pendingDeletions: wordStats.deletions,
            viewMode,
            zoom,
            showFormattingMarks: settings.showFormattingMarks,
            showRuler: settings.showRuler,
            showGridlines,
            navigationOpen: navOpen,
            commentsOpen,
            reviewingPaneOpen,
            markupView,
            markupOptions,
            restrictEditing: envelope.restrictEditing,
            language: settings.language,
            spellCheckEnabled: settings.spellCheckEnabled,
            grammarCheckEnabled: settings.grammarCheckEnabled,
            pageSetup: envelope.pageSetup,
            watermarkEnabled: envelope.watermark.enabled,
            showPageNumbers: envelope.headerFooter.showPageNumbers,
            styleSetId: envelope.styleSetId,
            themeFontId,
            themeColorId,
            citationStyle: envelope.citationStyle,
            sources: envelope.sources,
            mailMerge: envelope.mailMerge,
            mergeDocumentType,
            mergePreview,
            commentCount: envelope.comments.length,
            unresolvedComments: envelope.comments.filter((comment) => !comment.resolved).length,
            ink,
            proofingIssues: proofingIssues.length,
          }}
        />
      )}

      {view === 'home' ? (
        <HomeScreen
          recents={recents}
          settings={settings}
          onNewFromTemplate={newFromTemplate}
          onOpenFile={async () => {
            const path = await getPlatform().openFile();
            if (path) await openDocumentAtPath(path);
          }}
          onOpenRecent={openDocumentAtPath}
          onBrowseFolder={async () => {
            const path = await getPlatform().openFolder();
            if (!path) return;
            const docs = await getPlatform().listDocuments(path);
            if (!docs.length) {
              await uiAlert('No documents found in that folder.');
              return;
            }
            await openDocumentAtPath(docs[0].path);
          }}
          onTogglePin={togglePin}
          onRemoveRecent={(path) => void persistRecents(recents.filter((r) => r.path !== path))}
          onOpenSettings={() => {
            setBackstageOpen(true);
            setBackstageSection('options');
          }}
          onToggleTheme={() =>
            setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
          }
          onGoToEditor={() => setView('editor')}
        />
      ) : (
        <>
          <FindReplaceBar
            editor={editor}
            open={findOpen}
            focusField={findFocus}
            onClose={() => setFindOpen(false)}
          />
          {readOnly && (
            <div className="restrict-banner" data-testid="restrict-banner">
              This document is restricted to reading. Review &gt; Restrict Editing turns editing back
              on.
            </div>
          )}
          <div className="editor-workspace">
            <NavigationPane editor={editor} open={navOpen} onClose={() => setNavOpen(false)} />
            <div className="editor-main">
              <div
                className={`editor-scroll view-${viewMode}${focusMode ? ' focus-mode' : ''}${
                  viewMode === 'web' ? ' web-layout' : ''
                }`}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <DocumentRulers
                  pageSetup={envelope.pageSetup}
                  visible={showRulers}
                  onMarginsChange={(margins) => updatePageSetup({ margins })}
                >
                  <WordEditor
                    key={`${filePath ?? fileName}-${editorSyncKey}`}
                    content={envelope.content}
                    pageSetup={envelope.pageSetup}
                    headerFooter={envelope.headerFooter}
                    watermark={envelope.watermark}
                    footnotes={envelope.footnotes}
                    endnotes={envelope.endnotes}
                    spellCheckEnabled={settings.spellCheckEnabled}
                    grammarCheckEnabled={settings.grammarCheckEnabled}
                    autoCorrectEnabled={settings.autoCorrectEnabled}
                    showFormattingMarks={settings.showFormattingMarks}
                    showGridlines={showGridlines}
                    markupView={markupOptions.insertionsAndDeletions ? markupView : 'none'}
                    readOnly={readOnly}
                    highlightMergeFields={mergePreview.highlight}
                    language={settings.language}
                    ignoredWords={ignoredWords}
                    trackChangesEnabled={envelope.trackChangesEnabled}
                    author={settings.authorName || 'You'}
                    onUpdate={handleEditorUpdate}
                    onReady={setEditor}
                    onPageCountChange={setPageCount}
                    onCurrentPageChange={setCurrentPage}
                    onFootnoteChange={handleNoteChange('footnote')}
                    onEndnoteChange={handleNoteChange('endnote')}
                    onProofingIssues={setProofingIssues}
                    onContextMenu={setContextMenu}
                  />
                </DocumentRulers>
              </div>
            </div>
            <ProofingPane
              open={proofingOpen}
              editor={editor}
              issues={proofingIssues}
              language={settings.language}
              onClose={() => setProofingOpen(false)}
              onAddToDictionary={(word) => {
                void getPlatform().addWordToDictionary(word).then(setUserDictionary);
              }}
              onIgnoreAll={(word) =>
                setSessionIgnored((prev) => (prev.includes(word) ? prev : [...prev, word]))
              }
            />
            <ThesaurusPane
              open={thesaurusOpen}
              editor={editor}
              selectionText={ribbonState.selectionText}
              onClose={() => setThesaurusOpen(false)}
            />
            <ReviewingPane
              open={reviewingPaneOpen}
              editor={editor}
              comments={markupOptions.comments ? envelope.comments : []}
              onClose={() => setReviewingPaneOpen(false)}
            />
            <CommentsPane
              open={commentsOpen}
              editor={editor}
              comments={envelope.comments}
              onAdd={(text, anchorText) => {
                const comment = newComment(text, settings.authorName || 'You', anchorText);
                updateEnvelope({ comments: [...envelope.comments, comment] });
                return comment.id;
              }}
              onResolve={(id) =>
                updateEnvelope({
                  comments: envelope.comments.map((c) =>
                    c.id === id ? { ...c, resolved: true } : c,
                  ),
                })
              }
              onDelete={(id) =>
                updateEnvelope({ comments: envelope.comments.filter((c) => c.id !== id) })
              }
              onClose={() => setCommentsOpen(false)}
            />
          </div>
          <StatusBar
            words={wordStats.words}
            pages={wordStats.pages}
            zoom={zoom}
            onZoomChange={setZoom}
            language={settings.language}
            trackChangesEnabled={envelope.trackChangesEnabled}
            pendingChanges={wordStats.insertions + wordStats.deletions}
            currentPage={currentPage}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            proofingIssues={proofingIssues.length}
            spellCheckEnabled={settings.spellCheckEnabled}
            readOnly={readOnly}
            onOpenProofing={() => setProofingOpen(true)}
            onOpenWordCount={() => setWordCountOpen(true)}
            onZoomToFit={ribbonActions.onZoomToFit}
          />
          <MiniToolbar
            editor={editor}
            state={ribbonState}
            enabled={!readOnly && viewMode !== 'read'}
            onFormatPainter={() => (formatPainterActive ? applyFormat() : copyFormat())}
          />
          <EditorContextMenu
            state={contextMenu}
            editor={editor}
            onClose={() => setContextMenu(null)}
            onAddToDictionary={(word) => {
              void getPlatform().addWordToDictionary(word).then(setUserDictionary);
            }}
            onIgnoreAll={(word) =>
              setSessionIgnored((prev) => (prev.includes(word) ? prev : [...prev, word]))
            }
            onPaste={() => {
              if (editor) void pasteFromClipboard(editor);
            }}
            onOpenFontDialog={() => setDialog('font')}
            onOpenParagraphDialog={() => setDialog('paragraph')}
            onNewComment={() => void addComment()}
            onOpenProofing={() => setProofingOpen(true)}
            onOpenThesaurus={() => setThesaurusOpen(true)}
            onOpenAltText={() => setDialog('altText')}
          />
        </>
      )}

      <PageSetupDialog
        open={pageSetupOpen}
        pageSetup={envelope.pageSetup}
        onChange={(pageSetup: PageSetup) => updateEnvelope({ pageSetup })}
        onClose={() => setPageSetupOpen(false)}
      />
      <HeaderFooterDialog
        open={headerFooterOpen}
        header={envelope.headerFooter.header}
        footer={envelope.headerFooter.footer}
        showPageNumbers={envelope.headerFooter.showPageNumbers}
        onChange={(header, footer, showPageNumbers) =>
          updateEnvelope({ headerFooter: { header, footer, showPageNumbers } })
        }
        onClose={() => setHeaderFooterOpen(false)}
      />

      <WatermarkDialog
        open={watermarkOpen}
        watermark={envelope.watermark}
        onChange={(watermark) => updateEnvelope({ watermark })}
        onClose={() => setWatermarkOpen(false)}
      />
      <WordCountDialog
        open={wordCountOpen}
        editor={editor}
        pages={wordStats.pages}
        onClose={() => setWordCountOpen(false)}
      />
      <StyleEditorDialog
        open={styleEditorOpen}
        styles={envelope.customStyles}
        onChange={(customStyles) => updateEnvelope({ customStyles })}
        onClose={() => setStyleEditorOpen(false)}
      />

      <FontDialog
        open={dialog === 'font'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <ParagraphDialog
        open={dialog === 'paragraph'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <ColumnsDialog
        open={dialog === 'columns'}
        pageSetup={envelope.pageSetup}
        onChange={(pageSetup) => updateEnvelope({ pageSetup })}
        onClose={() => setDialog(null)}
      />
      <BordersShadingDialog
        open={dialog === 'borders'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <PageBordersDialog
        open={dialog === 'pageBorders'}
        pageSetup={envelope.pageSetup}
        onChange={(pageSetup) => updateEnvelope({ pageSetup })}
        onClose={() => setDialog(null)}
      />
      <ZoomDialog
        open={dialog === 'zoom'}
        zoom={zoom}
        onChange={setZoom}
        onFit={(fit) => ribbonActions.onZoomToFit(fit)}
        onClose={() => setDialog(null)}
      />
      <TablePropertiesDialog
        open={dialog === 'tableProperties'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <SymbolDialog open={dialog === 'symbol'} editor={editor} onClose={() => setDialog(null)} />
      <CrossReferenceDialog
        open={dialog === 'crossReference'}
        editor={editor}
        onClose={() => setDialog(null)}
      />
      <AltTextDialog
        open={dialog === 'altText'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <PictureLayoutDialog
        open={dialog === 'pictureLayout'}
        editor={editor}
        state={ribbonState}
        onClose={() => setDialog(null)}
      />
      <SourcesDialog
        open={dialog === 'sources'}
        sources={envelope.sources}
        citationStyle={envelope.citationStyle}
        onChange={(sources) => updateEnvelope({ sources })}
        onClose={() => setDialog(null)}
      />
      <RecipientsDialog
        open={dialog === 'recipients'}
        data={envelope.mailMerge}
        onChange={(mailMerge: MailMergeData) => updateEnvelope({ mailMerge })}
        onClose={() => setDialog(null)}
      />

      {backstageOpen && (
        <Backstage
          section={backstageSection}
          onSectionChange={setBackstageSection}
          onClose={() => setBackstageOpen(false)}
          onNew={() => {
            newFromTemplate('blank');
            setBackstageOpen(false);
          }}
          onOpen={async () => {
            const path = await getPlatform().openFile();
            if (path) await openDocumentAtPath(path);
            setBackstageOpen(false);
          }}
          onSave={async () => {
            await saveDocument();
            setBackstageOpen(false);
          }}
          onSaveAs={async () => {
            await saveDocument(null, true);
            setBackstageOpen(false);
          }}
          onExportDocx={async () => {
            await exportDocumentAs('docx');
            setBackstageOpen(false);
          }}
          onExportDansword={async () => {
            await exportDocumentAs('dansword');
            setBackstageOpen(false);
          }}
          onExportPdf={() => {
            exportPdf();
            setBackstageOpen(false);
          }}
          onPrint={async () => {
            await getPlatform().printDocument();
            setBackstageOpen(false);
          }}
          settings={settings}
          onSettingsChange={setSettings}
          fileName={fileName}
          filePath={filePath}
          revisions={revisions}
          onRestoreRevision={restoreRevision}
          metadata={envelope.metadata}
          onMetadataChange={(metadata) => updateEnvelope({ metadata })}
          onExportRtf={async () => {
            await exportDocumentAs('rtf');
            setBackstageOpen(false);
          }}
          onExportHtml={async () => {
            await exportDocumentAs('html');
            setBackstageOpen(false);
          }}
        />
      )}

      <UiPromptHost />
    </div>
  );
}
