/// <reference types="vite/client" />

import type { AppSettings, RecentFile, DocumentRevision } from '@dansword/core';

export interface ListedDocument {
  path: string;
  name: string;
  modified: number;
  size: number;
}

export interface DansWordAPI {
  openFile: () => Promise<string | null>;
  saveFile: (defaultPath?: string) => Promise<string | null>;
  openFolder: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<Uint8Array>;
  readTextFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, data: Uint8Array | string) => Promise<boolean>;
  listDocuments: (folderPath: string) => Promise<ListedDocument[]>;
  getSettings: () => Promise<AppSettings | null>;
  setSettings: (settings: AppSettings) => Promise<boolean>;
  getRecents: () => Promise<RecentFile[]>;
  setRecents: (recents: RecentFile[]) => Promise<boolean>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getDocumentsPath: () => Promise<string>;
  getDefaultSaveDir: () => Promise<string>;
  printDocument: () => Promise<boolean>;
  saveRevision: (docPath: string, snapshot: unknown, label: string) => Promise<DocumentRevision>;
  listRevisions: (docPath: string) => Promise<DocumentRevision[]>;
  loadRevision: (docPath: string, id: string) => Promise<unknown>;
  exportPdf: (savePath?: string, pageSize?: string) => Promise<Uint8Array | null>;
  importDoc: (filePath: string) => Promise<
    | { format: 'docx'; data: ArrayBuffer; source: 'libreoffice' }
    | { format: 'text'; data: string; source: 'extractor'; warning: string }
  >;
  spellCheckWords: (words: string[], language?: string) => Promise<boolean[]>;
  spellSuggest: (word: string, language?: string) => Promise<string[]>;
  startCollabServer: () => Promise<{ port: number; url: string }>;
  stopCollabServer: () => Promise<boolean>;
  getCollabUrl: () => Promise<string | null>;
}

export interface DansWordTestHarness {
  reset: () => void;
  setOpenFileResult: (path: string | null) => void;
  setSaveFileResult: (path: string | null) => void;
  readStoredFile: (path: string) => string | null;
  listStoredFiles: () => string[];
  seedFile: (path: string, content: string) => void;
  setEditor: (editor: import('@tiptap/react').Editor | null) => void;
  loadEditorContent: (content: unknown) => void;
  getEditorJson: () => unknown;
  runEditorCommand: (command: 'toggleBulletList' | 'toggleOrderedList' | 'setTextAlignCenter') => void;
}

declare global {
  interface Window {
    dansword: DansWordAPI;
    __DANSWORD_TEST__?: DansWordTestHarness;
  }
}

export {};
