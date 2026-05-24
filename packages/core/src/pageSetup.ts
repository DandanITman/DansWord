export type PageSizePreset = 'letter' | 'a4' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageSetup {
  size: PageSizePreset;
  orientation: PageOrientation;
  margins: PageMargins;
  columns: ColumnLayout;
}

export interface ColumnLayout {
  count: number;
  gap: number;
}

export interface DocumentFootnote {
  id: string;
  text: string;
}

export interface HeaderFooter {
  header: string;
  footer: string;
  showPageNumbers: boolean;
}

export interface DocumentComment {
  id: string;
  text: string;
  author: string;
  created: string;
  resolved: boolean;
  anchorText?: string;
}

export interface DocumentRevision {
  id: string;
  timestamp: number;
  label: string;
  filePath: string;
}

export const PAGE_DIMENSIONS: Record<PageSizePreset, { width: number; height: number }> = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  size: 'letter',
  orientation: 'portrait',
  margins: { top: 96, bottom: 96, left: 96, right: 96 },
  columns: { count: 1, gap: 48 },
};

export const DEFAULT_HEADER_FOOTER: HeaderFooter = {
  header: '',
  footer: '',
  showPageNumbers: false,
};

export const MARGIN_PRESETS: Record<string, PageMargins> = {
  Normal: { top: 96, bottom: 96, left: 96, right: 96 },
  Narrow: { top: 48, bottom: 48, left: 48, right: 48 },
  Wide: { top: 96, bottom: 96, left: 144, right: 144 },
};
