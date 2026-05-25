import { expect, type Page } from '@playwright/test';
import {
  getHeadingFixtureJson,
  getSampleDansword,
  getSampleDocxBase64,
  getSampleHtml,
  getSampleRtf,
  getSampleTxt,
  PATHS,
  TINY_PNG_BASE64,
} from '../fixtures/fileFixtures';
import { buildRegressionDocumentContent } from '../fixtures/regressionDocument';

export async function resetTestState(page: Page) {
  await page.goto('/test.html');
  await page.evaluate(() => window.__DANSWORD_TEST__?.reset());
}

export async function openBlankDocument(page: Page) {
  await page.getByTestId('home-blank-template').click();
  await page.getByTestId('word-editor').waitFor({ state: 'visible' });
  await page.getByTestId('ribbon').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const json = window.__DANSWORD_TEST__?.getEditorJson() as { type?: string } | null;
    return json?.type === 'doc';
  });
}

export async function openTemplate(page: Page, templateId: 'letter' | 'report' | 'resume') {
  await page.getByTestId(`home-template-${templateId}`).click();
  await page.getByTestId('word-editor').waitFor({ state: 'visible' });
}

export async function goHome(page: Page) {
  await page.getByTestId('editor-titlebar').getByTitle('Home screen').first().click();
  await page.getByTestId('home-screen').waitFor({ state: 'visible' });
}

export async function focusEditor(page: Page) {
  const editor = page.getByTestId('word-editor');
  await editor.click();
  return editor;
}

export async function typeInEditor(page: Page, text: string) {
  const editor = await focusEditor(page);
  await editor.pressSequentially(text, { delay: 10 });
}

export async function grantClipboard(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

export async function insertMockImage(page: Page) {
  await page.evaluate((b64) => {
    window.__DANSWORD_TEST__?.seedBinaryFile('C:\\DansWordTest\\photo.png', b64);
  }, TINY_PNG_BASE64);
  await page.evaluate(() =>
    window.__DANSWORD_TEST__?.setOpenImageFileResult('C:\\DansWordTest\\photo.png'),
  );
  await switchRibbonTab(page, 'insert');
  await page.getByRole('button', { name: /^Picture$/ }).click();
  await page.getByTestId('word-editor').locator('img').waitFor({ state: 'visible' });
}

export async function pickColorSwatch(page: Page, hex: string) {
  await page.getByTestId(`color-swatch-${hex}`).click();
}

export async function selectAllInEditor(page: Page) {
  await focusEditor(page);
  await page.keyboard.press('Control+A');
}

export async function switchRibbonTab(page: Page, tab: string) {
  await page.locator(`.ribbon-tab[data-tab="${tab}"]`).click();
}

export async function openBackstage(page: Page, section?: string) {
  await switchRibbonTab(page, 'file');
  await page.getByRole('button', { name: /Save As \/ Export/i }).click();
  await page.getByTestId('backstage').waitFor({ state: 'visible' });
  if (section) {
    await page.getByTestId(`backstage-nav-${section}`).click();
  }
}

export async function openFindReplace(page: Page) {
  await page.keyboard.press('Control+f');
  await page.getByTestId('find-replace-bar').waitFor({ state: 'visible' });
}

export function acceptAppDialogs(page: Page) {
  page.on('dialog', (dialog) => dialog.accept());
}

export async function dismissDialogs(page: Page) {
  page.on('dialog', (dialog) => dialog.accept());
}

export async function stubPrompt(page: Page, value: string) {
  await page.evaluate((v) => {
    window.prompt = () => v;
  }, value);
}

export async function seedAllSampleFiles(page: Page) {
  const docxB64 = await getSampleDocxBase64();
  const rtf = await getSampleRtf();
  const html = await getSampleHtml();
  await page.evaluate(
    ({ files }) => {
      for (const file of files.text) {
        window.__DANSWORD_TEST__?.seedFile(file.path, file.content);
      }
      for (const file of files.binary) {
        window.__DANSWORD_TEST__?.seedBinaryFile(file.path, file.content);
      }
    },
    {
      files: {
        text: [
          { path: PATHS.txt, content: getSampleTxt() },
          { path: PATHS.rtf, content: rtf },
          { path: PATHS.html, content: html },
          { path: PATHS.dansword, content: getSampleDansword() },
          { path: PATHS.folderDoc1, content: 'Folder doc one' },
          { path: PATHS.folderDoc2, content: 'Folder doc two' },
        ],
        binary: [
          { path: PATHS.docx, content: docxB64 },
          { path: PATHS.imagePng, content: TINY_PNG_BASE64 },
        ],
      },
    },
  );
}

export async function saveToPath(page: Page, path: string) {
  await page.evaluate((p) => window.__DANSWORD_TEST__?.setSaveFileResult(p), path);
  await page.keyboard.press('Control+s');
  await expect
    .poll(async () =>
      page.evaluate(
        (p) =>
          window.__DANSWORD_TEST__?.readStoredBinaryBase64(p) ??
          window.__DANSWORD_TEST__?.readStoredFile(p),
        path,
      ),
    )
    .not.toBeNull();
}

export async function openSeededFile(page: Page, path: string) {
  await page.evaluate((p) => window.__DANSWORD_TEST__?.setOpenFileResult(p), path);
  await page.keyboard.press('Control+o');
  await page.getByTestId('word-editor').waitFor({ state: 'visible' });
}

export async function setAutoSaveInterval(page: Page, ms: number) {
  await page.evaluate((interval) => window.__DANSWORD_TEST__?.setSettings({ autoSaveIntervalMs: interval }), ms);
}

export async function loadRegressionFixture(page: Page) {
  await openBlankDocument(page);
  const content = buildRegressionDocumentContent();
  await page.evaluate((docContent) => {
    window.__DANSWORD_TEST__?.loadEditorContent(docContent);
  }, content);
  await page.getByText('DansWord Regression Test').waitFor({ state: 'visible' });
}

export async function loadHeadingFixture(page: Page) {
  await openBlankDocument(page);
  await page.evaluate((doc) => window.__DANSWORD_TEST__?.loadEditorContent(doc), getHeadingFixtureJson());
}

export const visualMaskSelectors = [
  '[data-testid="status-bar"]',
  '[data-testid="editor-filename"]',
  '.editor-user-badge',
  '.home-user-chip',
];

export function visualMaskLocators(page: Page) {
  return visualMaskSelectors.map((selector) => page.locator(selector));
}

export { PATHS };
