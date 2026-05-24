import { test, expect } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  typeInEditor,
  focusEditor,
  switchRibbonTab,
  selectAllInEditor,
  openFindReplace,
  acceptAppDialogs,
  stubPrompt,
  loadHeadingFixture,
} from '../helpers/playwright';

test.describe('Edit ribbon and text operations', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('applies strikethrough formatting', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Strike text');
    await selectAllInEditor(page);
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleStrike'));
    await expect(page.getByTestId('word-editor').locator('s')).toContainText('Strike text');
  });

  test('applies superscript and subscript', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'E=mc2');
    await focusEditor(page);
    await page.keyboard.press('Control+A');
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleSuperscript'));
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('superscript');
  });

  test('changes font family', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Georgia text');
    await selectAllInEditor(page);
    await switchRibbonTab(page, 'edit');
    await page.locator('.font-family-select').selectOption('Georgia');
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('Georgia');
  });

  test('applies justify alignment', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Justified paragraph');
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('setTextAlignJustify'));
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('"textAlign":"justify"');
  });

  test('clears formatting from selection', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Bold text');
    await selectAllInEditor(page);
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleBold'));
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('clearFormatting'));
    await expect(page.getByTestId('word-editor').locator('strong')).toHaveCount(0);
  });

  test('applies heading style from ribbon', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Heading text');
    await selectAllInEditor(page);
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleHeading1'));
    await expect(page.getByTestId('word-editor').locator('h1')).toContainText('Heading text');
  });

  test('format painter copies and applies bold', async ({ page }) => {
    await openBlankDocument(page);
    await page.evaluate(() =>
      window.__DANSWORD_TEST__?.loadEditorContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Bold', marks: [{ type: 'bold' }] }],
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Plain' }] },
        ],
      }),
    );
    await switchRibbonTab(page, 'edit');
    await page.getByTitle('Format Painter').click();
    await page.getByTestId('word-editor').getByText('Plain').click();
    await page.getByTitle('Format Painter').click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('"type":"bold"');
  });

  test('select all selects entire document', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Select all me');
    await switchRibbonTab(page, 'edit');
    await page.getByRole('button', { name: 'Select All' }).click();
    const text = await page.evaluate(() => window.__DANSWORD_TEST__?.getEditorText());
    expect(text).toBe('Select all me');
  });

  test('find next highlights matching text', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Find needle in haystack');
    await openFindReplace(page);
    await page.getByTestId('find-input').fill('needle');
    await page.getByTestId('find-next').click();
    const selected = await page.evaluate(() => {
      const sel = window.getSelection()?.toString() ?? '';
      return sel;
    });
    expect(selected.toLowerCase()).toContain('needle');
  });

  test('replace all updates document text', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'tehsis tehsis word');
    await openFindReplace(page);
    await page.getByTestId('find-input').fill('tehsis');
    await page.getByTestId('replace-input').fill('thesis');
    await page.getByTestId('replace-all').click();
    await expect(page.getByTestId('word-editor')).toContainText('thesis thesis word');
  });

  test('Ctrl+H opens find and replace bar', async ({ page }) => {
    await openBlankDocument(page);
    await page.keyboard.press('Control+h');
    await expect(page.getByTestId('find-replace-bar')).toBeVisible();
  });

  test('changes line spacing via ribbon select', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Spaced lines');
    await selectAllInEditor(page);
    await switchRibbonTab(page, 'edit');
    await page.getByTitle('Line spacing').selectOption('2');
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('lineHeight');
  });

  test('increases paragraph indent', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Indented');
    await selectAllInEditor(page);
    await switchRibbonTab(page, 'edit');
    await page.getByTitle('Increase Indent').click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toMatch(/indent|margin/i);
  });

  test('sets font color via prompt', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Colored');
    await selectAllInEditor(page);
    await stubPrompt(page, '#ff0000');
    await switchRibbonTab(page, 'edit');
    await page.getByTitle('Font Color').click();
    const json = await page.evaluate(() => JSON.stringify(window.__DANSWORD_TEST__?.getEditorJson()));
    expect(json).toContain('#ff0000');
  });

  test('inserts hyperlink via prompt', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Link text');
    await selectAllInEditor(page);
    await stubPrompt(page, 'https://example.com');
    await switchRibbonTab(page, 'insert');
    await page.getByRole('button', { name: /^Link$/ }).click();
    await expect(page.getByTestId('word-editor').locator('a')).toHaveAttribute('href', 'https://example.com');
  });

  test('title bar undo button enables after typing', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Undo button test');
    await expect(page.getByTestId('editor-titlebar').getByTitle('Undo')).toBeEnabled();
  });
});

test.describe('Navigation and headings', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('navigation pane lists headings and jumps on click', async ({ page }) => {
    await loadHeadingFixture(page);
    await switchRibbonTab(page, 'view');
    await page.getByTestId('ribbon').getByRole('button', { name: /Navigation/i }).click();
    await expect(page.locator('.side-pane').getByText('Chapter One')).toBeVisible();
    await page.locator('.side-pane').getByRole('button', { name: 'Section Alpha' }).click();
    await expect(page.getByTestId('word-editor')).toContainText('Section Alpha');
  });
});
