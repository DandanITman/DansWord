import {
  createDocumentEnvelope,
  parseDansWordFile,
  serializeDansWordFile,
  type DocumentEnvelope,
  type DocumentMetadata,
} from '@dansword/core';
import mammoth from 'mammoth';
import { exportToDocx, type DocxExportOptions } from './docxExport';

type TipTapNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

function htmlToTipTap(html: string): TipTapNode {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const content: TipTapNode[] = [];

  function walk(node: Node, marks: TipTapNode['marks'] = []): TipTapNode[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (!text) return [];
      return [{ type: 'text', text, marks: marks.length ? [...marks] : undefined }];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    let nextMarks = [...marks];

    if (el.tagName === 'STRONG' || el.tagName === 'B') nextMarks.push({ type: 'bold' });
    if (el.tagName === 'EM' || el.tagName === 'I') nextMarks.push({ type: 'italic' });
    if (el.tagName === 'U') nextMarks.push({ type: 'underline' });
    if (el.tagName === 'SUP') nextMarks.push({ type: 'superscript' });
    if (el.tagName === 'SUB') nextMarks.push({ type: 'subscript' });
    if (el.tagName === 'MARK') {
      nextMarks.push({ type: 'highlight', attrs: { color: el.style.backgroundColor || '#fef08a' } });
    }
    if (el.tagName === 'SPAN') {
      const attrs: Record<string, unknown> = {};
      if (el.style.color) attrs.color = el.style.color;
      if (el.style.fontFamily) attrs.fontFamily = el.style.fontFamily;
      if (el.style.fontSize) attrs.fontSize = el.style.fontSize;
      if (Object.keys(attrs).length) nextMarks.push({ type: 'textStyle', attrs });
    }

    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src');
      if (src) {
        return [{ type: 'image', attrs: { src, alt: el.getAttribute('alt') ?? '' } }];
      }
    }

    if (['P', 'H1', 'H2', 'H3', 'H4', 'LI'].includes(el.tagName)) {
      const children = Array.from(el.childNodes).flatMap((c) => walk(c, nextMarks));
      const attrs = blockAttrs(el);
      if (el.tagName.startsWith('H')) {
        return [
          {
            type: 'heading',
            attrs: { ...attrs, level: parseInt(el.tagName[1], 10) },
            content: children.length ? children : [{ type: 'text', text: '' }],
          },
        ];
      }
      return [
        {
          type: 'paragraph',
          attrs,
          content: children.length ? children : [{ type: 'text', text: '' }],
        },
      ];
    }

    if (el.tagName === 'UL' || el.tagName === 'OL') {
      return [
        {
          type: el.tagName === 'UL' ? 'bulletList' : 'orderedList',
          content: Array.from(el.children)
            .filter((c) => c.tagName === 'LI')
            .map((li) => ({
              type: 'listItem',
              content: walk(li, []),
            })),
        },
      ];
    }

    return Array.from(el.childNodes).flatMap((c) => walk(c, nextMarks));
  }

  function blockAttrs(el: HTMLElement) {
    const attrs: Record<string, unknown> = {};
    if (el.style.textAlign) attrs.textAlign = el.style.textAlign;
    if (el.style.marginLeft) {
      const margin = parseFloat(el.style.marginLeft);
      if (Number.isFinite(margin)) attrs.indentLevel = Math.round(margin / 36);
    }
    if (el.style.lineHeight) attrs.lineHeight = el.style.lineHeight;
    if (el.style.marginTop) attrs.spaceBefore = parseFloat(el.style.marginTop);
    if (el.style.marginBottom) attrs.spaceAfter = parseFloat(el.style.marginBottom);
    if (el.style.borderLeftColor) attrs.borderColor = el.style.borderLeftColor;
    if (el.style.backgroundColor) attrs.shading = el.style.backgroundColor;
    return attrs;
  }

  for (const child of Array.from(dom.body.childNodes)) {
    content.push(...walk(child));
  }

  if (!content.length) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}

export async function importFromDocx(arrayBuffer: ArrayBuffer): Promise<TipTapNode> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return htmlToTipTap(result.value);
}

export function wrapDansWordFile(
  content: unknown,
  metadata?: Partial<DocumentMetadata>,
  extras?: Partial<Omit<DocumentEnvelope, 'content' | 'metadata'>>,
) {
  const now = new Date().toISOString();
  return serializeDansWordFile(
    createDocumentEnvelope(content, {
      metadata: metadata
        ? {
            title: metadata.title ?? 'Untitled',
            author: metadata.author ?? '',
            subject: metadata.subject,
            keywords: metadata.keywords,
            company: metadata.company,
            created: metadata.created ?? now,
            modified: now,
          }
        : undefined,
      ...extras,
    }),
  );
}

export function unwrapDansWordFile(file: unknown): DocumentEnvelope {
  return parseDansWordFile(file);
}

export { exportToDocx, type DocxExportOptions };
export { exportToRtf, importFromRtf } from './rtf';
export { exportToHtml } from './html';
export { importFromDocText } from './importDoc';
