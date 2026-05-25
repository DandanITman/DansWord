import { test, expect } from '@playwright/test';
import {
  resetTestState,
  openBlankDocument,
  loadRegressionFixture,
  loadHeadingFixture,
  openFindReplace,
  switchRibbonTab,
  visualMaskLocators,
} from '../helpers/playwright';

test.describe('Extended visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestState(page);
  });

  for (const tab of ['file', 'insert', 'design', 'pageLayout', 'review', 'view'] as const) {
    test(`TC-VIS-004: ribbon ${tab} tab`, async ({ page }) => {
      await openBlankDocument(page);
      await page.getByTestId(`ribbon-tab-${tab}`).click();
      await expect(page.getByTestId('ribbon')).toHaveScreenshot(`ribbon-${tab}.png`, {
        mask: visualMaskLocators(page),
      });
    });
  }

  test('find and replace bar open', async ({ page }) => {
    await openBlankDocument(page);
    await openFindReplace(page);
    await expect(page.getByTestId('app-shell')).toHaveScreenshot('find-replace-bar.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('editor dark theme', async ({ page }) => {
    await openBlankDocument(page);
    await page.getByTestId('editor-titlebar').getByTitle('Toggle theme').click();
    await expect(page.getByTestId('app-shell')).toHaveScreenshot('editor-dark.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('TC-VIEW-003: focus mode layout', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'view');
    await page.getByTestId('ribbon').getByRole('button', { name: /Focus Mode/i }).click();
    await expect(page.getByTestId('app-shell')).toHaveScreenshot('focus-mode.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('navigation pane with headings', async ({ page }) => {
    await loadHeadingFixture(page);
    await switchRibbonTab(page, 'view');
    await page.getByRole('button', { name: /Navigation/i }).click();
    await expect(page.getByTestId('app-shell')).toHaveScreenshot('navigation-pane.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('comments pane open', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'review');
    await page.getByRole('button', { name: /Comments/i }).click();
    await expect(page.getByTestId('app-shell')).toHaveScreenshot('comments-pane.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('document with table and formatted content', async ({ page }) => {
    await loadRegressionFixture(page);
    await page.evaluate(() => window.__DANSWORD_TEST__?.runEditorCommand('insertTable'));
    await expect(page.getByTestId('document-canvas')).toHaveScreenshot('editor-table-content.png', {
      mask: visualMaskLocators(page),
    });
  });

  test('backstage export section', async ({ page }) => {
    await openBlankDocument(page);
    await switchRibbonTab(page, 'file');
    await page.getByRole('button', { name: /Save As \/ Export/i }).click();
    await page.getByTestId('backstage-nav-export').click();
    await expect(page.getByTestId('backstage')).toHaveScreenshot('backstage-export.png', {
      mask: visualMaskLocators(page),
    });
  });
});
