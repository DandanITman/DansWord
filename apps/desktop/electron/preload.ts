import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dansword', {
  openFile: () => ipcRenderer.invoke('dialog:openFile') as Promise<string | null>,
  openImageFile: () => ipcRenderer.invoke('dialog:openImageFile') as Promise<string | null>,
  saveFile: (defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', defaultPath) as Promise<string | null>,
  openFolder: () => ipcRenderer.invoke('dialog:openFolder') as Promise<string | null>,
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath) as Promise<Uint8Array>,
  readTextFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readTextFile', filePath) as Promise<string>,
  writeFile: (filePath: string, data: Uint8Array | string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, data) as Promise<boolean>,
  listDocuments: (folderPath: string) =>
    ipcRenderer.invoke('fs:listDocuments', folderPath) as Promise<
      Array<{ path: string; name: string; modified: number; size: number }>
    >,
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),
  getRecents: () => ipcRenderer.invoke('recents:get'),
  setRecents: (recents: unknown) => ipcRenderer.invoke('recents:set', recents),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  getDocumentsPath: () => ipcRenderer.invoke('app:getDocumentsPath') as Promise<string>,
  getDefaultSaveDir: () => ipcRenderer.invoke('app:getDefaultSaveDir') as Promise<string>,
  printDocument: () => ipcRenderer.invoke('print:document') as Promise<boolean>,
  saveRevision: (docPath: string, snapshot: unknown, label: string) =>
    ipcRenderer.invoke('revisions:save', docPath, snapshot, label) as Promise<DocumentRevision>,
  listRevisions: (docPath: string) =>
    ipcRenderer.invoke('revisions:list', docPath) as Promise<DocumentRevision[]>,
  loadRevision: (docPath: string, id: string) =>
    ipcRenderer.invoke('revisions:load', docPath, id) as Promise<unknown>,
  exportPdf: (savePath?: string, pageSize?: string) =>
    ipcRenderer.invoke('export:pdf', savePath, pageSize) as Promise<Uint8Array | null>,
  importDoc: (filePath: string) =>
    ipcRenderer.invoke('import:doc', filePath) as Promise<
      | { format: 'docx'; data: ArrayBuffer; source: 'libreoffice' }
      | { format: 'text'; data: string; source: 'extractor'; warning: string }
    >,
  spellCheckWords: (words: string[], language?: string) =>
    ipcRenderer.invoke('spell:checkWords', words, language) as Promise<boolean[]>,
  spellSuggest: (word: string, language?: string) =>
    ipcRenderer.invoke('spell:suggest', word, language) as Promise<string[]>,
  startCollabServer: () =>
    ipcRenderer.invoke('collab:start') as Promise<{ port: number; url: string }>,
  stopCollabServer: () => ipcRenderer.invoke('collab:stop') as Promise<boolean>,
  getCollabUrl: () => ipcRenderer.invoke('collab:getUrl') as Promise<string | null>,
});
