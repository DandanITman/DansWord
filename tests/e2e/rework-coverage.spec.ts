import { test, expect } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  typeInEditor,
  focusEditor,
  selectAllInEditor,
  answerPrompt,
  switchRibbonTab,
  clickRibbon,
  acceptAppDialogs,
  saveToPath,
  PATHS,
} from '../helpers/playwright';

/**
 * Features added during the rework that shipped without coverage.
 *
 * Each of these replaced something that was dead, stubbed or silently wrong,
 * so they are exactly the ones a regression would go unnoticed in.
 */
test.describe('Reworked features', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
  });

  test('TC-VIEW-005: the word count dialog reports real counts', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'one two three four five');

    // The View tab previously had no word count command at all.
    await clickRibbon(page, 'view', 'ribbon-word-count');

    const dialog = page.getByTestId('word-count-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('word-count-words')).toHaveText('5');
    await expect(page.getByTestId('word-count-characters')).toHaveText('23');

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('TC-VIEW-006: web layout is a real mode, not a dead button', async ({ page }) => {
    await openBlankDocument(page);
    const scroll = page.locator('.editor-scroll');
    await expect(scroll).not.toHaveClass(/web-layout/);

    // This button called onViewModeChange('web') while App mapped anything not
    // 'focus' to print, so it could never activate.
    await page.getByTestId('status-bar').getByTitle('Web Layout').click();
    await expect(scroll).toHaveClass(/web-layout/);

    await page.getByTestId('status-bar').getByTitle('Print Layout').click();
    await expect(scroll).not.toHaveClass(/web-layout/);
  });

  test('TC-VIEW-007: the page indicator follows the caret', async ({ page }) => {
    await openBlankDocument(page);
    const indicator = page.getByTestId('status-page-indicator');
    await expect(indicator).toHaveText(/^1\//);

    // Seed a document long enough to paginate. The feature under test is the
    // indicator following the caret, so the content is fixture data.
    await page.evaluate(() => {
      window.__DANSWORD_TEST__?.loadEditorContent({
        type: 'doc',
        content: Array.from({ length: 80 }, (_, i) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: `Line ${i} of a document long enough to paginate.` }],
        })),
      });
    });

    await expect.poll(async () => indicator.textContent()).not.toMatch(/^1\/1$/);

    // At the end of a multi-page document the caret is past page one. Click the
    // paragraph itself rather than the middle of the editor: that lands on the
    // text for certain, so the caret really is where the assertion assumes.
    const paragraphs = page.getByTestId('word-editor').locator('> p');
    await paragraphs.last().click();
    await expect.poll(async () => indicator.textContent()).not.toMatch(/^1\//);

    await paragraphs.first().click();
    await expect.poll(async () => indicator.textContent()).toMatch(/^1\//);
  });

  test('TC-EDIT-023: find reports a live match count', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'alpha beta alpha gamma alpha');

    await page.keyboard.press('Control+f');
    await page.getByTestId('find-input').fill('alpha');

    // Previously a miss opened a blocking modal and there was no count at all.
    await expect(page.getByTestId('find-count')).toHaveText('1 of 3');

    await page.getByTestId('find-next').click();
    await expect(page.getByTestId('find-count')).toHaveText('2 of 3');

    await page.getByTestId('find-input').fill('nothinghere');
    await expect(page.getByTestId('find-count')).toHaveText('No results');
  });

  test('TC-EDIT-024: Ctrl+H focuses the replace field', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'replace me');

    // Ctrl+H used to be byte-identical to Ctrl+F, leaving focus in Find.
    await page.keyboard.press('Control+h');
    await expect(page.getByTestId('replace-input')).toBeFocused();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+f');
    await expect(page.getByTestId('find-input')).toBeFocused();
  });

  test('TC-LAY-006: the margin preset select reflects the active margins', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'pageLayout');
    await page.getByRole('button', { name: /Page Setup/i }).click();

    const preset = page.getByTestId('page-margin-preset');
    // Defaults are the Normal preset; the select had no `value` before, so it
    // always displayed "Custom".
    await expect(preset).toHaveValue('Normal');

    await preset.selectOption('Narrow');
    await expect(preset).toHaveValue('Narrow');
  });

  test('TC-EDIT-025: the style editor lists the built-in styles', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'edit');
    await page.getByRole('button', { name: /More Styles/i }).click();

    // The list filtered out the five built-in ids, but a new document's
    // customStyles *is* those built-ins — so it was always empty.
    const list = page.getByTestId('style-list');
    await expect(list).toBeVisible();
    await expect(list.getByRole('button')).not.toHaveCount(0);
    await expect(list).toContainText('Normal');

    // Editing is a form now, not three chained modal prompts.
    await page.getByTestId('style-item-heading1').click();
    await page.getByTestId('style-font-family').selectOption('Georgia');
    await expect(list).toContainText('Georgia');
  });

  test('TC-HOME-001: About opens and recent entries can be removed', async ({ page }) => {
    await openBlankDocument(page);
    await saveToPath(page, PATHS.savedDansword);

    await page.getByTestId('editor-titlebar').getByTitle('Home screen').first().click();
    await expect(page.getByTestId('home-screen')).toBeVisible();

    // "About" was permanently disabled.
    await page.getByTestId('home-about').click();
    await expect(page.getByTestId('about-dialog')).toBeVisible();
    await page.getByTestId('about-dialog').getByRole('button', { name: 'Close' }).click();

    // The recent-file "More" button had no onClick at all.
    const row = page.locator('.home-doc-actions').first();
    await expect(row).toBeVisible();
    await row.getByTitle('Remove from recent').click();
    await expect(page.locator('.home-doc-actions')).toHaveCount(0);
  });

  test('TC-REV-008: tracked deletions are kept and reject restores them', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'keep this sentence');

    await clickRibbon(page, 'review', 'ribbon-track-changes');

    // Delete a word with track changes on.
    await focusEditor(page);
    await page.keyboard.press('Control+End');
    for (let i = 0; i < 9; i += 1) await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Backspace');

    // The text stays, struck through, rather than disappearing.
    await expect(page.locator('.track-delete')).toHaveCount(1);

    await clickRibbon(page, 'review', 'ribbon-reject-all');
    await expect(page.getByTestId('word-editor')).toContainText('keep this sentence');
    await expect(page.locator('.track-delete')).toHaveCount(0);
  });

  test('TC-REV-010: pending tracked changes are counted', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'original wording');
    await clickRibbon(page, 'review', 'ribbon-track-changes');

    // countTrackChanges existed but nothing in the UI called it, so there was
    // no way to see how much was waiting for a decision.
    await expect(page.getByTestId('ribbon-change-summary')).toHaveText('No pending changes');

    await focusEditor(page);
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' plus more');

    await switchRibbonTab(page, 'review');
    await expect(page.getByTestId('ribbon-pending-insertions')).toHaveText('1 inserted');
    await expect(page.getByTestId('status-pending-changes')).toHaveText('1 pending change');

    await clickRibbon(page, 'review', 'ribbon-accept-all');
    await expect(page.getByTestId('ribbon-change-summary')).toHaveText('No pending changes');
    await expect(page.getByTestId('status-pending-changes')).toHaveCount(0);
  });

  test('TC-EDIT-026: Ctrl+K links the selection', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'DansWord site');
    await selectAllInEditor(page);

    // Insert > Link existed; the shortcut every word processor has did not.
    await page.keyboard.press('Control+k');
    await answerPrompt(page, 'https://example.com/docs');

    await expect(page.getByTestId('word-editor').locator('a')).toHaveAttribute(
      'href',
      'https://example.com/docs',
    );
  });

  test('TC-FILE-010: Ctrl+P prints and Ctrl+Shift+S saves under a new name', async ({ page }) => {
    await openBlankDocument(page);
    await typeInEditor(page, 'shortcut coverage');
    await saveToPath(page, PATHS.savedDansword);

    await page.keyboard.press('Control+p');
    await expect
      .poll(async () => page.evaluate(() => window.__DANSWORD_TEST__?.getPrintCallCount()))
      .toBe(1);

    // Ctrl+Shift+S must ask where to save rather than overwriting the open
    // file the way a plain Ctrl+S does.
    const copyPath = 'C:\\DansWordTest\\copy.dansword';
    await page.evaluate((p) => window.__DANSWORD_TEST__?.setSaveFileResult(p), copyPath);
    await page.keyboard.press('Control+Shift+S');

    await expect
      .poll(async () =>
        page.evaluate((p) => window.__DANSWORD_TEST__?.readStoredFile(p), copyPath),
      )
      .not.toBeNull();
  });

  test('TC-REV-009: add to dictionary stops a word being flagged', async ({ page }) => {
    await page.evaluate(() => {
      window.__DANSWORD_TEST__?.setSpellCheckResults([false]);
    });
    await openBlankDocument(page);
    await typeInEditor(page, 'danswordium');

    await expect.poll(async () => page.locator('.spell-error').count()).toBeGreaterThan(0);
    await page.locator('.spell-error').click({ button: 'right' });

    // The menu previously offered only "Ignore", which closed it and did nothing.
    await page.getByRole('menuitem', { name: 'Add to dictionary' }).click();

    await expect
      .poll(async () => page.evaluate(() => window.dansword.getUserDictionary()))
      .toContain('danswordium');
  });
});
