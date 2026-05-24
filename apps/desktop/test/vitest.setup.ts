import '@testing-library/jest-dom/vitest';

const mockHarness = {
  reset: () => {},
  setOpenFileResult: () => {},
  setSaveFileResult: () => {},
  readStoredFile: () => null,
  listStoredFiles: () => [],
  seedFile: () => {},
  setEditor: () => {},
  loadEditorContent: () => {},
  getEditorJson: () => null,
  runEditorCommand: () => {},
};

window.dansword = {
  openFile: async () => null,
  saveFile: async (defaultPath?: string) => defaultPath ?? 'C:\\DansWordTest\\Untitled.docx',
  openFolder: async () => 'C:\\DansWordTest',
  readFile: async () => new Uint8Array(),
  readTextFile: async () => '',
  writeFile: async () => true,
  listDocuments: async () => [],
  getSettings: async () => null,
  setSettings: async () => true,
  getRecents: async () => [],
  setRecents: async () => true,
  showItemInFolder: async () => {},
  getDocumentsPath: async () => 'C:\\Users\\Test\\Documents',
  getDefaultSaveDir: async () => 'C:\\DansWordTest',
  printDocument: async () => true,
  saveRevision: async () => ({
    id: 'rev-1',
    label: 'Saved',
    created: '2026-01-15T12:00:00.000Z',
    snapshot: {},
  }),
  listRevisions: async () => [],
  loadRevision: async () => ({}),
  exportPdf: async () => new Uint8Array(),
  importDoc: async () => ({
    format: 'text',
    data: 'Legacy doc text',
    source: 'extractor',
    warning: 'Test mock import',
  }),
  spellCheckWords: async (words: string[]) => words.map(() => true),
  spellSuggest: async () => ['suggestion'],
  startCollabServer: async () => ({ port: 8765, url: 'ws://127.0.0.1:8765' }),
  stopCollabServer: async () => true,
  getCollabUrl: async () => null,
};

window.__DANSWORD_TEST__ = mockHarness;
