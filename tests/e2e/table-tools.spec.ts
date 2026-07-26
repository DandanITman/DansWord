import { test, expect, type Page } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  switchRibbonTab,
  acceptAppDialogs,
} from '../helpers/playwright';

const editor = (page: Page) => page.getByTestId('word-editor');

/** Insert the default 3x3 table and put the caret in its first body cell. */
async function insertTable(page: Page) {
  await switchRibbonTab(page, 'insert');
  await page.getByTestId('ribbon-table').click();
  await editor(page).locator('table').waitFor({ state: 'visible' });
  await editor(page).locator('td').first().click();
}

/** Click a table tool, re-selecting the Insert tab first. */
async function tableTool(page: Page, testId: string) {
  await switchRibbonTab(page, 'insert');
  await page.getByTestId(testId).click();
}

/**
 * The table tools had no coverage at all.
 *
 * Before this feature existed the app could insert a 3x3 table and never touch
 * it again — there was no way to add or remove a row or column, merge cells,
 * toggle a header row, or delete the table except with undo.
 */
test.describe('Table tools', () => {
  test.beforeEach(async ({ page }) => {
    acceptAppDialogs(page);
    await resetTestState(page);
    await openBlankDocument(page);
  });

  test('TC-TBL-001: the table tools appear only when the caret is in a table', async ({ page }) => {
    await switchRibbonTab(page, 'insert');
    await expect(page.getByTestId('ribbon-table-tools')).toHaveCount(0);

    await insertTable(page);
    await switchRibbonTab(page, 'insert');
    await expect(page.getByTestId('ribbon-table-tools')).toBeVisible();
  });

  test('TC-TBL-002: inserts a row above and below', async ({ page }) => {
    await insertTable(page);
    // 3x3 with a header row: 1 header row + 2 body rows.
    await expect(editor(page).locator('tr')).toHaveCount(3);

    await tableTool(page, 'table-add-row-before');
    await expect(editor(page).locator('tr')).toHaveCount(4);

    await editor(page).locator('td').first().click();
    await tableTool(page, 'table-add-row-after');
    await expect(editor(page).locator('tr')).toHaveCount(5);
  });

  test('TC-TBL-003: deletes a row', async ({ page }) => {
    await insertTable(page);
    await expect(editor(page).locator('tr')).toHaveCount(3);

    await tableTool(page, 'table-delete-row');
    await expect(editor(page).locator('tr')).toHaveCount(2);
  });

  test('TC-TBL-004: inserts a column left and right', async ({ page }) => {
    await insertTable(page);
    await expect(editor(page).locator('tr').first().locator('th, td')).toHaveCount(3);

    await tableTool(page, 'table-add-col-before');
    await expect(editor(page).locator('tr').first().locator('th, td')).toHaveCount(4);

    await editor(page).locator('td').first().click();
    await tableTool(page, 'table-add-col-after');
    await expect(editor(page).locator('tr').first().locator('th, td')).toHaveCount(5);
  });

  test('TC-TBL-005: deletes a column', async ({ page }) => {
    await insertTable(page);
    await expect(editor(page).locator('tr').first().locator('th, td')).toHaveCount(3);

    await tableTool(page, 'table-delete-col');
    await expect(editor(page).locator('tr').first().locator('th, td')).toHaveCount(2);
  });

  test('TC-TBL-006: merges cells across a selection', async ({ page }) => {
    await insertTable(page);

    // Select the first two cells of the first body row.
    const cells = editor(page).locator('td');
    await cells.nth(0).click();
    await cells.nth(1).click({ modifiers: ['Shift'] });

    await tableTool(page, 'table-merge-cells');

    await expect(editor(page).locator('td[colspan="2"]')).toHaveCount(1);
  });

  test('TC-TBL-007: splits a merged cell again', async ({ page }) => {
    await insertTable(page);

    const cells = editor(page).locator('td');
    await cells.nth(0).click();
    await cells.nth(1).click({ modifiers: ['Shift'] });
    await tableTool(page, 'table-merge-cells');
    await expect(editor(page).locator('td[colspan="2"]')).toHaveCount(1);

    await editor(page).locator('td[colspan="2"]').click();
    await tableTool(page, 'table-split-cell');
    await expect(editor(page).locator('td[colspan="2"]')).toHaveCount(0);
  });

  test('TC-TBL-008: toggles the header row', async ({ page }) => {
    await insertTable(page);
    await expect(editor(page).locator('th')).toHaveCount(3);

    // Toggling from the first body cell converts that row into headers.
    await tableTool(page, 'table-toggle-header');
    await expect(editor(page).locator('th')).not.toHaveCount(3);
  });

  test('TC-TBL-009: deletes the whole table', async ({ page }) => {
    await insertTable(page);
    await expect(editor(page).locator('table')).toHaveCount(1);

    await tableTool(page, 'table-delete');
    await expect(editor(page).locator('table')).toHaveCount(0);
  });

  test('TC-TBL-010: typed cell content survives a structural edit', async ({ page }) => {
    await insertTable(page);
    await page.keyboard.type('kept text');
    await expect(editor(page).locator('td').first()).toContainText('kept text');

    await editor(page).locator('td').first().click();
    await tableTool(page, 'table-add-row-after');

    await expect(editor(page).locator('td').first()).toContainText('kept text');
  });
});
