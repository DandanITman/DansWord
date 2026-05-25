import { describe, expect, it } from 'vitest';
import { exportToDocx } from './docxExport';
import { DEFAULT_PAGE_SETUP } from '@dansword/core';

const sampleWithRichContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'See note', marks: [{ type: 'footnoteRef', attrs: { id: 'fn-1', number: 1 } }] },
      ],
    },
    {
      type: 'image',
      attrs: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        width: 120,
        align: 'left',
      },
    },
    {
      type: 'docShape',
      attrs: { shapeType: 'rect', width: 100, height: 60, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2 },
    },
    { type: 'pageBreak' },
    { type: 'paragraph', content: [{ type: 'text', text: 'Page two' }] },
  ],
};

describe('docxExport', () => {
  it('TC-UNIT-002: exports rich document with footnotes, images, shapes, and page breaks', async () => {
    const blob = await exportToDocx(sampleWithRichContent, {
      title: 'Rich',
      pageSetup: { ...DEFAULT_PAGE_SETUP, columns: { count: 2, gap: 48 } },
      footnotes: [{ id: 'fn-1', text: 'Footnote body' }],
    });
    expect(blob.size).toBeGreaterThan(500);
  });
});
