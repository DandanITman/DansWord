import type { AppSettings, RecentFile, DocumentRevision } from '@dansword/core';

export interface ListedDocument {
  path: string;
  name: string;
  modified: number;
  size: number;
}

export type ImportDocResult =
  | { format: 'docx'; data: ArrayBuffer; source: 'libreoffice' }
  | { format: 'text'; data: string; source: 'extractor'; warning: string };

/**
 * The complete contract between the renderer and the host process.
 *
 * Every member here must have a matching `ipcMain.handle` in `electron/` and a
 * matching stub in the test harness. Nothing in `src/` may reach for
 * `window.dansword` directly — go through `platform` in ./index.ts so the
 * missing-bridge case stays handled in exactly one place.
 */
export interface DansWordAPI {
  openFile: () => Promise<string | null>;
  openImageFile: () => Promise<string | null>;
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
  getDefaultSaveDir: () => Promise<string>;
  printDocument: () => Promise<boolean>;
  saveRevision: (docPath: string, snapshot: unknown, label: string) => Promise<DocumentRevision>;
  listRevisions: (docPath: string) => Promise<DocumentRevision[]>;
  loadRevision: (docPath: string, id: string) => Promise<unknown>;
  exportPdf: (savePath?: string, pageSize?: string) => Promise<Uint8Array | null>;
  importDoc: (filePath: string) => Promise<ImportDocResult>;
  spellCheckWords: (words: string[], language?: string) => Promise<boolean[]>;
  spellSuggest: (word: string, language?: string) => Promise<string[]>;
}
