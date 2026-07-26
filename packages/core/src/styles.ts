export interface Watermark {
  text: string;
  enabled: boolean;
  opacity: number;
}

export interface DocumentStyle {
  id: string;
  name: string;
  fontFamily?: string;
  fontSize?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  headingLevel?: 1 | 2 | 3;
}

export const DEFAULT_WATERMARK: Watermark = {
  text: 'DRAFT',
  enabled: false,
  opacity: 0.12,
};

export const BUILTIN_STYLES: DocumentStyle[] = [
  { id: 'normal', name: 'Normal', fontFamily: 'Calibri', fontSize: '11pt' },
  { id: 'title', name: 'Title', fontFamily: 'Calibri', fontSize: '24pt', bold: true },
  { id: 'heading1', name: 'Heading 1', fontFamily: 'Calibri', fontSize: '18pt', bold: true, headingLevel: 1 },
  { id: 'heading2', name: 'Heading 2', fontFamily: 'Calibri', fontSize: '14pt', bold: true, headingLevel: 2 },
  { id: 'heading3', name: 'Heading 3', fontFamily: 'Calibri', fontSize: '12pt', bold: true, headingLevel: 3 },
];

/**
 * The built-in styles with the user's default font applied.
 *
 * `defaultFontFamily` and `defaultFontSize` only set CSS variables, so they
 * changed what was on screen and nothing else: the document itself still said
 * Calibri 11, and that is what export wrote. New documents start from these
 * instead, which puts the preference in the document where export can see it.
 *
 * The size applies to Normal only — the headings define their own, exactly as
 * changing the body font in Word leaves heading sizes alone.
 */
export function builtinStylesWithDefaults(
  fontFamily: string,
  fontSize: number,
): DocumentStyle[] {
  return BUILTIN_STYLES.map((style) => ({
    ...style,
    fontFamily: fontFamily || style.fontFamily,
    fontSize: style.id === 'normal' && fontSize > 0 ? `${fontSize}pt` : style.fontSize,
  }));
}
