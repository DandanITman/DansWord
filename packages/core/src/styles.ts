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
