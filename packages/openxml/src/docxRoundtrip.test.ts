import { describe, expect, it } from 'vitest';
import { exportToDocx, exportToRtf, exportToHtml } from './index';
import { DEFAULT_PAGE_SETUP } from '@dansword/core';

const richDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Roundtrip Title' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Bold bit', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and plain.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'List item' }] }],
        },
      ],
    },
  ],
};

describe('format export fidelity', () => {
  it('DOCX export produces a non-trivial document blob', async () => {
    const blob = await exportToDocx(richDoc, {
      title: 'Roundtrip',
      pageSetup: DEFAULT_PAGE_SETUP,
    });
    expect(blob.size).toBeGreaterThan(500);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const header = String.fromCharCode(bytes[0]!, bytes[1]!);
    expect(header).toBe('PK');
  });

  it('RTF export contains document text', () => {
    const rtf = exportToRtf(richDoc, 'Roundtrip');
    expect(rtf).toContain('Bold bit');
    expect(rtf).toContain('\\rtf');
  });

  it('HTML export contains document text and structure', () => {
    const html = exportToHtml(richDoc, 'Roundtrip', { author: 'Tester' });
    expect(html.toLowerCase()).toContain('<html');
    expect(html).toContain('Bold bit');
    expect(html).toContain('Roundtrip Title');
  });

  it('TXT-style export via RTF does not include JSON mark names', () => {
    const rtf = exportToRtf(richDoc, 'Roundtrip');
    expect(rtf).not.toContain('"type":"bold"');
  });
});
