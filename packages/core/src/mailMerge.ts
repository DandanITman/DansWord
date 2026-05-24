/** Mail merge field helpers — {{FieldName}} tokens in document text. */

export const MERGE_FIELD_PATTERN = /\{\{([A-Za-z0-9_ ]+)\}\}/g;

export type MergeRecord = Record<string, string>;

export function parseCsv(text: string): MergeRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record: MergeRecord = {};
    headers.forEach((header, i) => {
      record[header] = values[i]?.trim() ?? '';
    });
    return record;
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

type TipTapNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

export function applyMergeToDocument(content: unknown, record: MergeRecord): unknown {
  return walkNode(content as TipTapNode, record);
}

function walkNode(node: TipTapNode, record: MergeRecord): TipTapNode {
  if (node.type === 'text' && node.text) {
    const text = node.text.replace(MERGE_FIELD_PATTERN, (_, field: string) => {
      const key = field.trim();
      return record[key] ?? record[key.replace(/\s+/g, '_')] ?? `{{${key}}}`;
    });
    return { ...node, text };
  }
  if (node.content) {
    return { ...node, content: node.content.map((c) => walkNode(c, record)) };
  }
  return node;
}

export function listMergeFields(content: unknown): string[] {
  const fields = new Set<string>();
  collectFields(content as TipTapNode, fields);
  return [...fields].sort();
}

function collectFields(node: TipTapNode, fields: Set<string>) {
  if (node.type === 'text' && node.text) {
    for (const match of node.text.matchAll(MERGE_FIELD_PATTERN)) {
      fields.add(match[1].trim());
    }
  }
  node.content?.forEach((c) => collectFields(c, fields));
}

/** Apply merge fields to full envelope (content + header/footer strings). */
export function applyMergeToEnvelope(
  envelope: import('./document').DocumentEnvelope,
  record: MergeRecord,
): import('./document').DocumentEnvelope {
  return {
    ...envelope,
    content: applyMergeToDocument(envelope.content, record),
    headerFooter: {
      ...envelope.headerFooter,
      header: replaceMergeInString(envelope.headerFooter.header, record),
      footer: replaceMergeInString(envelope.headerFooter.footer, record),
    },
    metadata: {
      ...envelope.metadata,
      title: replaceMergeInString(envelope.metadata.title, record),
    },
  };
}

function replaceMergeInString(text: string, record: MergeRecord) {
  return text.replace(MERGE_FIELD_PATTERN, (_, field: string) => {
    const key = field.trim();
    return record[key] ?? record[key.replace(/\s+/g, '_')] ?? `{{${key}}}`;
  });
}
