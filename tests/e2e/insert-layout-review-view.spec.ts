import { test, expect } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  typeInEditor,
  focusEditor,
  switchRibbonTab,
  selectAllInEditor,
  dismissDialogs,
  acceptAppDialogs,
  stubPrompt,
  loadHeadingFixture,
  saveToPath,
  PATHS,
} from '../helpers/playwright';
import { TINY_PNG_BASE64 } from '../fixtures/fileFixtures';

test.describe('Insert tab', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('inserts 3x3 table with header row', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Table$/ }).click();
    await expect(page.getByTestId('word-editor').locator('table')).toBeVisible();
    await expect(page.getByTestId('word-editor').locator('th')).toHaveCount(3);
  });

  test('inserts page break', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /Page Break/i }).click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('pageBreak');
  });

  test('inserts footnote via prompt', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Text with note');
    await stubPrompt(page, 'Footnote body');
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /Footnote/i }).click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('footnoteRef');
  });

  test('inserts rectangle shape', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Rect$/ }).click();
    await expect(page.getByTestId('word-editor').locator('.shape-block')).toBeVisible();
  });

  test('inserts image from mock file picker', async ({ page }) => {
    await page.evaluate((b64) => {
      window.__DANSWORD_TEST__?.seedBinaryFile('C:\\DansWordTest\\photo.png', b64);
    }, TINY_PNG_BASE64);
    await openBlankDocument(page);
    await page.evaluate(() =>
      window.__DANSWORD_TEST__?.setOpenFileResult('C:\\DansWordTest\\photo.png'),
    );
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Picture$/ }).click();
    await expect(page.getByTestId('word-editor').locator('img')).toBeVisible();
  });

  test('inserts table of contents from headings', async ({ page }) => {
    await loadHeadingFixture(page);
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^TOC$/ }).click();
    await expect(page.getByTestId('word-editor')).toContainText('Chapter One');
  });

  test('inserts current date', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Date$/ }).click();
    const text = await page.evaluate(() => window.__DANSWORD_TEST__?.getEditorText() ?? '');
    expect(text.length).toBeGreaterThan(5);
  });
});

test.describe('Layout, review, and view', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('opens page setup dialog', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Page Setup/i }).click();
    await expect(page.getByRole('heading', { name: /Page Setup/i })).toBeVisible();
  });

  test('changes page size from letter to A4', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Page Setup/i }).click();
    await page.getByLabel('Page size').selectOption('a4');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.doc-page-shell').first()).toHaveCSS('width', '794px');
  });

  test('applies multi-column layout from page setup', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Page Setup/i }).click();
    await page.getByLabel('Columns').selectOption('2');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.doc-body-columns')).toBeVisible();
    await expect(page.locator('.doc-body')).toHaveCSS('column-count', '2');
  });

  test('sets header and footer text', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Header\/Footer/i }).click();
    await page.getByPlaceholder('Header appears at top of each page').fill('Confidential');
    await page.getByPlaceholder('Footer appears at bottom of each page').fill('Draft copy');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.doc-header')).toContainText('Confidential');
    await expect(page.locator('.doc-footer')).toContainText('Draft copy');
  });

  test('opens header and footer dialog', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Header\/Footer/i }).click();
    await expect(page.getByText(/Header text/i)).toBeVisible();
  });

  test('enables watermark text on document', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'design');
    await page.getByRole('button', { name: /Watermark/i }).click();
    await page.getByLabel('Show watermark').check();
    await page.getByLabel('Watermark text').fill('DRAFT');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.doc-watermark')).toContainText('DRAFT');
  });

  test('opens watermark dialog', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'design');
    await page.getByRole('button', { name: /Watermark/i }).click();
    await expect(page.getByRole('heading', { name: /Watermark/i })).toBeVisible();
  });

  test('toggles track changes from review tab', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Track Changes/i }).click();
    await expect(page.getByTestId('status-bar').locator('.status-track')).toBeVisible();
    await typeInEditor(page, 'Tracked edit');
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('trackInsert');
  });

  test('adds and resolves comment on selection', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Comment target text');
    await selectAllInEditor(page);
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Comments/i }).click();
    await stubPrompt(page, 'Needs review');
    await page.getByRole('button', { name: '+ Selection' }).click();
    await expect(page.getByText('Needs review')).toBeVisible();
    await page.getByRole('button', { name: 'Resolve' }).click();
  });

  test('opens collaboration dialog', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Collaborate/i }).click();
    await expect(page.getByText(/Collaboration/i)).toBeVisible();
  });

  test('toggles focus mode from view tab', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'view');
    await page.getByTestId('ribbon').getByRole('button', { name: /Focus Mode/i }).click();
    await expect(page.locator('.editor-scroll')).toHaveClass(/focus-mode/);
  });

  test('changes zoom from status bar', async ({ page }) => {
    await openBlankDocument(page);
    await page.locator('.status-zoom-btn').last().click();
    await expect(page.getByTestId('status-zoom-pct')).not.toHaveText('100%');
  });

  test('updates word count while typing', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'one two three four');
    await expect(page.getByTestId('status-word-count')).toContainText('4 words');
  });

  test('switches status bar view modes', async ({ page }) => {
    await openBlankDocument(page);
    await page.getByTitle('Web Layout').click();
    await page.getByTitle('Focus Mode').click();
    await expect(page.locator('.editor-scroll.focus-mode')).toBeVisible();
  });

  test('opens mail merge wizard from file tab', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'file');
    await page.getByTestId('ribbon').getByRole('button', { name: /Mail Merge/i }).click();
    await expect(page.getByRole('heading', { name: 'Mail Merge' })).toBeVisible();
  });

  test('stores settings in mock persistence layer', async ({ page }) => {
    const settings = await page.evaluate(async () => {
      window.__DANSWORD_TEST__?.setSettings({ theme: 'dark', spellCheckEnabled: false });
      return window.dansword.getSettings();
    });
    expect(settings.theme).toBe('dark');
    expect(settings.spellCheckEnabled).toBe(false);
  });
});

test.describe('Settings and options', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
    await openBlankDocument(page);
  });

  test('underlines misspelled words when spell check is enabled', async ({ page }) => {
    await page.evaluate(() => {
      window.__DANSWORD_TEST__?.setSpellCheckResults([false]);
    });
    await typeInEditor(page, 'asdfgh');
    await expect.poll(async () => page.locator('.spell-error').count()).toBeGreaterThan(0);
    await expect(page.locator('.spell-error')).toContainText('asdfgh');
  });

  test('disabling spell check stores setting', async ({ page }) => {
    await switchRibbonTab(page, 'file');
    await page.getByRole('button', { name: /Save As \/ Export/i }).click();
    await page.getByTestId('backstage-nav-options').click();
    await page.getByLabel(/Enable spell check/i).uncheck();
    const enabled = await page.evaluate(async () => (await window.dansword.getSettings()).spellCheckEnabled);
    expect(enabled).toBe(false);
  });

  test('auto-save interval zero disables auto-save', async ({ page }) => {
    await page.evaluate(() =>
      window.__DANSWORD_TEST__?.setSettings({ autoSaveIntervalMs: 0 }),
    );
    await saveToPath(page, PATHS.savedDocx);
    const baseline = await page.evaluate(
      (path) => window.__DANSWORD_TEST__?.readStoredBinaryBase64(path),
      PATHS.savedDocx,
    );
    expect(baseline).not.toBeNull();
    await typeInEditor(page, ' no autosave');
    await expect
      .poll(
        async () =>
          page.evaluate(
            (path) => window.__DANSWORD_TEST__?.readStoredBinaryBase64(path),
            PATHS.savedDocx,
          ),
        { timeout: 3000 },
      )
      .toBe(baseline);
  });
});
