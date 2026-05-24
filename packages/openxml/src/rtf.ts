type TipTapNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

function escapeRtf(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}').replace(/\n/g, '\\par ');
}

function nodeToRtf(node: TipTapNode): string {
  if (node.type === 'text' && node.text) {
    let prefix = '';
    let suffix = '';
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') {
        prefix += '\\b ';
        suffix = '\\b0 ' + suffix;
      }
      if (mark.type === 'italic') {
        prefix += '\\i ';
        suffix = '\\i0 ' + suffix;
      }
      if (mark.type === 'underline') {
        prefix += '\\ul ';
        suffix = '\\ul0 ' + suffix;
      }
      if (mark.type === 'strike') {
        prefix += '\\strike ';
        suffix = '\\strike0 ' + suffix;
      }
      if (mark.type === 'superscript') {
        prefix += '\\super ';
        suffix = '\\nosupersub ' + suffix;
      }
      if (mark.type === 'subscript') {
        prefix += '\\sub ';
        suffix = '\\nosupersub ' + suffix;
      }
    }
    return `${prefix}${escapeRtf(node.text)}${suffix}`;
  }

  if (node.type === 'paragraph') {
    const inner = (node.content ?? []).map(nodeToRtf).join('');
    const indent = Number(node.attrs?.indentLevel ?? 0);
    return `${indent > 0 ? `\\li${indent * 540} ` : ''}${inner}\\par `;
  }

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level ?? 1);
    const inner = (node.content ?? []).map(nodeToRtf).join('');
    return `{\\fs${28 - level * 2}\\b ${inner}}\\par `;
  }

  if (node.type === 'pageBreak') {
    return '\\page ';
  }

  if (node.type === 'bulletList') {
    return (node.content ?? [])
      .map((item) => {
        const inner = (item.content ?? []).map(nodeToRtf).join('');
        return `\\bullet ${inner}\\par `;
      })
      .join('');
  }

  if (node.type === 'orderedList') {
    return (node.content ?? [])
      .map((item, i) => {
        const inner = (item.content ?? []).map(nodeToRtf).join('');
        return `${i + 1}. ${inner}\\par `;
      })
      .join('');
  }

  if (node.content) {
    return node.content.map(nodeToRtf).join('');
  }

  return '';
}

export function exportToRtf(content: unknown, title = 'Document'): string {
  const doc = content as TipTapNode;
  const body = (doc.content ?? []).map(nodeToRtf).join('');
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\f0\\fs22{\\info{\\title ${escapeRtf(title)}}}${body}}`;
}

function stripRtfToText(rtf: string): string {
  let text = rtf;
  text = text.replace(/\\par[d]?/gi, '\n');
  text = text.replace(/\\page/gi, '\n\n---PAGE BREAK---\n\n');
  text = text.replace(/\\'[0-9a-f]{2}/gi, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));
  text = text.replace(/\\[a-z]+\d* ?/gi, '');
  text = text.replace(/[{}]/g, '');
  return text.replace(/\r/g, '');
}

export function importFromRtf(rtf: string): TipTapNode {
  const text = stripRtfToText(rtf);
  const parts = text.split(/\n\n---PAGE BREAK---\n\n/);
  const content: TipTapNode[] = [];

  for (const part of parts) {
    const lines = part.split('\n');
    for (const line of lines) {
      content.push({
        type: 'paragraph',
        content: line ? [{ type: 'text', text: line }] : [],
      });
    }
    if (parts.length > 1 && part !== parts[parts.length - 1]) {
      content.push({ type: 'pageBreak' });
    }
  }

  if (!content.length) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}
