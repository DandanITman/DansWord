export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  accentColor: string;
  defaultSaveLocation: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  autoSaveIntervalMs: number;
  spellCheckEnabled: boolean;
  language: string;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
  pinned: boolean;
}

export interface DocumentMetadata {
  title: string;
  author: string;
  created: string;
  modified: string;
  subject?: string;
  keywords?: string;
  company?: string;
}

export interface DansWordDocument {
  version: 1 | 2;
  metadata: DocumentMetadata;
  content: unknown;
  pageSetup?: import('./pageSetup').PageSetup;
  headerFooter?: import('./pageSetup').HeaderFooter;
  comments?: import('./pageSetup').DocumentComment[];
  trackChangesEnabled?: boolean;
  watermark?: import('./styles').Watermark;
  customStyles?: import('./styles').DocumentStyle[];
  footnotes?: import('./pageSetup').DocumentFootnote[];
}

export type RibbonTab = 'file' | 'edit' | 'insert' | 'design' | 'pageLayout' | 'mailings' | 'review' | 'view';

export type AppView = 'home' | 'editor';

export interface DocumentState {
  id: string;
  filePath: string | null;
  fileName: string;
  isDirty: boolean;
  lastSaved: number | null;
  content: unknown;
}
