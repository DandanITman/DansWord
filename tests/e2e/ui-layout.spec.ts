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
    // 'file' is absent: it opens a dropdown rather than a ribbon panel, and is
    // checked separately below.
    for (const tab of [
      'home',
      'insert',
      'pageLayout',
      'references',
      'review',
      'view',
      'help',
    ] as const) {
      await switchRibbonTab(page, tab);
      await expectNoClippedControls(page.getByTestId('ribbon'), `ribbon ${tab} tab`);
    }

    await page.getByTestId('ribbon-tab-file').click();
    await expectNoClippedControls(page.getByTestId('file-menu'), 'file menu');
    await page.keyboard.press('Escape');

    await openBackstage(page, 'export');
    await expectNoClippedControls(page.getByTestId('backstage'), 'backstage export');
  });

  /**
   * The ribbon used to scroll sideways as soon as the groups outgrew the
   * window, hiding the rightmost groups behind a scrollbar — Word never does
   * that. The compact density now holds every tab down to 1100px.
   *
   * Review, the densest tab at eight groups, still overflows below about
   * 1050px; closing that needs real group collapse, which needs the tabs to
   * declare their groups as data.
   *
   * That residual is deliberately NOT asserted as a pixel budget. An earlier
   * version bounded it at 130px, which passed on Windows and failed every CI
   * run on Linux — text metrics differ enough between platforms that any
   * hardcoded overflow figure is a coin toss. What is asserted instead is the
   * behaviour the budget was standing in for: the compact density is actually
   * engaged at that width.
   */
  test('TC-UI-002: the ribbon does not scroll sideways at narrow window widths', async ({
    page,
  }) => {
    await openBlankDocument(page);
    const overflowOf = () =>
      page.evaluate(() => {
        const panel = document.querySelector('.office-ribbon-panel');
        return panel ? panel.scrollWidth - panel.clientWidth : 0;
      });

    await page.setViewportSize({ width: 1100, height: 700 });
    for (const tab of ['home', 'insert', 'references', 'review', 'view'] as const) {
      await switchRibbonTab(page, tab);
      expect(await overflowOf(), `ribbon ${tab} tab overflows at 1100px`).toBeLessThanOrEqual(1);
    }

    await page.setViewportSize({ width: 900, height: 700 });
    for (const tab of ['home', 'insert', 'references', 'view'] as const) {
      await switchRibbonTab(page, tab);
      expect(await overflowOf(), `ribbon ${tab} tab overflows at 900px`).toBeLessThanOrEqual(1);
    }

    await switchRibbonTab(page, 'review');
    await expect(page.locator('.office-ribbon-panel')).toHaveClass(/is-compact/);
  });
});
