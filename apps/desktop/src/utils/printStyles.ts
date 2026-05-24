import type { PageSetup } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';

const STYLE_ID = 'dansword-print-styles';

/** Inject @page rules matching document page setup for print/PDF. */
export function applyPrintPageSetup(pageSetup: PageSetup) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }

  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const pageWidthIn = (pageSetup.orientation === 'portrait' ? dims.width : dims.height) / 96;
  const pageHeightIn = (pageSetup.orientation === 'portrait' ? dims.height : dims.width) / 96;
  const m = pageSetup.margins;
  const marginTop = m.top / 96;
  const marginRight = m.right / 96;
  const marginBottom = m.bottom / 96;
  const marginLeft = m.left / 96;

  const sizeRule =
    pageSetup.size === 'a4'
      ? 'A4'
      : pageSetup.size === 'legal'
        ? 'legal'
        : 'letter';
  const orientation = pageSetup.orientation === 'landscape' ? ' landscape' : '';

  el.textContent = `
    @page {
      size: ${sizeRule}${orientation};
      margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in;
    }
    @media print {
      .editor-scroll {
        transform: none !important;
      }
      .doc-body {
        column-count: ${pageSetup.columns.count} !important;
        column-gap: ${pageSetup.columns.gap}px !important;
      }
      .doc-body h1, .doc-body h2 {
        column-span: all;
      }
      .doc-footer-pages::after {
        content: ' · Page ' counter(page) ' of ' counter(pages);
      }
    }
  `;

  document.documentElement.style.setProperty('--print-page-width-in', String(pageWidthIn));
  document.documentElement.style.setProperty('--print-page-height-in', String(pageHeightIn));
}
