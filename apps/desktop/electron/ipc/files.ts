import { dialog, ipcMain, type BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from '../store';

const DOCUMENT_EXTENSIONS = ['docx', 'dansword', 'doc', 'txt', 'rtf', 'html', 'htm'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

export function registerFileIpc(getWindow: () => BrowserWindow | null) {
  ipcMain.handle('dialog:openFile', async () => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: DOCUMENT_EXTENSIONS },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle('dialog:openImageFile', async () => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: IMAGE_EXTENSIONS },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle('dialog:saveFile', async (_e, defaultPath?: string) => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultPath ?? 'Untitled.docx',
      filters: [
        { name: 'Word Document', extensions: ['docx'] },
        { name: 'DansWord Native (.dansword)', extensions: ['dansword'] },
        { name: 'Rich Text', extensions: ['rtf'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Plain Text', extensions: ['txt'] },
      ],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle('dialog:openFolder', async () => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle('fs:readFile', async (_e, filePath: string) => fs.readFile(filePath));

  ipcMain.handle('fs:readTextFile', async (_e, filePath: string) =>
    fs.readFile(filePath, 'utf-8'),
  );

  ipcMain.handle('fs:writeFile', async (_e, filePath: string, data: Uint8Array | string) => {
    ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, data);
    return true;
  });

  ipcMain.handle('fs:listDocuments', async (_e, folderPath: string) => {
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      const docs = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (!DOCUMENT_EXTENSIONS.includes(ext)) continue;
        const fullPath = path.join(folderPath, entry.name);
        const stat = await fs.stat(fullPath);
        docs.push({ path: fullPath, name: entry.name, modified: stat.mtimeMs, size: stat.size });
      }
      return docs.sort((a, b) => b.modified - a.modified);
    } catch {
      return [];
    }
  });
}
