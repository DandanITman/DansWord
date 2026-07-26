export interface Watermark {
  text: string;
  enabled: boolean;
  opacity: number;
}

/**
 * A style in the Styles gallery.
 *
 * `kind` mirrors Word's distinction: a paragraph style owns the whole
 * paragraph (including its heading level and spacing), a character style only
 * decorates the selected run.
 */
export interface DocumentStyle {
  id: string;
  name: string;
  kind?: 'paragraph' | 'character';
  fontFamily?: string;
  fontSize?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  headingLevel?: 1 | 2 | 3;
  /** Space above the paragraph, in pixels. */
  spaceBefore?: number;
  /** Space below the paragraph, in pixels. */
  spaceAfter?: number;
  lineHeight?: string;
  /** Renders as a quote block, like Word's Quote and Intense Quote. */
  quote?: boolean;
  /** Left accent border colour, used by the Quote and reference styles. */
  borderColor?: string;
  /** Paragraph shading. */
  shading?: string;
  /** Small-caps-like presentation for the reference styles. */
  uppercase?: boolean;
}

export const DEFAULT_WATERMARK: Watermark = {
  text: 'DRAFT',
  enabled: false,
  opacity: 0.12,
};

/**
 * Word's default Styles gallery.
 *
 * The order is Word's: Normal, No Spacing, the headings, Title, Subtitle, then
 * the character styles and quote styles. Anything the ribbon shows in its
 * three-wide quick gallery comes from the front of this list.
 */
export const BUILTIN_STYLES: DocumentStyle[] = [
  { id: 'normal', name: 'Normal', kind: 'paragraph', fontFamily: 'Calibri', fontSize: '11pt', spaceAfter: 12, lineHeight: '1.15' },
  { id: 'noSpacing', name: 'No Spacing', kind: 'paragraph', fontFamily: 'Calibri', fontSize: '11pt', spaceBefore: 0, spaceAfter: 0, lineHeight: '1' },
  { id: 'heading1', name: 'Heading 1', kind: 'paragraph', fontFamily: 'Calibri Light', fontSize: '16pt', color: '#2f5496', headingLevel: 1, spaceBefore: 16, spaceAfter: 4 },
  { id: 'heading2', name: 'Heading 2', kind: 'paragraph', fontFamily: 'Calibri Light', fontSize: '13pt', color: '#2f5496', headingLevel: 2, spaceBefore: 12, spaceAfter: 4 },
  { id: 'heading3', name: 'Heading 3', kind: 'paragraph', fontFamily: 'Calibri Light', fontSize: '12pt', color: '#1f3763', headingLevel: 3, spaceBefore: 10, spaceAfter: 4 },
  { id: 'title', name: 'Title', kind: 'paragraph', fontFamily: 'Calibri Light', fontSize: '28pt', color: '#000000', spaceAfter: 6 },
  { id: 'subtitle', name: 'Subtitle', kind: 'paragraph', fontFamily: 'Calibri Light', fontSize: '14pt', color: '#5a5a5a', italic: true, spaceAfter: 12 },
  { id: 'quote', name: 'Quote', kind: 'paragraph', fontFamily: 'Calibri', fontSize: '11pt', italic: true, color: '#404040', quote: true, borderColor: '#d0d0d0', spaceBefore: 10, spaceAfter: 10 },
  { id: 'intenseQuote', name: 'Intense Quote', kind: 'paragraph', fontFamily: 'Calibri', fontSize: '11pt', italic: true, color: '#2f5496', quote: true, borderColor: '#2f5496', spaceBefore: 12, spaceAfter: 12 },
  { id: 'listParagraph', name: 'List Paragraph', kind: 'paragraph', fontFamily: 'Calibri', fontSize: '11pt', spaceAfter: 0 },
  { id: 'emphasis', name: 'Emphasis', kind: 'character', italic: true },
  { id: 'strong', name: 'Strong', kind: 'character', bold: true },
  { id: 'subtleEmphasis', name: 'Subtle Emphasis', kind: 'character', italic: true, color: '#404040' },
  { id: 'intenseEmphasis', name: 'Intense Emphasis', kind: 'character', italic: true, bold: true, color: '#2f5496' },
  { id: 'subtleReference', name: 'Subtle Reference', kind: 'character', underline: true, color: '#5a5a5a' },
  { id: 'intenseReference', name: 'Intense Reference', kind: 'character', bold: true, underline: true, color: '#2f5496', uppercase: true },
  { id: 'bookTitle', name: 'Book Title', kind: 'character', bold: true, italic: true },
];

/**
 * The built-in styles with the user's default font applied.
 *
 * `defaultFontFamily` and `defaultFontSize` only set CSS variables, so they
 * changed what was on screen and nothing else: the document itself still said
 * Calibri 11, and that is what export wrote. New documents start from these
 * instead, which puts the preference in the document where export can see it.
 *
 * The size applies to the body styles only — headings define their own, exactly
 * as changing the body font in Word leaves heading sizes alone.
 */
export function builtinStylesWithDefaults(
  fontFamily: string,
  fontSize: number,
): DocumentStyle[] {
  const bodyStyles = new Set(['normal', 'noSpacing', 'listParagraph', 'quote', 'intenseQuote']);
  return BUILTIN_STYLES.map((style) => ({
    ...style,
    fontFamily: style.fontFamily ? fontFamily || style.fontFamily : undefined,
    fontSize: bodyStyles.has(style.id) && fontSize > 0 ? `${fontSize}pt` : style.fontSize,
  }));
}

/** Design > Fonts: a heading/body pairing, as Word's theme fonts work. */
export interface ThemeFontSet {
  id: string;
  name: string;
  heading: string;
  body: string;
}

export const THEME_FONTS: ThemeFontSet[] = [
  { id: 'office', name: 'Office', heading: 'Calibri Light', body: 'Calibri' },
  { id: 'officeClassic', name: 'Office Classic', heading: 'Arial', body: 'Times New Roman' },
  { id: 'garamond', name: 'Garamond', heading: 'Garamond', body: 'Garamond' },
  { id: 'georgia', name: 'Georgia', heading: 'Georgia', body: 'Georgia' },
  { id: 'trebuchet', name: 'Trebuchet MS', heading: 'Trebuchet MS', body: 'Trebuchet MS' },
  { id: 'candara', name: 'Candara', heading: 'Candara', body: 'Candara' },
  { id: 'timesGeorgia', name: 'Times New Roman', heading: 'Times New Roman', body: 'Times New Roman' },
  { id: 'verdana', name: 'Verdana', heading: 'Verdana', body: 'Verdana' },
];

/** Design > Colors: the accent used by heading styles. */
export interface ThemeColorSet {
  id: string;
  name: string;
  heading1: string;
  heading2: string;
  heading3: string;
  accents: string[];
}

export const THEME_COLORS: ThemeColorSet[] = [
  {
    id: 'office',
    name: 'Office',
    heading1: '#2f5496',
    heading2: '#2f5496',
    heading3: '#1f3763',
    accents: ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'],
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    heading1: '#3b3b3b',
    heading2: '#3b3b3b',
    heading3: '#1f1f1f',
    accents: ['#8a8a8a', '#6f6f6f', '#575757', '#3f3f3f', '#282828', '#111111'],
  },
  {
    id: 'blueGreen',
    name: 'Blue Green',
    heading1: '#0f6b63',
    heading2: '#0f6b63',
    heading3: '#08423d',
    accents: ['#0f9e93', '#2e9bd6', '#7fb800', '#f2a900', '#e8582e', '#8e6bbf'],
  },
  {
    id: 'redOrange',
    name: 'Red Orange',
    heading1: '#a13d1c',
    heading2: '#a13d1c',
    heading3: '#6d2810',
    accents: ['#e04c1f', '#f08c00', '#d6b800', '#8bb400', '#0f8fa8', '#8a4fbd'],
  },
  {
    id: 'violet',
    name: 'Violet',
    heading1: '#5c2d91',
    heading2: '#5c2d91',
    heading3: '#3d1e63',
    accents: ['#7a3fbf', '#b14fd8', '#e05fa8', '#f0894f', '#4f9bd8', '#5fbf8f'],
  },
  {
    id: 'green',
    name: 'Green',
    heading1: '#2d6a2d',
    heading2: '#2d6a2d',
    heading3: '#1c451c',
    accents: ['#4f9e4f', '#8bbf3f', '#d8c73f', '#e08f3f', '#3f9bbf', '#7a5fbf'],
  },
];

/**
 * Design > Style Set: the gallery that restyles the whole document.
 *
 * Each set only overrides the pieces Word's sets change — heading fonts, sizes,
 * colour and paragraph spacing — so the user's default body font survives.
 */
export interface StyleSet {
  id: string;
  name: string;
  overrides: Partial<Record<string, Partial<DocumentStyle>>>;
}

export const STYLE_SETS: StyleSet[] = [
  { id: 'default', name: 'Default', overrides: {} },
  {
    id: 'noSpacing',
    name: 'No Spacing',
    overrides: {
      normal: { spaceBefore: 0, spaceAfter: 0, lineHeight: '1' },
      heading1: { spaceBefore: 8, spaceAfter: 2 },
      heading2: { spaceBefore: 6, spaceAfter: 2 },
      heading3: { spaceBefore: 6, spaceAfter: 2 },
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    overrides: {
      normal: { fontSize: '10pt', spaceAfter: 6, lineHeight: '1' },
      heading1: { fontSize: '14pt', spaceBefore: 10, spaceAfter: 2 },
      heading2: { fontSize: '12pt', spaceBefore: 8, spaceAfter: 2 },
      heading3: { fontSize: '11pt', spaceBefore: 8, spaceAfter: 2 },
      title: { fontSize: '22pt' },
    },
  },
  {
    id: 'casual',
    name: 'Casual',
    overrides: {
      normal: { fontFamily: 'Trebuchet MS' },
      heading1: { fontFamily: 'Trebuchet MS', color: '#e36c0a', fontSize: '17pt' },
      heading2: { fontFamily: 'Trebuchet MS', color: '#e36c0a', fontSize: '14pt' },
      heading3: { fontFamily: 'Trebuchet MS', color: '#c0561f', fontSize: '12pt' },
      title: { fontFamily: 'Trebuchet MS', color: '#e36c0a' },
      subtitle: { fontFamily: 'Trebuchet MS' },
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    overrides: {
      normal: { fontFamily: 'Garamond', fontSize: '12pt', lineHeight: '1.5' },
      heading1: { fontFamily: 'Garamond', fontSize: '18pt', color: '#000000', uppercase: true },
      heading2: { fontFamily: 'Garamond', fontSize: '14pt', color: '#000000', italic: true },
      heading3: { fontFamily: 'Garamond', fontSize: '12pt', color: '#333333', italic: true },
      title: { fontFamily: 'Garamond', fontSize: '30pt', uppercase: true },
      subtitle: { fontFamily: 'Garamond', italic: true },
    },
  },
  {
    id: 'formal',
    name: 'Formal',
    overrides: {
      normal: { fontFamily: 'Times New Roman', fontSize: '12pt', lineHeight: '2' },
      heading1: { fontFamily: 'Times New Roman', fontSize: '16pt', color: '#1f3763', bold: true },
      heading2: { fontFamily: 'Times New Roman', fontSize: '14pt', color: '#1f3763', bold: true },
      heading3: { fontFamily: 'Times New Roman', fontSize: '12pt', color: '#1f3763', bold: true },
      title: { fontFamily: 'Times New Roman', fontSize: '26pt', bold: true },
      subtitle: { fontFamily: 'Times New Roman' },
    },
  },
  {
    id: 'lines',
    name: 'Lines',
    overrides: {
      heading1: { borderColor: '#2f5496', spaceAfter: 8 },
      heading2: { borderColor: '#8faadc', spaceAfter: 6 },
      heading3: { borderColor: '#b4c7e7', spaceAfter: 6 },
    },
  },
  {
    id: 'shaded',
    name: 'Shaded',
    overrides: {
      heading1: { shading: '#dae3f3', color: '#1f3763' },
      heading2: { shading: '#e9eef8', color: '#1f3763' },
      heading3: { shading: '#f2f5fb', color: '#1f3763' },
    },
  },
];

/** Design > Paragraph Spacing, with Word's names and measurements. */
export interface ParagraphSpacingPreset {
  id: string;
  name: string;
  before: number;
  after: number;
  lineHeight: string;
}

export const PARAGRAPH_SPACING_PRESETS: ParagraphSpacingPreset[] = [
  { id: 'noSpacing', name: 'No Paragraph Space', before: 0, after: 0, lineHeight: '1' },
  { id: 'compact', name: 'Compact', before: 0, after: 5, lineHeight: '1' },
  { id: 'tight', name: 'Tight', before: 0, after: 8, lineHeight: '1.15' },
  { id: 'open', name: 'Open', before: 0, after: 13, lineHeight: '1.15' },
  { id: 'relaxed', name: 'Relaxed', before: 0, after: 8, lineHeight: '1.5' },
  { id: 'double', name: 'Double', before: 0, after: 11, lineHeight: '2' },
];

/** Apply a style set and theme to a style list, the way Design does. */
export function applyStyleSet(
  styles: DocumentStyle[],
  styleSetId: string,
  themeFontId?: string,
  themeColorId?: string,
): DocumentStyle[] {
  const set = STYLE_SETS.find((s) => s.id === styleSetId) ?? STYLE_SETS[0];
  const fonts = THEME_FONTS.find((f) => f.id === themeFontId);
  const colors = THEME_COLORS.find((c) => c.id === themeColorId);

  return styles.map((style) => {
    const next: DocumentStyle = { ...style, ...(set.overrides[style.id] ?? {}) };

    if (fonts && next.fontFamily) {
      const isHeading = style.headingLevel !== undefined || style.id === 'title' || style.id === 'subtitle';
      next.fontFamily = isHeading ? fonts.heading : fonts.body;
    }
    if (colors) {
      if (style.id === 'heading1') next.color = colors.heading1;
      if (style.id === 'heading2') next.color = colors.heading2;
      if (style.id === 'heading3') next.color = colors.heading3;
      if (style.id === 'intenseQuote' || style.id === 'intenseEmphasis' || style.id === 'intenseReference') {
        next.color = colors.heading1;
      }
    }
    return next;
  });
}
