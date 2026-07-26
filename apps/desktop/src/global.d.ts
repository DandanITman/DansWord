/// <reference types="vite/client" />

import type { AppSettings, RecentFile } from '@dansword/core';
import type { DansWordAPI, ImportDocResult } from './platform/api';

export type { DansWordAPI, ListedDocument, ImportDocResult } from './platform/api';

export interface DansWordTestHarness {
  reset: () => void;
  setOpenFileResult: (path: string | null) => void;
  setOpenImageFileResult: (path: string | null) => void;
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
  setEditor: (editor: import('@tiptap/react').Editor | null) => void;
  /**
   * @deprecated Phase 6 removes these. They let a test drive the editor
   * directly, which is how the ribbon shipped with almost no real coverage —
   * `TC-EDIT-014 "applies heading style from ribbon"` never touched the ribbon.
   * Do not add new call sites.
   */
  loadEditorContent: (content: unknown) => void;
  /** @deprecated See `loadEditorContent`. */
  getEditorJson: () => unknown;
  getEditorText: () => string;
  getEditorSelectionText: () => string;
  isDirty: () => boolean;
  setPendingFile: (path: string | null) => void;
  emitOpenFile: (path: string) => void;
  emitSaveAndClose: () => void;
  getExportPdfCallCount: () => number;
  getPrintCallCount: () => number;
}

declare global {
  interface Window {
    /**
     * Injected by `electron/preload.ts` (or by the test harness). Typed as
     * always-present for ergonomics; use `isPlatformAvailable()` from
     * `src/platform` before touching it on any path that can run without the
     * Electron bridge.
     */
    dansword: DansWordAPI;
    __DANSWORD_TEST__?: DansWordTestHarness;
    /**
     * The Draw tab's current pen. Ink canvases read it on every stroke, because
     * in Word the pen belongs to the tool rather than to a drawing — changing
     * colour must not rewrite the drawings already on the page.
     */
    __DANSWORD_INK__?: {
      tool: import('./extensions/InkDrawing').InkTool;
      color: string;
      width: number;
    };
  }
}

export {};
