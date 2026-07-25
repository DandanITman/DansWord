import { ipcMain, type BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from '../store';
import { importDocFile } from '../docImport';
import { checkWords, suggestWord } from '../spell';

/** Printing, PDF export, legacy .doc conversion and spell check. */
export function registerOutputIpc(getWindow: () => BrowserWindow | null) {
  ipcMain.handle('print:document', async () => {
    const win = getWindow();
    if (!win) return false;
    await win.webContents.print({});
    return true;
  });

  ipcMain.handle('export:pdf', async (_e, savePath?: string, pageSize?: string) => {
    const win = getWindow();
    if (!win) return null;

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      // The page box, including its margins, comes from the @page rule the
      // renderer injects for the document's page setup.
      preferCSSPageSize: true,
      pageSize: (pageSize as 'A4' | 'Letter' | 'Legal') ?? 'Letter',
      margins: { marginType: 'none' },
    });

    if (savePath) {
      ensureDir(path.dirname(savePath));
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
}
