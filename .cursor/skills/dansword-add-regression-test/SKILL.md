---
name: dansword-add-regression-test
description: >-
  Add regression tests for DansWord editor features. Use when implementing new
  word processor features, fixing formatting/persistence bugs, or extending the
  Playwright/Vitest test suite.
---

# Add DansWord regression tests, fixing editor bugs, or when the user asks to extend test coverage.

## Project context

- **Stack:** npm workspaces, Electron + React + TipTap, Vitest (unit), Playwright (e2e + visual)
- **Harness:** Browser tests use `apps/desktop/test.html` with mock `window.dansword` — not real Electron IPC
- **Catalog:** Every scenario has an ID in `docs/test-cases.md` and `tests/catalog/test-catalog.json`

## When adding a feature

1. Add catalog entries (ID, area, priority, type: unit|e2e|visual|electron-manual)
2. Implement automated tests where the harness supports it
3. Mark electron-only flows as `electron-manual` in catalog
4. Add `data-testid` only where selectors would otherwise be fragile
5. Run `npm run regression` before finishing

## Test file locations

| Type | Path |
|------|------|
| Unit (core) | `packages/core/src/*.test.ts` |
| Unit (openxml) | `packages/openxml/src/*.test.ts` |
| Unit (editor) | `apps/desktop/src/editor/*.test.ts` |
| E2E | `tests/e2e/*.spec.ts` |
| Visual | `tests/visual/*.spec.ts` |
| Fixtures | `tests/fixtures/` |
| Helpers | `tests/helpers/playwright.ts`, `tests/helpers/mock-dansword.ts` |

## E2E template

```typescript
import { test, expect } from '@playwright/test';
import { resetTestState, openBlankDocument } from '../helpers/playwright';

test.describe('feature area', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestState(page);
  });

  test('TC-XXX: description', async ({ page }) => {
    await openBlankDocument(page);
    // ...
  });
});
```

## Catalog entry template

```json
{
  "id": "TC-EDIT-001",
  "title": "Apply strikethrough from ribbon",
  "area": "edit",
  "priority": "medium",
  "type": "e2e",
  "status": "pending",
  "automated": false
}
```

## Rules

- Do not remove or weaken existing tests
- Do not skip tests without documenting reason in catalog
- Use deterministic fixtures — no real user data or paid services
- Mask dynamic UI in visual tests via `visualMaskLocators()`
- Update `docs/testing.md` coverage section when adding major flows

## Commands

```bash
npm test
npm run test:e2e
npm run test:visual
npm run test:visual:update
npm run regression
```
