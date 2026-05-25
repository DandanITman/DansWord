import { test, expect } from '@playwright/test';
import { REGRESSION_SAVE_PATH } from '../fixtures/regressionDocument';
import {
  resetTestState,
  openBlankDocument,
  typeInEditor,
  focusEditor,
  switchRibbonTab,
} from '../helpers/playwright';

test.describe('DansWord editor e2e', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestState(page);
  });

  test('TC-FILE-001: opens home screen and creates a blank document', async ({ page }) => {
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await openBlankDocument(page);
    await expect(page.getByTestId('word-editor')).toBeVisible();
    await expect(page.getByTestId('ribbon')).toBeVisible();
    await expect(page.getByTestId('editor-titlebar')).toBeVisible();
  });

  test('TC-EDIT-001 TC-EDIT-002: types text and applies bold, italic, and underline formatting', async ({ page }) => {
    await openBlankDocument(page);
    await page.evaluate(() => {
      window.__DANSWORD_TEST__?.loadEditorContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Bold text', marks: [{ type: 'bold' }] }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Italic text', marks: [{ type: 'italic' }] }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Underlined text', marks: [{ type: 'underline' }] }],
          },
        ],
      });
    });

    await expect(page.getByTestId('word-editor').locator('strong')).toContainText('Bold text');
    await expect(page.getByTestId('word-editor').locator('em')).toContainText('Italic text');
    await expect(page.getByTestId('word-editor').locator('u')).toContainText('Underlined text');
  });

  test('TC-EDIT-003 TC-EDIT-004: changes font size and alignment using toolbar controls', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Sized and aligned text');
    await focusEditor(page);
    await page.keyboard.press('Control+A');
    await switchRibbonTab(page, 'edit');
    await page.getByTestId('ribbon-font-size').selectOption('18');
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('setTextAlignCenter'));

    const editorJson = await page.evaluate(() => window.__DANSWORD_TEST__?.getEditorJson());
    expect(JSON.stringify(editorJson)).toContain('"textAlign":"center"');
    await expect(page.getByTestId('word-editor')).toContainText('Sized and aligned text');
  });

  test('TC-EDIT-005: creates bullet and numbered lists', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Bullet one');
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleBulletList'));
    await focusEditor(page);
    await page.keyboard.press('Enter');
    await typeInEditor(page, 'Bullet two');

    await focusEditor(page);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await typeInEditor(page, 'Number one');
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('toggleOrderedList'));
    await focusEditor(page);
    await page.keyboard.press('Enter');
    await typeInEditor(page, 'Number two');

    await expect(page.getByTestId('word-editor').locator('ul li')).toHaveCount(2);
    await expect(page.getByTestId('word-editor').locator('ol li')).toHaveCount(2);
  });

  test('TC-EDIT-006: supports undo and redo keyboard shortcuts', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Undo redo sample');
    await focusEditor(page);
    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('word-editor')).not.toContainText('Undo redo sample');
    await page.keyboard.press('Control+y');
    await expect(page.getByTestId('word-editor')).toContainText('Undo redo sample');
  });

  test('TC-FILE-002: saves, reloads, and restores document content and formatting', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Persist me');
    await focusEditor(page);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Control+b');

    await page.evaluate((path) => {
      window.__DANSWORD_TEST__?.setSaveFileResult(path);
    }, REGRESSION_SAVE_PATH);
    await switchRibbonTab(page, 'file');
    await page.getByTestId('ribbon-save').click();
    await expect
      .poll(async () =>
        page.evaluate(
          (path) => window.__DANSWORD_TEST__?.readStoredFile(path) ?? null,
          REGRESSION_SAVE_PATH,
        ),
      )
      .not.toBeNull();

    const saved = await page.evaluate(
      (path) => window.__DANSWORD_TEST__?.readStoredFile(path) ?? '',
      REGRESSION_SAVE_PATH,
    );
    expect(saved).toContain('Persist me');
    expect(saved).toContain('"type": "bold"');

    await page.reload();
    await page.evaluate(
      ({ path, fileContent }) => {
        window.__DANSWORD_TEST__?.reset();
        window.__DANSWORD_TEST__?.seedFile(path, fileContent);
        window.__DANSWORD_TEST__?.setOpenFileResult(path);
      },
      { path: REGRESSION_SAVE_PATH, fileContent: saved },
    );

    await page.locator('.home-sidebar-nav').getByRole('button', { name: 'Open' }).click();
    await expect(page.getByTestId('word-editor')).toContainText('Persist me');
    await expect(page.getByTestId('word-editor').locator('strong')).toContainText('Persist me');
  });

  test('creates a new document and returns to home', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'Document one');
    await page.getByTestId('titlebar-new').click();
    await typeInEditor(page, 'Document two');
    await expect(page.getByTestId('word-editor')).toContainText('Document two');

    await page.getByTestId('editor-titlebar').getByTitle('Home screen').first().click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
  });

  test('opens save backstage panel from the ribbon', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'file');
    await page.getByRole('button', { name: /Save As \/ Export/i }).click();
    await expect(page.getByTestId('backstage')).toBeVisible();
  });
});
