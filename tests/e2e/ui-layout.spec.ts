import { test, expect, type Locator } from '@playwright/test';
import { resetTestState, openBlankDocument, switchRibbonTab, openBackstage } from '../helpers/playwright';

const CONTROL_SELECTOR = [
  'button',
  'select',
  'input:not([type="hidden"])',
  'textarea',
  '[role="button"]',
  '[role="textbox"]',
].join(',');

async function expectNoClippedControls(root: Locator, label: string) {
  const issues = await root.evaluate((container, selector) => {
    const containerRect = container.getBoundingClientRect();
    const controls = Array.from(container.querySelectorAll<HTMLElement>(selector));

    return controls.flatMap((control) => {
      const style = window.getComputedStyle(control);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return [];
      }

      const rect = control.getBoundingClientRect();
      const name =
        control.getAttribute('aria-label') ||
        control.getAttribute('title') ||
        control.textContent?.trim().replace(/\s+/g, ' ') ||
        control.tagName.toLowerCase();
      const currentIssues: string[] = [];

      if (rect.width < 8 || rect.height < 8) {
        currentIssues.push(`${name}: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
      if (
        rect.left < containerRect.left - 1 ||
        rect.right > containerRect.right + 1 ||
        rect.top < containerRect.top - 1 ||
        rect.bottom > containerRect.bottom + 1
      ) {
        currentIssues.push(`${name}: outside ${Math.round(containerRect.width)}x${Math.round(containerRect.height)} container`);
      }
      const canCheckTextClip =
        control.tagName !== 'SELECT' &&
        control.tagName !== 'INPUT' &&
        control.tagName !== 'TEXTAREA';

      if (
        canCheckTextClip &&
        control.textContent?.trim() &&
        control.scrollWidth > control.clientWidth + 2 &&
        style.textOverflow !== 'ellipsis'
      ) {
        currentIssues.push(`${name}: clipped text`);
      }

      return currentIssues;
    });
  }, CONTROL_SELECTOR);

  expect(issues, `${label} should not have clipped or offscreen controls`).toEqual([]);
}

test.describe('UI layout guards', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestState(page);
  });

  test('TC-UI-001: primary app surfaces keep controls visible and unclipped', async ({ page }) => {
    await expectNoClippedControls(page.getByTestId('home-screen'), 'home screen');

    await openBlankDocument(page);
    for (const tab of ['file', 'edit', 'insert', 'design', 'pageLayout', 'review', 'view'] as const) {
      await switchRibbonTab(page, tab);
      await expectNoClippedControls(page.getByTestId('ribbon'), `ribbon ${tab} tab`);
    }

    await openBackstage(page, 'export');
    await expectNoClippedControls(page.getByTestId('backstage'), 'backstage export');
  });
});
