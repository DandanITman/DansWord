import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { checkWords, suggestWord } from './spell';
import { importDocFile } from './docImport';
import { startCollabServer, stopCollabServer, getCollabUrl } from './collabServer';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function resolveAppIcon() {
  const candidates = [
    path.join(process.resourcesPath, 'icon.png'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../../build/icon.png'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return nativeImage.createFromPath(candidate);
  }
  return undefined;
}

const dataDir = path.join(app.getPath('userData'), 'data');
const settingsPath = path.join(dataDir, 'settings.json');
const recentsPath = path.join(dataDir, 'recents.json');

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'DansWord',
    icon: resolveAppIcon(),
    backgroundColor: '#f3f4f6',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureDataDir();
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['dansword', 'docx', 'doc', 'txt', 'rtf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_e, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultPath ?? 'Untitled.dansword',
    filters: [
      { name: 'DansWord Document', extensions: ['dansword'] },
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'Rich Text', extensions: ['rtf'] },
      { name: 'HTML', extensions: ['html', 'htm'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Plain Text', extensions: ['txt'] },
    ],
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:readFile', async (_e, filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return buffer;
});

ipcMain.handle('fs:readTextFile', async (_e, filePath: string) => {
  return fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('fs:writeFile', async (_e, filePath: string, data: Uint8Array | string) => {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await fs.writeFile(filePath, data);
  return true;
});

ipcMain.handle('fs:listDocuments', async (_e, folderPath: string) => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const docs = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.dansword', '.docx', '.doc', '.txt', '.rtf'].includes(ext)) continue;
      const fullPath = path.join(folderPath, entry.name);
      const stat = await fs.stat(fullPath);
      docs.push({
        path: fullPath,
        name: entry.name,
        modified: stat.mtimeMs,
        size: stat.size,
      });
    }
    return docs.sort((a, b) => b.modified - a.modified);
  } catch {
    return [];
  }
});

ipcMain.handle('settings:get', async () => readJson(settingsPath, null));
ipcMain.handle('settings:set', async (_e, settings: unknown) => {
  await writeJson(settingsPath, settings);
  return true;
});

ipcMain.handle('recents:get', async () => readJson(recentsPath, []));
ipcMain.handle('recents:set', async (_e, recents: unknown) => {
  await writeJson(recentsPath, recents);
  return true;
});

ipcMain.handle('shell:showItemInFolder', async (_e, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:getDocumentsPath', () => {
  return app.getPath('documents');
});

ipcMain.handle('app:getDefaultSaveDir', async () => {
  const settings = await readJson<{ defaultSaveLocation?: string } | null>(settingsPath, null);
  const configured = settings?.defaultSaveLocation?.trim();
  const saveDir = configured || path.join(app.getPath('documents'), 'DansWord');
  if (!existsSync(saveDir)) mkdirSync(saveDir, { recursive: true });
  return saveDir;
});

ipcMain.handle('print:document', async () => {
  if (!mainWindow) return false;
  await mainWindow.webContents.print({});
  return true;
});

ipcMain.handle('export:pdf', async (_e, savePath?: string, pageSize?: string) => {
  if (!mainWindow) return null;
  const pdf = await mainWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    pageSize: (pageSize as 'A4' | 'Letter' | 'Legal') ?? 'Letter',
    margins: { marginType: 'none' },
  });
  if (savePath) {
    const dir = path.dirname(savePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await fs.writeFile(savePath, pdf);
  }
  return pdf;
});

ipcMain.handle('import:doc', async (_e, filePath: string) => importDocFile(filePath));

ipcMain.handle('spell:checkWords', async (_e, words: string[], language?: string) =>
  checkWords(words, language ?? 'en-US'),
);

ipcMain.handle('spell:suggest', async (_e, word: string, language?: string) =>
  suggestWord(word, language ?? 'en-US'),
);

ipcMain.handle('collab:start', async () => startCollabServer());
ipcMain.handle('collab:stop', async () => {
  stopCollabServer();
  return true;
});
ipcMain.handle('collab:getUrl', async () => getCollabUrl());

const revisionsDir = path.join(dataDir, 'revisions');

function revisionKeyForDoc(docPath: string) {
  return Buffer.from(docPath.toLowerCase()).toString('base64url').slice(0, 48);
}

ipcMain.handle('revisions:save', async (_e, docPath: string, snapshot: unknown, label: string) => {
  const key = revisionKeyForDoc(docPath);
  const dir = path.join(revisionsDir, key);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const id = `${Date.now()}`;
  const filePath = path.join(dir, `${id}.json`);
  await fs.writeFile(
    filePath,
    JSON.stringify({ id, timestamp: Date.now(), label, content: snapshot }, null, 2),
    'utf-8',
  );
  const entries = await fs.readdir(dir);
  const sorted = entries.filter((f) => f.endsWith('.json')).sort().reverse();
  for (const old of sorted.slice(20)) {
    await fs.unlink(path.join(dir, old)).catch(() => undefined);
  }
  return { id, timestamp: Date.now(), label, filePath: docPath };
});

ipcMain.handle('revisions:list', async (_e, docPath: string) => {
  const key = revisionKeyForDoc(docPath);
  const dir = path.join(revisionsDir, key);
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir);
  const revisions = [];
  for (const entry of entries.filter((f) => f.endsWith('.json'))) {
    const raw = await fs.readFile(path.join(dir, entry), 'utf-8');
    const parsed = JSON.parse(raw) as { id: string; timestamp: number; label: string };
    revisions.push({ id: parsed.id, timestamp: parsed.timestamp, label: parsed.label, filePath: docPath });
  }
  return revisions.sort((a, b) => b.timestamp - a.timestamp);
});

ipcMain.handle('revisions:load', async (_e, docPath: string, id: string) => {
  const key = revisionKeyForDoc(docPath);
  const filePath = path.join(revisionsDir, key, `${id}.json`);
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as { content: unknown };
  return parsed.content;
});
