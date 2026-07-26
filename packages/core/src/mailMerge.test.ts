import { describe, expect, it } from 'vitest';
import {
  addressBlock,
  applyMergeToDocument,
  applyMergeToText,
  greetingLine,
  includedRecords,
  mergeFieldsUsed,
  parseRecipientList,
  splitDelimitedLine,
} from './mailMerge';

describe('recipient lists', () => {
  it('keeps a quoted comma inside one field', () => {
    expect(splitDelimitedLine('Ada,"Mayfair, London",UK', ',')).toEqual([
      'Ada',
      'Mayfair, London',
      'UK',
    ]);
  });

  it('unescapes a doubled quote', () => {
    expect(splitDelimitedLine('a,"say ""hi""",b', ',')).toEqual(['a', 'say "hi"', 'b']);
  });

  it('reads a CSV list with the header row as field names', () => {
    const data = parseRecipientList('First Name,Last Name\nAda,Lovelace\nAlan,Turing\n', 'list.csv');
    expect(data.fields).toEqual(['First Name', 'Last Name']);
    expect(data.records).toHaveLength(2);
    expect(data.records[1]['Last Name']).toBe('Turing');
    expect(data.sourceName).toBe('list.csv');
  });

  it('detects a tab-separated list', () => {
    const data = parseRecipientList('Name\tCity\nAda\tLondon');
    expect(data.fields).toEqual(['Name', 'City']);
    expect(data.records[0].City).toBe('London');
  });

  it('returns an empty list for an empty file rather than throwing', () => {
    expect(parseRecipientList('   ').records).toEqual([]);
  });

  it('excludes the recipients the user unticked', () => {
    const data = parseRecipientList('Name\nAda\nAlan\nGrace');
    expect(includedRecords({ ...data, excluded: [1] }).map((r) => r.Name)).toEqual(['Ada', 'Grace']);
  });
});

describe('merge fields', () => {
  it('substitutes placeholders and blanks unknown fields', () => {
    expect(applyMergeToText('Dear «Last Name», of «City».', { 'Last Name': 'Lovelace' })).toBe(
      'Dear Lovelace, of .',
    );
  });

  it('lists the fields a document uses, in first-use order', () => {
    expect(mergeFieldsUsed('«B» then «A» then «B»')).toEqual(['B', 'A']);
  });

  it('substitutes throughout a document tree', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello «Name»' }] },
        {
          type: 'table',
          content: [{ type: 'tableRow', content: [{ type: 'text', text: '«City»' }] }],
        },
      ],
    };
    const merged = applyMergeToDocument(doc, { Name: 'Ada', City: 'London' }) as typeof doc;
    expect(JSON.stringify(merged)).toContain('Hello Ada');
    expect(JSON.stringify(merged)).toContain('London');
    // The original is untouched, so Preview Results can be switched off again.
    expect(JSON.stringify(doc)).toContain('«Name»');
  });
});

describe('address block and greeting line', () => {
  const record = {
    Title: 'Ms',
    'First Name': 'Ada',
    'Last Name': 'Lovelace',
    Company: 'Analytical Engines',
    Address: '12 Mayfair',
    City: 'London',
    ZIP: 'W1',
    Country: 'UK',
  };

  it('builds an address block from the standard fields', () => {
    expect(addressBlock(record).split('\n')).toEqual([
      'Ms Ada Lovelace',
      'Analytical Engines',
      '12 Mayfair',
      'London W1',
      'UK',
    ]);
  });

  it('builds a greeting line from the title and surname', () => {
    expect(greetingLine(record)).toBe('Dear Ms Lovelace,');
  });

  it('falls back politely when the list has no name fields', () => {
    expect(greetingLine({ Email: 'a@b.c' })).toBe('Dear Sir or Madam,');
  });
});
