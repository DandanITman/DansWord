/**
 * Mail merge: recipient data and field substitution.
 *
 * Word reads recipients from Outlook, Access or a delimited file. Only the last
 * is portable, so DansWord reads CSV and tab-separated files — the format
 * Word's own "Use an Existing List" accepts for spreadsheets exported to text.
 */

export interface MailMergeData {
  /** Column names, in file order. */
  fields: string[];
  /** One record per recipient, keyed by field name. */
  records: Array<Record<string, string>>;
  /** Recipients the user unticked in Edit Recipient List. */
  excluded: number[];
  /** Where the list came from, shown in the ribbon. */
  sourceName: string;
}

export const EMPTY_MAIL_MERGE: MailMergeData = {
  fields: [],
  records: [],
  excluded: [],
  sourceName: '',
};

/** Word's Start Mail Merge document types. */
export type MergeDocumentType = 'letters' | 'envelopes' | 'labels' | 'directory' | 'email';

export const MERGE_DOCUMENT_LABELS: Record<MergeDocumentType, string> = {
  letters: 'Letters',
  envelopes: 'Envelopes',
  labels: 'Labels',
  directory: 'Directory',
  email: 'Email Messages',
};

/**
 * Split one delimited line, honouring quoted fields.
 *
 * A naive `split(',')` breaks the moment an address contains a comma, which is
 * most of the time in a mail merge list.
 */
export function splitDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  if (tabs >= commas && tabs >= semicolons && tabs > 0) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

/** Parse a CSV/TSV recipient list; the first row is the field names. */
export function parseRecipientList(raw: string, sourceName = ''): MailMergeData {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return { ...EMPTY_MAIL_MERGE, sourceName };

  const delimiter = detectDelimiter(lines[0]);
  const fields = splitDelimitedLine(lines[0], delimiter).map((field, index) => field || `Field${index + 1}`);
  const records = lines.slice(1).map((line) => {
    const values = splitDelimitedLine(line, delimiter);
    const record: Record<string, string> = {};
    fields.forEach((field, index) => {
      record[field] = values[index] ?? '';
    });
    return record;
  });

  return { fields, records, excluded: [], sourceName };
}

/** Recipients that are still ticked, in file order. */
export function includedRecords(data: MailMergeData): Array<Record<string, string>> {
  const excluded = new Set(data.excluded);
  return data.records.filter((_, index) => !excluded.has(index));
}

/** «Field» placeholders, the way Word writes merge fields. */
export function mergeFieldPlaceholder(field: string): string {
  return `«${field}»`;
}

const PLACEHOLDER_PATTERN = /«([^»]+)»/g;

/** Substitute a record's values into text containing «Field» placeholders. */
export function applyMergeToText(text: string, record: Record<string, string>): string {
  return text.replace(PLACEHOLDER_PATTERN, (_match, field: string) => record[field] ?? '');
}

/** The merge fields a piece of text refers to, deduplicated in first-use order. */
export function mergeFieldsUsed(text: string): string[] {
  const used: string[] = [];
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    if (!used.includes(match[1])) used.push(match[1]);
  }
  return used;
}

/**
 * Substitute merge fields throughout a ProseMirror document.
 *
 * The document is walked as plain JSON so this stays usable outside the editor
 * (Finish & Merge writes one document per recipient without opening any of
 * them in the editor first).
 */
export function applyMergeToDocument(content: unknown, record: Record<string, string>): unknown {
  if (Array.isArray(content)) return content.map((child) => applyMergeToDocument(child, record));
  if (!content || typeof content !== 'object') return content;

  const node = content as Record<string, unknown>;
  const next: Record<string, unknown> = { ...node };
  if (typeof node.text === 'string') next.text = applyMergeToText(node.text, record);
  if (node.content) next.content = applyMergeToDocument(node.content, record);
  return next;
}

/** Address Block, built from whichever of the standard fields the list has. */
export function addressBlock(record: Record<string, string>): string {
  const pick = (...names: string[]) => {
    for (const name of names) {
      const match = Object.keys(record).find((key) => key.toLowerCase() === name.toLowerCase());
      if (match && record[match]) return record[match];
    }
    return '';
  };

  const name = [pick('Title', 'Courtesy Title'), pick('First Name', 'FirstName', 'First'), pick('Last Name', 'LastName', 'Last', 'Surname')]
    .filter(Boolean)
    .join(' ');
  const lines = [
    name || pick('Name', 'Full Name'),
    pick('Company', 'Organisation', 'Organization'),
    pick('Address', 'Address Line 1', 'Address1', 'Street'),
    pick('Address Line 2', 'Address2'),
    [pick('City', 'Town'), pick('State', 'County', 'Region'), pick('ZIP', 'Zip', 'Postcode', 'Postal Code')]
      .filter(Boolean)
      .join(' '),
    pick('Country'),
  ];
  return lines.filter((line) => line.trim().length > 0).join('\n');
}

/** Greeting Line, e.g. "Dear Ms. Randall,". */
export function greetingLine(record: Record<string, string>, salutation = 'Dear'): string {
  const key = Object.keys(record).find((field) => /last\s*name|surname/i.test(field));
  const titleKey = Object.keys(record).find((field) => /^title$|courtesy/i.test(field));
  const firstKey = Object.keys(record).find((field) => /first\s*name/i.test(field));
  const name = [titleKey ? record[titleKey] : '', key ? record[key] : firstKey ? record[firstKey] : '']
    .filter(Boolean)
    .join(' ');
  return `${salutation} ${name || 'Sir or Madam'},`;
}
