import type { Editor } from '@tiptap/react';
import type { AppSettings, DocumentRevision, RecentFile } from '@dansword/core';
import { DEFAULT_SETTINGS } from '@dansword/core';

const FS_KEY = 'dansword-test-fs';
const SETTINGS_KEY = 'dansword-test-settings';
const RECENTS_KEY = 'dansword-test-recents';
const REVISIONS_KEY = 'dansword-test-revisions';

export interface DansWordTestHarness {
  reset: () => void;
  setOpenFileResult: (path: string | null) => void;
  setSaveFileResult: (path: string | null) => void;
  readStoredFile: (path: string) => string | null;
  listStoredFiles: () => string[];
  seedFile: (path: string, content: string) => void;
  setEditor: (editor: Editor | null) => void;
  loadEditorContent: (content: unknown) => void;
  getEditorJson: () => unknown;
  runEditorCommand: (command: 'toggleBulletList' | 'toggleOrderedList' | 'setTextAlignCenter') => void;
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

export function installMockDansword(target: Window & typeof globalThis): DansWordTestHarness {
  let nextOpenFile: string | null = null;
  let nextSaveFile: string | null = null;
  let editorRef: Editor | null = null;

  const getFs = (): Record<string, string> => readJson(FS_KEY, {});
  const setFs = (fs: Record<string, string>) => writeJson(FS_KEY, fs);

  const getRevisions = (): Record<string, DocumentRevision[]> => readJson(REVISIONS_KEY, {});
  const setRevisions = (data: Record<string, DocumentRevision[]>) => writeJson(REVISIONS_KEY, data);

  const api = {
    openFile: async () => {
      const path = nextOpenFile;
      nextOpenFile = null;
      return path;
    },
    saveFile: async (defaultPath?: string) => {
      const path = nextSaveFile ?? defaultPath ?? 'C:\\DansWordTest\\Untitled.dansword';
      nextSaveFile = null;
      return normalizePath(path);
    },
    openFolder: async () => 'C:\\DansWordTest',
    readFile: async (filePath: string) => {
      const content = getFs()[normalizePath(filePath)];
      if (content == null) throw new Error(`Missing test file: ${filePath}`);
      return new TextEncoder().encode(content);
    },
    readTextFile: async (filePath: string) => {
      const content = getFs()[normalizePath(filePath)];
      if (content == null) throw new Error(`Missing test file: ${filePath}`);
      return content;
    },
    writeFile: async (filePath: string, data: Uint8Array | string) => {
      const fs = getFs();
      const key = normalizePath(filePath);
      fs[key] = typeof data === 'string' ? data : new TextDecoder().decode(data);
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
    printDocument: async () => true,
    saveRevision: async (docPath: string, snapshot: unknown, label: string) => {
      const all = getRevisions();
      const key = normalizePath(docPath);
      const revision: DocumentRevision = {
        id: `rev-${(all[key]?.length ?? 0) + 1}`,
        label,
        created: '2026-01-15T12:00:00.000Z',
        snapshot,
      };
      all[key] = [...(all[key] ?? []), revision];
      setRevisions(all);
      return revision;
    },
    listRevisions: async (docPath: string) => getRevisions()[normalizePath(docPath)] ?? [],
    loadRevision: async (docPath: string, id: string) => {
      const match = (getRevisions()[normalizePath(docPath)] ?? []).find((r) => r.id === id);
      if (!match) throw new Error(`Missing revision ${id}`);
      return match.snapshot;
    },
    exportPdf: async () => new Uint8Array([37, 80, 68, 70]),
    importDoc: async () => ({
      format: 'text' as const,
      data: 'Legacy doc text',
      source: 'extractor' as const,
      warning: 'Test mock import',
    }),
    spellCheckWords: async (words: string[]) => words.map(() => true),
    spellSuggest: async () => ['suggestion'],
    startCollabServer: async () => ({ port: 8765, url: 'ws://127.0.0.1:8765' }),
    stopCollabServer: async () => true,
    getCollabUrl: async () => null,
  };

  const harness: DansWordTestHarness = {
    reset: () => {
      nextOpenFile = null;
      nextSaveFile = null;
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
    readStoredFile: (path) => getFs()[normalizePath(path)] ?? null,
    listStoredFiles: () => Object.keys(getFs()),
    seedFile: (path, content) => {
      const fs = getFs();
      fs[normalizePath(path)] = content;
      setFs(fs);
    },
    setEditor: (editor) => {
      editorRef = editor;
    },
    loadEditorContent: (content) => {
      editorRef?.commands.setContent(content as object);
    },
    getEditorJson: () => editorRef?.getJSON() ?? null,
    runEditorCommand: (command) => {
      if (!editorRef) return;
      const chain = editorRef.chain().focus();
      if (command === 'toggleBulletList') chain.toggleBulletList().run();
      if (command === 'toggleOrderedList') chain.toggleOrderedList().run();
      if (command === 'setTextAlignCenter') chain.setTextAlign('center').run();
    },
  };

  target.dansword = api as Window['dansword'];
  target.__DANSWORD_TEST__ = harness;
  return harness;
}
