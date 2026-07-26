import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  DEFAULT_SETTINGS,
  TEMPLATES,
  MARGIN_PRESETS,
  createDocumentEnvelope,
  type AppSettings,
  type AppView,
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
import type { RibbonActions } from './ribbon/types';
import { StatusBar } from './components/StatusBar';
import { Backstage, type BackstageSection } from './components/Backstage';
import { WordEditor, getWordCount, insertFootnote } from './components/WordEditor';
import { FindReplaceBar } from './components/FindReplaceBar';
import { NavigationPane } from './components/NavigationPane';
import { DocumentRulers } from './components/DocumentRulers';
import { EditorTitleBar } from './components/EditorTitleBar';
import { PageSetupDialog, HeaderFooterDialog } from './components/PageSetupDialog';
import { CommentsPane } from './components/CommentsPane';
import { UiPromptHost } from './components/UiPromptHost';
import { useFormatPainter } from './hooks/useFormatPainter';
import { uiAlert } from './utils/uiPrompt';
import { bytesToDataUrl, mimeForImageExt } from './utils/imageInsert';
import { getPlatform, joinPath, baseName as getFileName, extensionOf as extOf } from './platform';

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
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('edit');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [zoom, setZoom] = useState(100);
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [backstageSection, setBackstageSection] = useState<BackstageSection>('info');
  const [findOpen, setFindOpen] = useState(false);
  const [findFocus, setFindFocus] = useState<'find' | 'replace'>('find');
  const [navOpen, setNavOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'print' | 'web' | 'focus'>('print');
  const focusMode = viewMode === 'focus';
  const setFocusMode = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(focusMode) : next;
    setViewMode(value ? 'focus' : 'print');
  };
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  const [headerFooterOpen, setHeaderFooterOpen] = useState(false);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [wordCountOpen, setWordCountOpen] = useState(false);
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [userDictionary, setUserDictionary] = useState<string[]>([]);
  const autoSaveTimer = useRef<number | null>(null);
  const { active: formatPainterActive, copyFormat, applyFormat } = useFormatPainter(editor);

  const wordStats = getWordCount(editor, pageCount);

  const updateEnvelope = useCallback((partial: Partial<DocumentEnvelope>) => {
    setEnvelope((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

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

  const openDocumentEnvelope = useCallback((env: DocumentEnvelope, path: string | null, name: string) => {
    setEnvelope(env);
    setFilePath(path);
    setFileName(name);
    setBackstageOpen(false);
    setCommentsOpen(false);
    setNavOpen(false);
    setFindOpen(false);
    setView('editor');
    setEditorSyncKey((k) => k + 1);
  }, []);

  const openDocumentAtPath = useCallback(async (path: string) => {
    const ext = extOf(path);
    if (ext === 'dansword') {
      const raw = await getPlatform().readTextFile(path);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        await uiAlert('That .dansword file is corrupted and could not be opened.');
        return;
      }
      openDocumentEnvelope(unwrapDansWordFile(parsed), path, getFileName(path));
    } else if (ext === 'docx') {
      const buffer = await getPlatform().readFile(path);
      const arrayBuffer = (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      openDocumentEnvelope(await importDocxEnvelope(arrayBuffer), path, getFileName(path));
    } else if (ext === 'doc') {
      const res = await getPlatform().importDoc(path);
      if (res.format === 'docx') {
        openDocumentEnvelope(await importDocxEnvelope(res.data), path, getFileName(path));
      } else {
        openDocumentEnvelope(createDocumentEnvelope(importFromDocText(res.data)), path, getFileName(path));
        await uiAlert(res.warning);
      }
    } else if (ext === 'rtf') {
      const raw = await getPlatform().readTextFile(path);
      openDocumentEnvelope(createDocumentEnvelope(importFromRtf(raw)), path, getFileName(path));
    } else if (ext === 'html' || ext === 'htm') {
      const raw = await getPlatform().readTextFile(path);
      openDocumentEnvelope(createDocumentEnvelope(importFromHtml(raw)), path, getFileName(path));
    } else if (ext === 'txt') {
      const raw = await getPlatform().readTextFile(path);
      const lines = raw.split(/\r?\n/).map((line) => ({
        type: 'paragraph' as const,
        content: line ? [{ type: 'text' as const, text: line }] : [],
      }));
      openDocumentEnvelope(
        createDocumentEnvelope({ type: 'doc', content: lines }),
        path,
        getFileName(path)
      );
    } else {
      await uiAlert('Unsupported file type.');
      return;
    }
    await updateRecentFile(path);
    await loadRevisions(path);
  }, [openDocumentEnvelope, loadRevisions, updateRecentFile]);

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

      if (ext === 'docx') {
        const docxBlob = await exportToDocx(envelope.content, docxExportOpts(envelope, fileName));
        const arrayBuffer = await docxBlob.arrayBuffer();
        await getPlatform().writeFile(targetPath, new Uint8Array(arrayBuffer));
      } else if (ext === 'txt') {
        await getPlatform().writeFile(targetPath, editor?.getText() ?? '');
      } else if (ext === 'rtf') {
        await getPlatform().writeFile(targetPath, exportToRtf(envelope.content, fileName));
      } else if (ext === 'html' || ext === 'htm') {
        await getPlatform().writeFile(
          targetPath,
          exportToHtml(envelope.content, envelope.metadata.title || fileName, {
            author: envelope.metadata.author,
            subject: envelope.metadata.subject,
          }),
        );
      } else if (ext === 'dansword') {
        const wrapped = wrapDansWordFile(envelope.content, envelope.metadata, {
          pageSetup: envelope.pageSetup,
          headerFooter: envelope.headerFooter,
          comments: envelope.comments,
          trackChangesEnabled: envelope.trackChangesEnabled,
          watermark: envelope.watermark,
          customStyles: envelope.customStyles,
          footnotes: envelope.footnotes,
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
        .saveRevision(targetPath, envelope, `Saved ${new Date().toLocaleString()}`)
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

  const newFromTemplate = useCallback((templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
    openDocumentEnvelope(createDocumentEnvelope(tpl.content), null, 'Untitled');
    setEditorSyncKey((k) => k + 1);
    setIsDirty(false);
    setBackstageOpen(false);
  }, [openDocumentEnvelope]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O and Ctrl+N make sense anywhere; the rest act on an open document.
      const editorOnly = view === 'editor';
      if (editorOnly && e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDocument();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        (async () => {
          const path = await getPlatform().openFile();
          if (path) await openDocumentAtPath(path);
        })();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newFromTemplate('blank');
      }
      if (editorOnly && e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
        setFindFocus('find');
      }
      // Ctrl+H is Replace: it must land in the replace field, not repeat Ctrl+F.
      if (editorOnly && e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setFindOpen(true);
        setFindFocus('replace');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDocumentAtPath, saveDocument, view, newFromTemplate]);


  const handleInsertImage = async () => {
    const path = await getPlatform().openImageFile();
    if (!path || !editor) return;
    const ext = extOf(path);
    if (!['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      await uiAlert('Please choose an image file.');
      return;
    }
    const bytes = await getPlatform().readFile(path);
    const dataUrl = bytesToDataUrl(bytes, mimeForImageExt(ext));
    const altText = getFileName(path);
    editor.chain().focus().setImage({ src: dataUrl, alt: altText }).run();
  };

  const handleInsertShape = (type: import('./extensions/DocShape').ShapeType) => {
    if (!editor) return;
    editor.chain().focus().insertShape({ shapeType: type }).run();
  };

  const handleInsertFootnote = () => {
    if (!editor) return;
    // The editor mutation happens here, not inside the state updater: React
    // StrictMode double-invokes updaters, which inserted two references per
    // click in development.
    const fn = insertFootnote(editor, envelope.footnotes, '');
    setEnvelope((prev) => ({
      ...prev,
      footnotes: [...prev.footnotes, { id: fn.id, text: '' }],
    }));
    setIsDirty(true);
    window.setTimeout(() => {
      const note = document.querySelector<HTMLElement>('.doc-footnote-text:last-of-type');
      note?.focus();
    }, 0);
  };

  const handleFootnoteChange = (id: string, text: string) => {
    setEnvelope((prev) => ({
      ...prev,
      footnotes: prev.footnotes.map((note) => (note.id === id ? { ...note, text } : note)),
    }));
    setIsDirty(true);
  };

  const exportPdf = async () => {
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
  };

  const togglePin = async (path: string) => {
    const next = recents.map((r) => (r.path === path ? { ...r, pinned: !r.pinned } : r));
    await persistRecents(next);
  };

  const restoreRevision = async (id: string) => {
    if (!filePath) return;
    const snapshot = await getPlatform().loadRevision(filePath, id);
    setEnvelope(snapshot as DocumentEnvelope);
    setEditorSyncKey((k) => k + 1);
    setIsDirty(true);
    setBackstageOpen(false);
  };

  const ribbonActions: RibbonActions = {
    onPrint: () => void getPlatform().printDocument(),
    onExportPdf: exportPdf,
    onInsertImage: handleInsertImage,
    onOpenPageSetup: () => setPageSetupOpen(true),
    onApplyMarginPreset: (preset) => {
      const margins = MARGIN_PRESETS[preset];
      if (margins) {
        updateEnvelope({ pageSetup: { ...envelope.pageSetup, margins: { ...margins } } });
      }
    },
    onOpenHeaderFooter: () => setHeaderFooterOpen(true),
    onToggleNavigation: () => setNavOpen((v) => !v),
    onToggleComments: () => setCommentsOpen((v) => !v),
    onToggleFindReplace: () => setFindOpen((v) => !v),
    onToggleFocusMode: () => setFocusMode((v) => !v),
    onToggleTrackChanges: () =>
      updateEnvelope({ trackChangesEnabled: !envelope.trackChangesEnabled }),
    onFormatPainterCopy: copyFormat,
    onFormatPainterApply: applyFormat,
    onOpenStyleEditor: () => setStyleEditorOpen(true),
    onOpenWatermark: () => setWatermarkOpen(true),
    onOpenWordCount: () => setWordCountOpen(true),
    onNew: () => newFromTemplate('blank'),
    onOpenFile: async () => {
      const path = await getPlatform().openFile();
      if (path) await openDocumentAtPath(path);
    },
    onSave: () => void saveDocument(),
    onOpenBackstage: () => {
      setBackstageOpen(true);
      setBackstageSection('save');
    },
    onInsertShape: handleInsertShape,
    onInsertFootnote: handleInsertFootnote,
  };

  return (
    <div className="app-shell" data-testid="app-shell">
      {view === 'editor' && !focusMode && (
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

      {view === 'editor' && (
        <Ribbon
          activeTab={ribbonTab}
          onTabChange={setRibbonTab}
          editor={editor}
          trackChangesEnabled={envelope.trackChangesEnabled}
          formatPainterActive={formatPainterActive}
          focusMode={focusMode}
          customStyles={envelope.customStyles}
          actions={ribbonActions}
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
          <div className="editor-workspace">
            <NavigationPane editor={editor} open={navOpen} onClose={() => setNavOpen(false)} />
            <div className="editor-main">
              <div
                className={`editor-scroll${focusMode ? ' focus-mode' : ''}${
                  viewMode === 'web' ? ' web-layout' : ''
                }`}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <DocumentRulers pageSetup={envelope.pageSetup}>
                  <WordEditor
                    key={`${filePath ?? fileName}-${editorSyncKey}`}
                    content={envelope.content}
                    pageSetup={envelope.pageSetup}
                    headerFooter={envelope.headerFooter}
                    watermark={envelope.watermark}
                    footnotes={envelope.footnotes}
                    spellCheckEnabled={settings.spellCheckEnabled}
                    language={settings.language}
                    ignoredWords={userDictionary}
                    trackChangesEnabled={envelope.trackChangesEnabled}
                    author={settings.authorName || 'You'}
                    onUpdate={(json) => updateEnvelope({ content: json })}
                    onReady={setEditor}
                    onPageCountChange={setPageCount}
                    onCurrentPageChange={setCurrentPage}
                    onFootnoteChange={handleFootnoteChange}
                    onAddToDictionary={(word) => {
                      void getPlatform()
                        .addWordToDictionary(word)
                        .then(setUserDictionary);
                    }}
                  />
                </DocumentRulers>
              </div>
            </div>
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
            currentPage={currentPage}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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
