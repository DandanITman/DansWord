import { describe, expect, it } from 'vitest';
import { parseCsv, applyMergeToDocument, listMergeFields } from './mailMerge';

describe('mail merge', () => {
  it('parses CSV with headers', () => {
    const rows = parseCsv('Name,City\nJane,NYC\nJohn,LA');
    expect(rows).toHaveLength(2);
    expect(rows[0].Name).toBe('Jane');
    expect(rows[1].City).toBe('LA');
  });

  it('replaces merge fields in document', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello {{Name}}' }],
        },
      ],
    };
    const merged = applyMergeToDocument(doc, { Name: 'Jane' }) as typeof doc;
    expect(merged.content[0].content?.[0].text).toBe('Hello Jane');
  });

  it('lists merge fields', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{FirstName}} {{LastName}}' }],
        },
      ],
    };
    expect(listMergeFields(doc)).toEqual(['FirstName', 'LastName']);
  });
});
