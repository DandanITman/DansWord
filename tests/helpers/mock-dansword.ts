import type { Editor } from '@tiptap/react';
import type { AppSettings, DocumentRevision, RecentFile } from '@dansword/core';
import { DEFAULT_SETTINGS } from '@dansword/core';

const FS_KEY = 'dansword-test-fs';
const SETTINGS_KEY = 'dansword-test-settings';
const RECENTS_KEY = 'dansword-test-recents';
const REVISIONS_KEY = 'dansword-test-revisions';
const BINARY_PREFIX = '__B64__:';

export type ImportDocResult =
  | { format: 'docx'; data: ArrayBuffer; source: 'libreoffice' }
  | { format: 'text'; data: string; source: 'extractor'; warning: string };

export interface DansWordTestHarness {
  reset: () => void;
  setOpenFileResult: (path: string | null) => void;
  setSaveFileResult: (path: string | null) => void;
  setImportDocResult: (result: ImportDocResult) => void;
  setSpellCheckResults: (results: boolean[]) => void;
  setSpellSuggestions: (words: string[]) => void;
  readStoredFile: (path: string) => string | null;
  readStoredBinaryBase64: (path: string) => string | null;
  listStoredFiles: () => string[];
  seedFile: (path: string, content: string) => void;
  seedBinaryFile: (path: string, base64: string) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  setRecents: (recents: RecentFile[]) => void;
  getRecents: () => RecentFile[];
  setEditor: (editor: Editor | null) => void;
  loadEditorContent: (content: unknown) => void;
  getEditorJson: () => unknown;
  getEditorText: () => string;
  getEditorSelectionText: () => string;
  runEditorCommand: (
    command:
      | 'toggleBulletList'
      | 'toggleOrderedList'
      | 'setTextAlignCenter'
      | 'setTextAlignJustify'
      | 'toggleStrike'
      | 'toggleSuperscript'
      | 'toggleSubscript'
      | 'toggleBold'
      | 'setFontFamily'
      | 'insertTable'
      | 'insertPageBreak'
      | 'selectAll'
      | 'clearFormatting'
      | 'toggleHeading1',
    arg?: string,
  ) => void;
  getExportPdfCallCount: () => number;
  getPrintCallCount: () => number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function normalizePath(filePath: string) {
  return filePath.replace(/\//g, '\\');
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function installMockDansword(target: Window & typeof globalThis): DansWordTestHarness {
  let nextOpenFile: string | null = null;
  let nextSaveFile: string | null | undefined = undefined;
  let nextImportDoc: ImportDocResult | null = null;
  let spellResults: boolean[] | null = null;
  let spellSuggestions: string[] = ['suggestion'];
  let exportPdfCalls = 0;
  let printCalls = 0;
  let editorRef: Editor | null = null;

  const getFs = (): Record<string, string> => readJson(FS_KEY, {});
  const setFs = (fs: Record<string, string>) => writeJson(FS_KEY, fs);

  const getRevisions = (): Record<string, DocumentRevision[]> => readJson(REVISIONS_KEY, {});
  const setRevisions = (data: Record<string, DocumentRevision[]>) => writeJson(REVISIONS_KEY, data);

  const defaultImportDoc = (): ImportDocResult => ({
    format: 'text',
    data: 'Legacy doc text fallback',
    source: 'extractor',
    warning: 'Test mock import',
  });

  const api = {
    openFile: async () => {
      const path = nextOpenFile;
      nextOpenFile = null;
      return path;
    },
    saveFile: async (defaultPath?: string) => {
      if (nextSaveFile === null) {
        nextSaveFile = undefined;
        return null;
      }
      const path = nextSaveFile ?? defaultPath ?? 'C:\\DansWordTest\\Untitled.docx';
      nextSaveFile = undefined;
      return normalizePath(path);
    },
    openFolder: async () => 'C:\\DansWordTest\\folder',
    readFile: async (filePath: string) => {
      const content = getFs()[normalizePath(filePath)];
      if (content == null) throw new Error(`Missing test file: ${filePath}`);
      if (content.startsWith(BINARY_PREFIX)) {
        return base64ToBytes(content.slice(BINARY_PREFIX.length));
      }
      return new TextEncoder().encode(content);
    },
    readTextFile: async (filePath: string) => {
      const content = getFs()[normalizePath(filePath)];
      if (content == null) throw new Error(`Missing test file: ${filePath}`);
      if (content.startsWith(BINARY_PREFIX)) {
        return new TextDecoder().decode(base64ToBytes(content.slice(BINARY_PREFIX.length)));
      }
      return content;
    },
    writeFile: async (filePath: string, data: Uint8Array | string) => {
      const fs = getFs();
      const key = normalizePath(filePath);
      if (typeof data === 'string') {
        fs[key] = data;
      } else {
        fs[key] = `${BINARY_PREFIX}${bytesToBase64(data)}`;
      }
      setFs(fs);
      return true;
    },
    listDocuments: async (folderPath: string) => {
      const prefix = normalizePath(folderPath);
      return Object.keys(getFs())
        .filter((p) => p.startsWith(prefix))
        .map((p) => ({
          path: p,
          name: p.split('\\').pop() ?? p,
          modified: Date.parse('2026-01-15T12:00:00.000Z'),
          size: getFs()[p]?.length ?? 0,
        }));
    },
    getSettings: async () =>
      ({
        ...DEFAULT_SETTINGS,
        autoSaveIntervalMs: 0,
        ...readJson<Partial<AppSettings> | null>(SETTINGS_KEY, null),
      }) as AppSettings,
    setSettings: async (settings: AppSettings) => {
      writeJson(SETTINGS_KEY, settings);
      return true;
    },
    getRecents: async () => readJson<RecentFile[]>(RECENTS_KEY, []),
    setRecents: async (recents: RecentFile[]) => {
      writeJson(RECENTS_KEY, recents);
      return true;
    },
    showItemInFolder: async () => {},
    getDocumentsPath: async () => 'C:\\Users\\Test\\Documents',
    getDefaultSaveDir: async () => 'C:\\DansWordTest',
    printDocument: async () => {
      printCalls += 1;
      return true;
    },
    saveRevision: async (docPath: string, snapshot: unknown, label: string) => {
      const all = getRevisions();
      const key = normalizePath(docPath);
      const revision = {
        id: `rev-${(all[key]?.length ?? 0) + 1}`,
        label,
        timestamp: Date.now(),
        filePath: docPath,
        snapshot,
      } as DocumentRevision & { snapshot: unknown };
      all[key] = [...(all[key] ?? []), revision];
      setRevisions(all);
      return revision;
    },
    listRevisions: async (docPath: string) => getRevisions()[normalizePath(docPath)] ?? [],
    loadRevision: async (docPath: string, id: string) => {
      const match = (getRevisions()[normalizePath(docPath)] ?? []).find((r) => r.id === id) as
        | (DocumentRevision & { snapshot?: unknown })
        | undefined;
      if (!match?.snapshot) throw new Error(`Missing revision ${id}`);
      return match.snapshot;
    },
    exportPdf: async () => {
      exportPdfCalls += 1;
      return new Uint8Array([37, 80, 68, 70]);
    },
    importDoc: async () => {
      const result = nextImportDoc ?? defaultImportDoc();
      nextImportDoc = null;
      return result;
    },
    spellCheckWords: async (words: string[]) => {
      if (spellResults) return spellResults.slice(0, words.length);
      return words.map((w) => w.toLowerCase() !== 'teh');
    },
    spellSuggest: async () => spellSuggestions,
    startCollabServer: async () => ({ port: 8765, url: 'ws://127.0.0.1:8765' }),
    stopCollabServer: async () => true,
    getCollabUrl: async () => null,
  };

  const harness: DansWordTestHarness = {
    reset: () => {
      nextOpenFile = null;
      nextSaveFile = undefined;
      nextImportDoc = null;
      spellResults = null;
      spellSuggestions = ['suggestion'];
      exportPdfCalls = 0;
      printCalls = 0;
      editorRef = null;
      localStorage.removeItem(FS_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(RECENTS_KEY);
      localStorage.removeItem(REVISIONS_KEY);
    },
    setOpenFileResult: (path) => {
      nextOpenFile = path ? normalizePath(path) : null;
    },
    setSaveFileResult: (path) => {
      nextSaveFile = path ? normalizePath(path) : null;
    },
    setImportDocResult: (result) => {
      nextImportDoc = result;
    },
    setSpellCheckResults: (results) => {
      spellResults = results;
    },
    setSpellSuggestions: (words) => {
      spellSuggestions = words;
    },
    readStoredFile: (path) => {
      const content = getFs()[normalizePath(path)];
      if (!content || content.startsWith(BINARY_PREFIX)) return null;
      return content;
    },
    readStoredBinaryBase64: (path) => {
      const content = getFs()[normalizePath(path)];
      if (!content?.startsWith(BINARY_PREFIX)) return null;
      return content.slice(BINARY_PREFIX.length);
    },
    listStoredFiles: () => Object.keys(getFs()),
    seedFile: (path, content) => {
      const fs = getFs();
      fs[normalizePath(path)] = content;
      setFs(fs);
    },
    seedBinaryFile: (path, base64) => {
      const fs = getFs();
      fs[normalizePath(path)] = `${BINARY_PREFIX}${base64}`;
      setFs(fs);
    },
    setSettings: (settings) => {
      const current = readJson<Partial<AppSettings> | null>(SETTINGS_KEY, null) ?? {};
      writeJson(SETTINGS_KEY, { ...current, ...settings });
    },
    setRecents: (recents) => writeJson(RECENTS_KEY, recents),
    getRecents: () => readJson<RecentFile[]>(RECENTS_KEY, []),
    setEditor: (editor) => {
      editorRef = editor;
    },
    loadEditorContent: (content) => {
      editorRef?.commands.setContent(content as object);
    },
    getEditorJson: () => editorRef?.getJSON() ?? null,
    getEditorText: () => editorRef?.getText() ?? '',
    getEditorSelectionText: () => {
      if (!editorRef) return '';
      const { from, to } = editorRef.state.selection;
      return editorRef.state.doc.textBetween(from, to, ' ');
    },
    runEditorCommand: (command, arg) => {
      if (!editorRef) return;
      const chain = editorRef.chain().focus();
      switch (command) {
        case 'toggleBulletList':
          chain.toggleBulletList().run();
          break;
        case 'toggleOrderedList':
          chain.toggleOrderedList().run();
          break;
        case 'setTextAlignCenter':
          chain.setTextAlign('center').run();
          break;
        case 'setTextAlignJustify':
          chain.setTextAlign('justify').run();
          break;
        case 'toggleStrike':
          chain.toggleStrike().run();
          break;
        case 'toggleSuperscript':
          chain.toggleSuperscript().run();
          break;
        case 'toggleSubscript':
          chain.toggleSubscript().run();
          break;
        case 'toggleBold':
          chain.toggleBold().run();
          break;
        case 'setFontFamily':
          chain.setFontFamily(arg ?? 'Georgia').run();
          break;
        case 'insertTable':
          chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case 'insertPageBreak':
          chain.insertPageBreak().run();
          break;
        case 'selectAll':
          chain.selectAll().run();
          break;
        case 'clearFormatting':
          chain.clearNodes().unsetAllMarks().clearParagraphFormatting().run();
          break;
        case 'toggleHeading1':
          chain.toggleHeading({ level: 1 }).run();
          break;
        default:
          break;
      }
    },
    getExportPdfCallCount: () => exportPdfCalls,
    getPrintCallCount: () => printCalls,
  };

  target.dansword = api as Window['dansword'];
  target.__DANSWORD_TEST__ = harness;
  return harness;
}
