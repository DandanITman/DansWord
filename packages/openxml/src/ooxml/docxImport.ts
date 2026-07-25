import {
  DEFAULT_HEADER_FOOTER,
  DEFAULT_PAGE_SETUP,
  PAGE_DIMENSIONS,
  type DocumentFootnote,
  type HeaderFooter,
  type PageSetup,
  type PageSizePreset,
} from '@dansword/core';
import { DocxPackage } from './package';
import {
  attr,
  boolProp,
  child,
  children,
  emuToPx,
  fieldInstructions,
  path,
  textOf,
  twipsToPx,
  val,
  type XmlNode,
} from './xml';

export type TipTapNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

export interface DocxImportResult {
  content: TipTapNode;
  pageSetup: PageSetup;
  headerFooter: HeaderFooter;
  footnotes: DocumentFootnote[];
}

type Mark = { type: string; attrs?: Record<string, unknown> };

/** numId -> { level -> 'bullet' | 'ordered' } from word/numbering.xml. */
type NumberingMap = Map<string, Map<number, 'bullet' | 'ordered'>>;

const HEADING_STYLE = /^heading\s*([1-9])$/i;

function buildNumbering(numbering: XmlNode | undefined): NumberingMap {
  const map: NumberingMap = new Map();
  if (!numbering) return map;

  // abstractNumId -> level -> format
  const abstract = new Map<string, Map<number, 'bullet' | 'ordered'>>();
  for (const node of children(numbering, 'w:abstractNum')) {
    const id = attr(node, 'w:abstractNumId');
    if (!id) continue;
    const levels = new Map<number, 'bullet' | 'ordered'>();
    for (const lvl of children(node, 'w:lvl')) {
      const ilvl = Number(attr(lvl, 'w:ilvl') ?? 0);
      const fmt = val(lvl, 'w:numFmt') ?? 'bullet';
      levels.set(ilvl, fmt === 'bullet' || fmt === 'none' ? 'bullet' : 'ordered');
    }
    abstract.set(id, levels);
  }

  for (const node of children(numbering, 'w:num')) {
    const numId = attr(node, 'w:numId');
    const abstractId = val(node, 'w:abstractNumId');
    if (!numId) continue;
    map.set(numId, (abstractId && abstract.get(abstractId)) || new Map());
  }
  return map;
}

function runMarks(rPr: XmlNode | undefined): Mark[] {
  if (!rPr) return [];
  const marks: Mark[] = [];

  if (boolProp(rPr, 'w:b')) marks.push({ type: 'bold' });
  if (boolProp(rPr, 'w:i')) marks.push({ type: 'italic' });
  if (boolProp(rPr, 'w:strike')) marks.push({ type: 'strike' });

  const underline = val(rPr, 'w:u');
  if (underline && underline !== 'none') marks.push({ type: 'underline' });

  const vertAlign = val(rPr, 'w:vertAlign');
  if (vertAlign === 'superscript') marks.push({ type: 'superscript' });
  if (vertAlign === 'subscript') marks.push({ type: 'subscript' });

  const highlight = val(rPr, 'w:highlight');
  if (highlight && highlight !== 'none') {
    marks.push({ type: 'highlight', attrs: { color: highlight } });
  } else {
    const shdFill = attr(child(rPr, 'w:shd'), 'w:fill');
    if (shdFill && shdFill !== 'auto' && shdFill !== 'FFFFFF') {
      marks.push({ type: 'highlight', attrs: { color: `#${shdFill}` } });
    }
  }

  // textStyle carries colour, family and size — all previously lost on import.
  const textStyle: Record<string, unknown> = {};
  const color = val(rPr, 'w:color');
  if (color && color !== 'auto') textStyle.color = `#${color}`;

  const fonts = child(rPr, 'w:rFonts');
  const family = attr(fonts, 'w:ascii') ?? attr(fonts, 'w:hAnsi') ?? attr(fonts, 'w:cs');
  if (family) textStyle.fontFamily = family;

  const halfPoints = val(rPr, 'w:sz');
  if (halfPoints) {
    const pt = Number(halfPoints) / 2;
    if (Number.isFinite(pt) && pt > 0) textStyle.fontSize = `${pt}pt`;
  }
  if (Object.keys(textStyle).length) marks.push({ type: 'textStyle', attrs: textStyle });

  return marks;
}

function paragraphAttrs(pPr: XmlNode | undefined): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  if (!pPr) return attrs;

  const jc = val(pPr, 'w:jc');
  if (jc === 'center' || jc === 'right') attrs.textAlign = jc;
  else if (jc === 'both' || jc === 'distribute') attrs.textAlign = 'justify';
  else if (jc === 'left' || jc === 'start') attrs.textAlign = 'left';

  const ind = child(pPr, 'w:ind');
  const left = attr(ind, 'w:left') ?? attr(ind, 'w:start');
  if (left) {
    // The editor models indent in 36px steps (0.375in), matching its own export.
    const px = twipsToPx(left);
    if (px > 0) attrs.indentLevel = Math.max(1, Math.round(px / 36));
  }

  const spacing = child(pPr, 'w:spacing');
  if (spacing) {
    const before = attr(spacing, 'w:before');
    const after = attr(spacing, 'w:after');
    const line = attr(spacing, 'w:line');
    if (before) attrs.spaceBefore = twipsToPx(before);
    if (after) attrs.spaceAfter = twipsToPx(after);
    // w:line is in 240ths of a line when lineRule is auto.
    if (line && (attr(spacing, 'w:lineRule') ?? 'auto') === 'auto') {
      const ratio = Number(line) / 240;
      if (Number.isFinite(ratio) && ratio > 0) attrs.lineHeight = String(Number(ratio.toFixed(2)));
    }
  }

  const borderColor = attr(path(pPr, 'w:pBdr', 'w:left'), 'w:color');
  if (borderColor && borderColor !== 'auto') attrs.borderColor = `#${borderColor}`;

  const shading = attr(child(pPr, 'w:shd'), 'w:fill');
  if (shading && shading !== 'auto') attrs.shading = `#${shading}`;

  return attrs;
}

function imageFromDrawing(node: XmlNode, pkg: DocxPackage): TipTapNode | null {
  // a:blip carries r:embed; wp:extent carries the display size in EMUs.
  let embed: string | undefined;
  let cx: string | undefined;
  let cy: string | undefined;
  let alt = '';

  const walk = (n: XmlNode) => {
    if (n.name === 'a:blip') embed = attr(n, 'r:embed') ?? attr(n, 'r:link');
    if (n.name === 'wp:extent') {
      cx = attr(n, 'cx');
      cy = attr(n, 'cy');
    }
    if (n.name === 'wp:docPr') alt = attr(n, 'descr') ?? attr(n, 'name') ?? alt;
    for (const c of n.children) walk(c);
  };
  walk(node);

  const src = pkg.imageData(embed);
  if (!src) return null;

  const attrs: Record<string, unknown> = { src, alt };
  const width = emuToPx(cx);
  const height = emuToPx(cy);
  // Carry the real height so aspect ratio survives, instead of assuming 4:3.
  if (width > 0) attrs.width = width;
  if (height > 0) attrs.height = height;
  return { type: 'image', attrs };
}

interface RunContext {
  pkg: DocxPackage;
  footnoteNumberById: Map<string, number>;
}

/** Convert the runs of a paragraph (or hyperlink) into inline nodes. */
function inlineFromRuns(container: XmlNode, ctx: RunContext, inherited: Mark[]): TipTapNode[] {
  const out: TipTapNode[] = [];

  for (const node of container.children) {
    if (node.name === 'w:hyperlink') {
      const href = ctx.pkg.hyperlink(attr(node, 'r:id'));
      const anchor = attr(node, 'w:anchor');
      const linkMark: Mark[] = href
        ? [{ type: 'link', attrs: { href } }]
        : anchor
          ? [{ type: 'link', attrs: { href: `#${anchor}` } }]
          : [];
      out.push(...inlineFromRuns(node, ctx, [...inherited, ...linkMark]));
      continue;
    }

    if (node.name !== 'w:r') continue;

    const rPr = child(node, 'w:rPr');
    const marks = [...inherited, ...runMarks(rPr)];

    for (const part of node.children) {
      switch (part.name) {
        case 'w:t': {
          const text = textOf({ ...part, children: part.children });
          if (text) out.push({ type: 'text', text, marks: marks.length ? marks : undefined });
          break;
        }
        case 'w:tab':
          out.push({ type: 'text', text: '\t', marks: marks.length ? marks : undefined });
          break;
        case 'w:br':
          if (attr(part, 'w:type') === 'page') out.push({ type: 'pageBreak' });
          else out.push({ type: 'hardBreak' });
          break;
        case 'w:drawing':
        case 'w:pict': {
          const image = imageFromDrawing(part, ctx.pkg);
          if (image) out.push(image);
          break;
        }
        case 'w:footnoteReference': {
          const id = attr(part, 'w:id');
          const number = id ? ctx.footnoteNumberById.get(id) : undefined;
          if (id && number !== undefined) {
            out.push({
              type: 'text',
              text: String(number),
              marks: [...marks, { type: 'footnoteRef', attrs: { id: `fn-${id}`, number } }],
            });
          }
          break;
        }
        default:
          break;
      }
    }
  }

  return out;
}

/** Node types that are blocks in the editor schema and must not sit inside a paragraph. */
const BLOCK_INLINE_TYPES = new Set(['image', 'pageBreak']);

/**
 * Split a paragraph's inline run into block-level siblings.
 *
 * `image` and `pageBreak` are block nodes in the editor schema, so leaving them
 * nested inside a paragraph produces a document ProseMirror will reject or
 * silently strip on `setContent`.
 */
function explode(paragraph: TipTapNode): TipTapNode[] {
  const inline = paragraph.content ?? [];
  if (!inline.some((n) => n.type && BLOCK_INLINE_TYPES.has(n.type))) {
    return [paragraph];
  }

  const out: TipTapNode[] = [];
  let run: TipTapNode[] = [];
  const flush = () => {
    if (run.length) {
      out.push({ ...paragraph, content: run });
      run = [];
    }
  };

  for (const node of inline) {
    if (node.type && BLOCK_INLINE_TYPES.has(node.type)) {
      flush();
      out.push(node);
    } else {
      run.push(node);
    }
  }
  flush();

  // A paragraph that held nothing but blocks contributes no empty paragraph.
  return out.length ? out : [];
}

function paragraphNode(p: XmlNode, ctx: RunContext, styleName: string | undefined): TipTapNode {
  const pPr = child(p, 'w:pPr');
  const attrs = paragraphAttrs(pPr);
  const content = inlineFromRuns(p, ctx, []);

  const headingMatch = styleName?.match(HEADING_STYLE);
  const outline = val(pPr, 'w:outlineLvl');
  const level = headingMatch
    ? Number(headingMatch[1])
    : outline !== undefined
      ? Number(outline) + 1
      : undefined;

  if (level !== undefined && level >= 1 && level <= 6) {
    return {
      type: 'heading',
      // The editor's schema only registers levels 1-3.
      attrs: { ...attrs, level: Math.min(level, 3) },
      content: content.length ? content : undefined,
    };
  }

  return { type: 'paragraph', attrs, content: content.length ? content : undefined };
}

function tableNode(tbl: XmlNode, ctx: RunContext, styleOf: (p: XmlNode) => string | undefined): TipTapNode {
  const rows: TipTapNode[] = [];

  for (const [rowIndex, tr] of children(tbl, 'w:tr').entries()) {
    const cells: TipTapNode[] = [];
    const isHeaderRow = rowIndex === 0 && !!path(tr, 'w:trPr', 'w:tblHeader');

    for (const tc of children(tr, 'w:tc')) {
      const tcPr = child(tc, 'w:tcPr');
      const span = Number(val(tcPr, 'w:gridSpan') ?? 1);
      // A continuation cell of a vertical merge carries no content of its own.
      if (attr(child(tcPr, 'w:vMerge'), 'w:val') === undefined && child(tcPr, 'w:vMerge')) continue;

      const cellAttrs: Record<string, unknown> = {};
      if (Number.isFinite(span) && span > 1) cellAttrs.colspan = span;

      const width = attr(child(tcPr, 'w:tcW'), 'w:w');
      if (width && attr(child(tcPr, 'w:tcW'), 'w:type') === 'dxa') {
        cellAttrs.colwidth = [twipsToPx(width)];
      }
      const fill = attr(child(tcPr, 'w:shd'), 'w:fill');
      if (fill && fill !== 'auto') cellAttrs.backgroundColor = `#${fill}`;

      const cellContent: TipTapNode[] = [];
      for (const node of tc.children) {
        if (node.name === 'w:p') cellContent.push(...explode(paragraphNode(node, ctx, styleOf(node))));
        else if (node.name === 'w:tbl') cellContent.push(tableNode(node, ctx, styleOf));
      }
      if (!cellContent.length) cellContent.push({ type: 'paragraph' });

      cells.push({
        type: isHeaderRow ? 'tableHeader' : 'tableCell',
        attrs: cellAttrs,
        content: cellContent,
      });
    }

    if (cells.length) rows.push({ type: 'tableRow', content: cells });
  }

  return { type: 'table', content: rows.length ? rows : [{ type: 'tableRow', content: [] }] };
}

function pageSetupFromSectPr(sectPr: XmlNode | undefined): PageSetup {
  if (!sectPr) return { ...DEFAULT_PAGE_SETUP, margins: { ...DEFAULT_PAGE_SETUP.margins } };

  const pgSz = child(sectPr, 'w:pgSz');
  const widthPx = twipsToPx(attr(pgSz, 'w:w'));
  const heightPx = twipsToPx(attr(pgSz, 'w:h'));
  const landscape = attr(pgSz, 'w:orient') === 'landscape' || (widthPx > heightPx && heightPx > 0);

  // Match the closest known preset on the portrait-oriented dimensions.
  const shortSide = landscape ? heightPx : widthPx;
  const longSide = landscape ? widthPx : heightPx;
  let size: PageSizePreset = DEFAULT_PAGE_SETUP.size;
  if (shortSide > 0 && longSide > 0) {
    let best = Number.POSITIVE_INFINITY;
    for (const [preset, dims] of Object.entries(PAGE_DIMENSIONS) as [
      PageSizePreset,
      { width: number; height: number },
    ][]) {
      const delta = Math.abs(dims.width - shortSide) + Math.abs(dims.height - longSide);
      if (delta < best) {
        best = delta;
        size = preset;
      }
    }
  }

  const pgMar = child(sectPr, 'w:pgMar');
  const margins = pgMar
    ? {
        top: twipsToPx(attr(pgMar, 'w:top')) || DEFAULT_PAGE_SETUP.margins.top,
        bottom: twipsToPx(attr(pgMar, 'w:bottom')) || DEFAULT_PAGE_SETUP.margins.bottom,
        left: twipsToPx(attr(pgMar, 'w:left')) || DEFAULT_PAGE_SETUP.margins.left,
        right: twipsToPx(attr(pgMar, 'w:right')) || DEFAULT_PAGE_SETUP.margins.right,
      }
    : { ...DEFAULT_PAGE_SETUP.margins };

  const cols = child(sectPr, 'w:cols');
  const count = Number(attr(cols, 'w:num') ?? 1);
  const space = attr(cols, 'w:space');

  return {
    size,
    orientation: landscape ? 'landscape' : 'portrait',
    margins,
    columns: {
      count: Number.isFinite(count) && count > 1 ? count : 1,
      gap: space ? twipsToPx(space) : DEFAULT_PAGE_SETUP.columns.gap,
    },
  };
}

/** Plain text of a header/footer part, plus whether it contains a PAGE field. */
function headerFooterText(part: XmlNode | undefined): { text: string; hasPageNumber: boolean } {
  if (!part) return { text: '', hasPageNumber: false };
  const body = child(part, 'w:hdr') ?? child(part, 'w:ftr') ?? part;
  const lines: string[] = [];
  let hasPageNumber = false;

  for (const p of children(body, 'w:p')) {
    // Field instructions (PAGE, NUMPAGES) are machinery, not user-visible text.
    // textOf() already excludes them; surface them as the page-number toggle.
    if (fieldInstructions(p).some((code) => /\bPAGE\b|\bNUMPAGES\b/.test(code))) {
      hasPageNumber = true;
    }
    const text = textOf(p).trim();
    if (text) lines.push(text);
  }

  return { text: lines.join('\n'), hasPageNumber };
}

function footnotesFrom(footnotesXml: XmlNode | undefined): {
  list: DocumentFootnote[];
  numberById: Map<string, number>;
} {
  const list: DocumentFootnote[] = [];
  const numberById = new Map<string, number>();
  if (!footnotesXml) return { list, numberById };

  const root = child(footnotesXml, 'w:footnotes') ?? footnotesXml;
  let number = 0;
  for (const fn of children(root, 'w:footnote')) {
    const id = attr(fn, 'w:id');
    // Ids 0 and -1 are the separator/continuation notes, not real footnotes.
    if (!id || Number(id) <= 0) continue;
    number += 1;
    numberById.set(id, number);
    list.push({ id: `fn-${id}`, text: textOf(fn).trim() });
  }
  return { list, numberById };
}

/**
 * Read a .docx into the document model.
 *
 * Replaces the previous mammoth -> HTML -> hand-rolled DOM walk, which had no
 * table, hyperlink or section handling at all: tables collapsed into loose
 * paragraphs, links lost their href, images landed in a schema-invalid
 * position, and page setup, headers, footers and footnotes were discarded.
 */
export async function importDocx(data: ArrayBuffer | Uint8Array): Promise<DocxImportResult> {
  const pkg = await DocxPackage.load(data);

  const numbering = buildNumbering(
    pkg.numbering ? (child(pkg.numbering, 'w:numbering') ?? pkg.numbering) : undefined,
  );

  // styleId -> style name, so Heading 1/2/3 can be recognised.
  const styleNames = new Map<string, string>();
  const stylesRoot = pkg.styles ? (child(pkg.styles, 'w:styles') ?? pkg.styles) : undefined;
  for (const style of children(stylesRoot, 'w:style')) {
    const id = attr(style, 'w:styleId');
    const name = val(style, 'w:name');
    if (id) styleNames.set(id, name ?? id);
  }
  const styleOf = (p: XmlNode) => {
    const id = val(child(p, 'w:pPr'), 'w:pStyle');
    if (!id) return undefined;
    return styleNames.get(id) ?? id;
  };

  const { list: footnotes, numberById } = footnotesFrom(pkg.footnotes);
  const ctx: RunContext = { pkg, footnoteNumberById: numberById };

  // pkg.document is already the <w:document> element, not a wrapper around it.
  const body = child(pkg.document, 'w:body');
  const content: TipTapNode[] = [];

  // Consecutive numbered paragraphs sharing a numId collapse into one list.
  let listBuffer: { numId: string; kind: 'bullet' | 'ordered'; items: TipTapNode[] } | null = null;
  const flushList = () => {
    if (!listBuffer) return;
    content.push({
      type: listBuffer.kind === 'ordered' ? 'orderedList' : 'bulletList',
      content: listBuffer.items,
    });
    listBuffer = null;
  };

  for (const node of body?.children ?? []) {
    if (node.name === 'w:p') {
      const numPr = path(node, 'w:pPr', 'w:numPr');
      const numId = val(numPr, 'w:numId');
      const ilvl = Number(val(numPr, 'w:ilvl') ?? 0);

      if (numId && numId !== '0') {
        const kind = numbering.get(numId)?.get(ilvl) ?? 'bullet';
        const blocks = explode(paragraphNode(node, ctx, undefined));
        const item: TipTapNode = {
          type: 'listItem',
          content: blocks.length ? blocks : [{ type: 'paragraph' }],
        };
        if (listBuffer && listBuffer.numId === numId && listBuffer.kind === kind) {
          listBuffer.items.push(item);
        } else {
          flushList();
          listBuffer = { numId, kind, items: [item] };
        }
        continue;
      }

      flushList();
      content.push(...explode(paragraphNode(node, ctx, styleOf(node))));
      continue;
    }

    if (node.name === 'w:tbl') {
      flushList();
      content.push(tableNode(node, ctx, styleOf));
      continue;
    }
  }
  flushList();

  if (!content.length) content.push({ type: 'paragraph' });

  const sectPr = child(body, 'w:sectPr');
  const pageSetup = pageSetupFromSectPr(sectPr);

  const headerPart = await pkg.part(attr(child(sectPr, 'w:headerReference'), 'r:id'));
  const footerPart = await pkg.part(attr(child(sectPr, 'w:footerReference'), 'r:id'));
  const header = headerFooterText(headerPart);
  const footer = headerFooterText(footerPart);

  const headerFooter: HeaderFooter = {
    ...DEFAULT_HEADER_FOOTER,
    header: header.text,
    footer: footer.text,
    showPageNumbers: header.hasPageNumber || footer.hasPageNumber,
  };

  return { content: { type: 'doc', content }, pageSetup, headerFooter, footnotes };
}
