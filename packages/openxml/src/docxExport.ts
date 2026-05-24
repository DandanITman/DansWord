import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  FootnoteReferenceRun,
  PageBreak,
  PageOrientation,
  BorderStyle,
  ShadingType,
  HighlightColor,
  Header,
  Footer,
  PageNumber,
  type ISectionPropertiesOptions,
} from 'docx';
import type { DocumentFootnote, HeaderFooter, PageSetup } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';

type TipTapNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

export interface DocxExportOptions {
  title?: string;
  pageSetup?: PageSetup;
  headerFooter?: HeaderFooter;
  footnotes?: DocumentFootnote[];
}

function pxToDxa(px: number) {
  return Math.round(px * 15);
}

function decodeBase64Image(src: string): { data: Uint8Array; type: 'png' | 'jpg' | 'gif' } | null {
  const match = src.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/i);
  if (!match) return null;
  const binary = atob(match[2]);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  const type = match[1].toLowerCase();
  if (type === 'jpeg' || type === 'jpg') return { data, type: 'jpg' };
  if (type === 'gif') return { data, type: 'gif' };
  return { data, type: 'png' };
}

function shapeSvgData(attrs: Record<string, unknown>): Uint8Array {
  const shapeType = String(attrs.shapeType ?? 'rect');
  const width = Number(attrs.width ?? 160);
  const height = Number(attrs.height ?? 100);
  const fill = String(attrs.fill ?? '#3b82f6');
  const stroke = String(attrs.stroke ?? '#1e40af');
  const sw = Number(attrs.strokeWidth ?? 2);
  let body = '';
  switch (shapeType) {
    case 'circle':
      body = `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - sw}" ry="${height / 2 - sw}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case 'line':
      body = `<line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="${stroke}" stroke-width="${sw + 1}"/>`;
      break;
    case 'arrow':
      body = `<line x1="8" y1="${height / 2}" x2="${width - 16}" y2="${height / 2}" stroke="${stroke}" stroke-width="${sw + 1}"/><polygon points="${width - 16},${height / 2 - 10} ${width},${height / 2} ${width - 16},${height / 2 + 10}" fill="${stroke}"/>`;
      break;
    default:
      body = `<rect x="${sw / 2}" y="${sw / 2}" width="${width - sw}" height="${height - sw}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="4"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
  return new TextEncoder().encode(svg);
}

function buildFootnoteIndex(footnotes: DocumentFootnote[]) {
  const idToNumber = new Map<string, number>();
  const docxFootnotes: Record<string, { children: Paragraph[] }> = {};
  footnotes.forEach((fn, i) => {
    const num = i + 1;
    idToNumber.set(fn.id, num);
    docxFootnotes[String(num)] = {
      children: [new Paragraph({ children: [new TextRun(fn.text)] })],
    };
  });
  return { idToNumber, docxFootnotes };
}

function headingLevel(level: number) {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    default:
      return HeadingLevel.HEADING_4;
  }
}

function textRunsFromNode(
  node: TipTapNode,
  idToNumber: Map<string, number>,
): Array<TextRun | FootnoteReferenceRun> {
  if (!node.text) return [];

  for (const mark of node.marks ?? []) {
    if (mark.type === 'footnoteRef') {
      const id = String(mark.attrs?.id ?? '');
      const num = idToNumber.get(id) ?? Number(mark.attrs?.number ?? 1);
      return [new FootnoteReferenceRun(num)];
    }
  }

  const options: Record<string, unknown> = { text: node.text };
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        options.bold = true;
        break;
      case 'italic':
        options.italics = true;
        break;
      case 'underline':
        options.underline = { type: UnderlineType.SINGLE };
        break;
      case 'strike':
        options.strike = true;
        break;
      case 'textStyle':
        if (mark.attrs?.color) options.color = String(mark.attrs.color).replace('#', '');
        if (mark.attrs?.fontFamily) options.font = String(mark.attrs.fontFamily);
        if (mark.attrs?.fontSize) {
          const size = parseInt(String(mark.attrs.fontSize), 10);
          if (!Number.isNaN(size)) options.size = size * 2;
        }
        break;
      case 'highlight':
        options.highlight = HighlightColor.YELLOW;
        break;
      case 'superscript':
        options.superScript = true;
        break;
      case 'subscript':
        options.subScript = true;
        break;
    }
  }

  return [new TextRun(options as ConstructorParameters<typeof TextRun>[0])];
}

function paragraphFromNode(node: TipTapNode, idToNumber: Map<string, number>): Paragraph {
  const runs: Array<TextRun | FootnoteReferenceRun> = [];
  for (const child of node.content ?? []) {
    if (child.type === 'text') runs.push(...textRunsFromNode(child, idToNumber));
    else if (child.type === 'hardBreak') runs.push(new TextRun({ break: 1 }));
  }

  const alignment = node.attrs?.textAlign as string | undefined;
  let align: (typeof AlignmentType)[keyof typeof AlignmentType] | undefined;
  if (alignment === 'center') align = AlignmentType.CENTER;
  if (alignment === 'right') align = AlignmentType.RIGHT;
  if (alignment === 'justify') align = AlignmentType.JUSTIFIED;

  const attrs = node.attrs ?? {};
  const paragraphOptions: Record<string, unknown> = {
    children: runs.length ? runs : [new TextRun('')],
    alignment: align,
  };

  const indentLevel = Number(attrs.indentLevel ?? 0);
  if (indentLevel > 0) {
    paragraphOptions.indent = { left: pxToDxa(indentLevel * 36) };
  }
  if (attrs.lineHeight || attrs.spaceBefore || attrs.spaceAfter) {
    paragraphOptions.spacing = {
      ...(attrs.spaceBefore ? { before: pxToDxa(Number(attrs.spaceBefore)) } : {}),
      ...(attrs.spaceAfter ? { after: pxToDxa(Number(attrs.spaceAfter)) } : {}),
      ...(attrs.lineHeight ? { line: Math.round(Number(attrs.lineHeight) * 240) } : {}),
    };
  }
  if (attrs.borderColor) {
    paragraphOptions.border = {
      left: {
        style: BorderStyle.SINGLE,
        color: String(attrs.borderColor).replace('#', ''),
        size: 8,
      },
    };
  }
  if (attrs.shading) {
    paragraphOptions.shading = {
      type: ShadingType.CLEAR,
      fill: String(attrs.shading).replace('#', ''),
    };
  }

  return new Paragraph(paragraphOptions as ConstructorParameters<typeof Paragraph>[0]);
}

function paragraphFormattingOptions(attrs: Record<string, unknown> = {}) {
  const options: Record<string, unknown> = {};
  const indentLevel = Number(attrs.indentLevel ?? 0);
  if (indentLevel > 0) {
    options.indent = { left: pxToDxa(indentLevel * 36) };
  }
  if (attrs.lineHeight || attrs.spaceBefore || attrs.spaceAfter) {
    options.spacing = {
      ...(attrs.spaceBefore ? { before: pxToDxa(Number(attrs.spaceBefore)) } : {}),
      ...(attrs.spaceAfter ? { after: pxToDxa(Number(attrs.spaceAfter)) } : {}),
      ...(attrs.lineHeight ? { line: Math.round(Number(attrs.lineHeight) * 240) } : {}),
    };
  }
  if (attrs.borderColor) {
    options.border = {
      left: {
        style: BorderStyle.SINGLE,
        color: String(attrs.borderColor).replace('#', ''),
        size: 8,
      },
    };
  }
  if (attrs.shading) {
    options.shading = {
      type: ShadingType.CLEAR,
      fill: String(attrs.shading).replace('#', ''),
    };
  }
  return options;
}

function imageParagraph(node: TipTapNode): Paragraph | null {
  const src = String(node.attrs?.src ?? '');
  const decoded = decodeBase64Image(src);
  const width = Number(node.attrs?.width ?? 320);
  if (!decoded) return null;

  return new Paragraph({
    alignment:
      node.attrs?.align === 'center'
        ? AlignmentType.CENTER
        : node.attrs?.align === 'right'
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT,
    children: [
      new ImageRun({
        type: decoded.type,
        data: decoded.data,
        transformation: { width, height: Math.round(width * 0.75) },
      }),
    ],
  });
}

function shapeParagraph(node: TipTapNode): Paragraph {
  const width = Number(node.attrs?.width ?? 160);
  const height = Number(node.attrs?.height ?? 100);
  const svg = shapeSvgData(node.attrs ?? {});
  const fallbackPng = decodeBase64Image(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  )!;
  return new Paragraph({
    children: [
      new ImageRun({
        type: 'svg',
        data: svg,
        fallback: { type: fallbackPng.type, data: fallbackPng.data },
        transformation: { width, height },
      }),
    ],
  });
}

function blocksFromDocFull(
  doc: TipTapNode,
  idToNumber: Map<string, number>,
): Array<Paragraph | Table> {
  const blocks: Array<Paragraph | Table> = [];

  for (const node of doc.content ?? []) {
    if (node.type === 'paragraph') {
      blocks.push(paragraphFromNode(node, idToNumber));
    } else if (node.type === 'heading') {
      blocks.push(
        new Paragraph({
          ...paragraphFormattingOptions(node.attrs),
          heading: headingLevel(Number(node.attrs?.level ?? 1)),
          children: (node.content ?? []).flatMap((c) =>
            c.type === 'text' ? textRunsFromNode(c, idToNumber) : [],
          ),
        }),
      );
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const item of node.content ?? []) {
        for (const inner of item.content ?? []) {
          if (inner.type === 'paragraph') {
            blocks.push(
              new Paragraph({
                text: (inner.content ?? [])
                  .map((c) => (c.type === 'text' ? c.text : ''))
                  .join(''),
                bullet: { level: 0 },
              }),
            );
          }
        }
      }
    } else if (node.type === 'table') {
      const rows: TableRow[] = [];
      for (const rowNode of node.content ?? []) {
        const cells: TableCell[] = [];
        for (const cellNode of rowNode.content ?? []) {
          const cellParagraphs = (cellNode.content ?? [])
            .filter((n) => n.type === 'paragraph')
            .map((n) => paragraphFromNode(n, idToNumber));
          cells.push(
            new TableCell({
              children: cellParagraphs.length ? cellParagraphs : [new Paragraph('')],
            }),
          );
        }
        rows.push(new TableRow({ children: cells }));
      }
      blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
    } else if (node.type === 'image') {
      const img = imageParagraph(node);
      if (img) blocks.push(img);
    } else if (node.type === 'docShape') {
      blocks.push(shapeParagraph(node));
    } else if (node.type === 'pageBreak') {
      blocks.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (node.type === 'horizontalRule') {
      blocks.push(new Paragraph({ thematicBreak: true }));
    }
  }

  return blocks.length ? blocks : [new Paragraph('')];
}

function sectionProperties(pageSetup: PageSetup): ISectionPropertiesOptions {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const width = pageSetup.orientation === 'portrait' ? dims.width : dims.height;
  const height = pageSetup.orientation === 'portrait' ? dims.height : dims.width;
  const { margins, columns } = pageSetup;

  return {
    page: {
      size: {
        width: pxToDxa(width),
        height: pxToDxa(height),
        orientation:
          pageSetup.orientation === 'landscape'
            ? PageOrientation.LANDSCAPE
            : PageOrientation.PORTRAIT,
      },
      margin: {
        top: pxToDxa(margins.top),
        bottom: pxToDxa(margins.bottom),
        left: pxToDxa(margins.left),
        right: pxToDxa(margins.right),
      },
    },
    ...(columns.count > 1
      ? { column: { count: columns.count, space: pxToDxa(columns.gap), equalWidth: true } }
      : {}),
  };
}

export async function exportToDocx(
  content: unknown,
  options: DocxExportOptions | string = {},
): Promise<Blob> {
  const opts: DocxExportOptions =
    typeof options === 'string' ? { title: options } : options;
  const docNode = content as TipTapNode;
  const { idToNumber, docxFootnotes } = buildFootnoteIndex(opts.footnotes ?? []);

  const section: {
    properties?: ISectionPropertiesOptions;
    headers?: { default?: Header };
    footers?: { default?: Footer };
    children: Array<Paragraph | Table>;
  } = {
    children: blocksFromDocFull(docNode, idToNumber),
  };

  if (opts.pageSetup) section.properties = sectionProperties(opts.pageSetup);
  if (opts.headerFooter?.header) {
    section.headers = {
      default: new Header({
        children: [
          new Paragraph({
            children: [new TextRun(opts.headerFooter.header)],
          }),
        ],
      }),
    };
  }
  if (opts.headerFooter?.footer || opts.headerFooter?.showPageNumbers) {
    const children: TextRun[] = [];
    if (opts.headerFooter.footer) children.push(new TextRun(opts.headerFooter.footer));
    if (opts.headerFooter.showPageNumbers) {
      children.push(
        new TextRun({
          children: [
            opts.headerFooter.footer ? '  ' : '',
            'Page ',
            PageNumber.CURRENT,
            ' of ',
            PageNumber.TOTAL_PAGES,
          ],
        }),
      );
    }
    section.footers = {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children,
          }),
        ],
      }),
    };
  }

  const doc = new Document({
    title: opts.title ?? 'Document',
    footnotes: Object.keys(docxFootnotes).length ? docxFootnotes : undefined,
    sections: [section],
  });

  return Packer.toBlob(doc);
}
