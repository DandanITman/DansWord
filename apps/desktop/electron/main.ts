import { app, BrowserWindow, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { ensureDataDir } from './store';
import { loadWindowState, trackWindowState } from './windowState';
import { attachWindow, documentFromArgv, queueFileOpen } from './fileOpenQueue';
import { registerFileIpc } from './ipc/files';
import { registerSettingsIpc } from './ipc/settings';
import { registerRevisionIpc } from './ipc/revisions';
import { registerOutputIpc } from './ipc/output';
import { attachCloseGuard, registerWindowIpc } from './ipc/window';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

const getWindow = () => mainWindow;

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

async function createWindow() {
  const { options, maximized } = await loadWindowState();

  mainWindow = new BrowserWindow({
    ...options,
    minWidth: 900,
    minHeight: 600,
    title: 'DansWord',
    icon: resolveAppIcon(),
    backgroundColor: '#f3f4f6',
    autoHideMenuBar: true,
    // Shown once the renderer has painted, so the window never flashes empty.
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (maximized) mainWindow.maximize();
  trackWindowState(mainWindow);
  attachCloseGuard(mainWindow);
  attachWindow(mainWindow);

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// A second launch (e.g. double-clicking another document) must route the file
// into the running window rather than starting a rival instance.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    queueFileOpen(documentFromArgv(argv));
  });

  // macOS delivers associated files through this event instead of argv.
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    queueFileOpen(filePath);
  });

  app.whenReady().then(async () => {
    ensureDataDir();
    Menu.setApplicationMenu(null);

    registerFileIpc(getWindow);
    registerSettingsIpc();
    registerRevisionIpc();
    registerOutputIpc(getWindow);
    registerWindowIpc(getWindow);

    // Capture the launch argument before the window exists; the renderer
    // collects it once it has mounted.
    queueFileOpen(documentFromArgv(process.argv));

    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
