import { test, expect } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  openTemplate,
  typeInEditor,
  focusEditor,
  selectAllInEditor,
  switchRibbonTab,
  goHome,
  openBackstage,
  saveToPath,
  acceptAppDialogs,
  stubPrompt,
  grantClipboard,
  insertMockImage,
  PATHS,
} from '../helpers/playwright';

test.describe('Clipboard and editing depth', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await grantClipboard(page);
    await resetTestState(page);
    await openBlankDocument(page);
  });

  test('copies and pastes text with keyboard clipboard shortcuts', async ({ page }) => {
    await typeInEditor(page, 'Clipboard sample');
    await selectAllInEditor(page);
    await page.keyboard.press('Control+C');
    await focusEditor(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Control+V');
    await expect(page.getByTestId('word-editor')).toContainText('Clipboard sampleClipboard sample');
  });

  test('cuts and pastes text with keyboard clipboard shortcuts', async ({ page }) => {
    await typeInEditor(page, 'Cut target');
    await selectAllInEditor(page);
    await page.keyboard.press('Control+X');
    await expect(page.getByTestId('word-editor')).not.toContainText('Cut target');
    await page.keyboard.press('Control+V');
    await expect(page.getByTestId('word-editor')).toContainText('Cut target');
  });

  test('applies paragraph border color via prompt', async ({ page }) => {
    await typeInEditor(page, 'Bordered paragraph');
    await selectAllInEditor(page);
    await stubPrompt(page, '#334155');
    await switchRibbonTab(page, 'edit');
    await page.getByRole('button', { name: 'Border', exact: true }).click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('borderColor');
  });

  test('applies paragraph shading via prompt', async ({ page }) => {
    await typeInEditor(page, 'Shaded paragraph');
    await selectAllInEditor(page);
    await stubPrompt(page, '#fef08a');
    await switchRibbonTab(page, 'edit');
    await page.getByRole('button', { name: 'Shade', exact: true }).click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('shading');
  });

  test('adds a custom style from the style editor dialog', async ({ page }) => {
    await stubPrompt(page, 'Report Body');
    await switchRibbonTab(page, 'edit');
    await page.getByRole('button', { name: /More Styles/i }).click();
    await expect(page.getByRole('heading', { name: 'Style Editor' })).toBeVisible();
    await page.getByRole('button', { name: 'Add Style' }).click();
    await expect(page.getByText('Report Body')).toBeVisible();
  });

  test('find previous moves to earlier match', async ({ page }) => {
    await typeInEditor(page, 'alpha beta alpha');
    await page.keyboard.press('Control+f');
    await page.getByTestId('find-input').fill('alpha');
    await page.getByTestId('find-next').click();
    await page.getByTestId('find-next').click();
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => window.__DANSWORD_TEST__?.getEditorSelectionText() ?? ''),
      )
      .toMatch(/alpha/i);
  });
});

test.describe('Insert depth', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
    await openBlankDocument(page);
  });

  test('edits text inside a table cell', async ({ page }) => {
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Table$/ }).click();
    await page.getByTestId('word-editor').locator('td').first().click();
    await page.keyboard.type('Cell A1');
    await expect(page.getByTestId('word-editor').locator('td').first()).toContainText('Cell A1');
  });

  test('aligns and wraps an inserted image from the ribbon', async ({ page }) => {
    await insertMockImage(page);
    await page.locator('.image-block').click({ force: true });
    await page.getByTitle('Align Picture Center').click();
    await page.getByTitle('Inline Picture').click();
    await expect(page.getByTestId('word-editor').locator('.image-block')).toHaveAttribute(
      'data-wrap',
      'inline',
    );
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('"align":"center"');
  });

  test('inserts oval, line, and arrow shapes', async ({ page }) => {
    await switchRibbonTab(page, 'insert');
    for (const shape of ['Oval', 'Line', 'Arrow'] as const) {
      await page.getByRole('button', { name: shape, exact: true }).click();
      await focusEditor(page);
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId('word-editor').locator('.shape-block')).toHaveCount(3);
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('"shapeType":"circle"');
    expect(json).toContain('"shapeType":"line"');
    expect(json).toContain('"shapeType":"arrow"');
  });

  test('inserts a merge field marker', async ({ page }) => {
    await stubPrompt(page, 'FirstName');
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /Merge Field/i }).click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('mergeField');
    expect(json).toContain('FirstName');
  });
});

test.describe('Review and track changes depth', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
    await openBlankDocument(page);
  });

  test('accepts all tracked changes', async ({ page }) => {
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Track Changes/i }).click();
    await typeInEditor(page, 'Accepted change');
    let json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('trackInsert');
    await switchRibbonTab(page, 'review');
    await page.getByTestId('ribbon').getByRole('button', { name: 'Accept All' }).click();
    json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).not.toContain('trackInsert');
    await expect(page.getByTestId('word-editor')).toContainText('Accepted change');
  });

  test('rejects all tracked changes', async ({ page }) => {
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Track Changes/i }).click();
    await typeInEditor(page, 'Rejected change');
    await switchRibbonTab(page, 'review');
    await page.getByTestId('ribbon').getByRole('button', { name: 'Reject All' }).click();
    await expect(page.getByTestId('word-editor')).not.toContainText('Rejected change');
  });

  test('applies spell suggestion from context menu', async ({ page }) => {
    await page.evaluate(() => {
      window.__DANSWORD_TEST__?.setSpellCheckResults([false]);
      window.__DANSWORD_TEST__?.setSpellSuggestions(['correctword']);
    });
    await typeInEditor(page, 'misspeled');
    await expect.poll(async () => page.locator('.spell-error').count()).toBeGreaterThan(0);
    await stubPrompt(page, 'correctword');
    await page.locator('.spell-error').click({ button: 'right' });
    await expect(page.getByTestId('word-editor')).toContainText('correctword');
    await expect(page.getByTestId('word-editor')).not.toContainText('misspeled');
  });

  test('persists comments after save and reopen', async ({ page }) => {
    await typeInEditor(page, 'Comment persistence target');
    await selectAllInEditor(page);
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Comments/i }).click();
    await stubPrompt(page, 'Reopen me');
    await page.getByRole('button', { name: '+ Selection' }).click();
    await expect(page.locator('.comment-card p')).toContainText('Reopen me');
    await saveToPath(page, PATHS.savedDansword);
    const saved = await page.evaluate(
      (path) => window.__DANSWORD_TEST__?.readStoredFile(path),
      PATHS.savedDansword,
    );
    expect(saved).toContain('Reopen me');
    await goHome(page);
    await page.evaluate(
      ({ path, content }) => {
        window.__DANSWORD_TEST__?.seedFile(path, content!);
      },
      { path: PATHS.savedDansword, content: saved },
    );
    await page.getByTestId('home-recent-row').first().click();
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Comments/i }).click();
    await expect(page.locator('.comment-card')).toHaveCount(1);
    await expect(page.locator('.comment-card p')).toContainText('Reopen me');
  });
});

test.describe('Layout, settings, and workflows', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('shows page numbers when enabled in header and footer dialog', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Header\/Footer/i }).click();
    await page.getByPlaceholder('Footer appears at bottom of each page').fill('Footer note');
    await page.getByLabel('Show page numbers in footer').check();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.doc-page-shell-label').first()).toContainText('Page 1 of');
    await expect(page.getByText('Footer note')).toBeVisible();
  });

  test('stores accent color and proofing language in settings', async ({ page }) => {
    await openBlankDocument(page);
    await openBackstage(page, 'options');
    await page.getByLabel('Accent color').fill('#ff5500');
    await page.getByLabel('Proofing language').selectOption('de-DE');
    await page.getByRole('button', { name: /Back to document/i }).click();
    const settings = await page.evaluate(async () => window.dansword.getSettings());
    expect(settings.accentColor).toBe('#ff5500');
    expect(settings.language).toBe('de-DE');
  });

  test('generates merged DOCX files from mail merge wizard', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'file');
    await page.getByRole('button', { name: /Mail Merge/i }).click();
    await page.getByRole('button', { name: 'Insert sample fields' }).click();
    await page.getByRole('button', { name: 'Generate documents' }).click();
    await expect(page.getByText(/Generated 2 merged document/)).toBeVisible();
    const files = await page.evaluate(() => window.__DANSWORD_TEST__?.listStoredFiles() ?? []);
    expect(files.some((file) => file.includes('Merge_Jane.docx'))).toBe(true);
    expect(files.some((file) => file.includes('Merge_John.docx'))).toBe(true);
  });

  test('writes letter template edits to DOCX and reopens through UI', async ({ page }) => {
    await openTemplate(page, 'letter');
    await typeInEditor(page, ' Client addition.');
    await saveToPath(page, PATHS.savedDocx);
    const savedB64 = await page.evaluate(
      (path) => window.__DANSWORD_TEST__?.readStoredBinaryBase64(path),
      PATHS.savedDocx,
    );
    expect(savedB64?.length).toBeGreaterThan(100);
    await goHome(page);
    await page.evaluate(
      ({ path, b64 }) => {
        window.__DANSWORD_TEST__?.seedBinaryFile(path, b64!);
        window.__DANSWORD_TEST__?.setOpenFileResult(path);
      },
      { path: PATHS.savedDocx, b64: savedB64 },
    );
    await page.getByTestId('home-recent-row').first().click();
    await expect(page.getByTestId('word-editor')).toContainText('Client addition');
  });

  test('keeps recent documents after a full page reload', async ({ page }) => {
    await openBlankDocument(page);
    await saveToPath(page, PATHS.recentDoc);
    await goHome(page);
    await expect(page.getByTestId('home-recent-row')).toContainText('recent.docx');
    await page.reload();
    await page.getByTestId('home-screen').waitFor({ state: 'visible' });
    await expect(page.getByTestId('home-recent-row')).toContainText('recent.docx');
  });
});
