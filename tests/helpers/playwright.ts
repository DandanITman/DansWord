import type { Page } from '@playwright/test';

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

export async function focusEditor(page: Page) {
  const editor = page.getByTestId('word-editor');
  await editor.click();
  return editor;
}

export async function typeInEditor(page: Page, text: string) {
  const editor = await focusEditor(page);
  await editor.pressSequentially(text, { delay: 10 });
}

export async function selectAllInEditor(page: Page) {
  await focusEditor(page);
  await page.keyboard.press('Control+A');
}

export async function switchRibbonTab(page: Page, tab: string) {
  await page.locator(`.ribbon-tab[data-tab="${tab}"]`).click();
}

export async function applyBold(page: Page) {
  await switchRibbonTab(page, 'edit');
  await page.getByTestId('ribbon-bold').click();
}

export async function applyItalic(page: Page) {
  await switchRibbonTab(page, 'edit');
  await page.getByTestId('ribbon-italic').click();
}

export async function applyUnderline(page: Page) {
  await switchRibbonTab(page, 'edit');
  await page.getByTestId('ribbon-underline').click();
}

export async function setFontSize(page: Page, size: string) {
  await switchRibbonTab(page, 'edit');
  await page.getByTestId('ribbon-font-size').selectOption(size);
}

import { buildRegressionDocumentContent } from '../fixtures/regressionDocument';

export async function loadRegressionFixture(page: Page) {
  await openBlankDocument(page);
  const content = buildRegressionDocumentContent();
  await page.evaluate((docContent) => {
    window.__DANSWORD_TEST__?.loadEditorContent(docContent);
  }, content);
  await page.getByText('DansWord Regression Test').waitFor({ state: 'visible' });
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
