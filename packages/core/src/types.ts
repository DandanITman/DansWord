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
  /** Attributed to comments and tracked changes. */
  authorName: string;
  /** Flag grammar and style problems as well as misspellings. */
  grammarCheckEnabled: boolean;
  /** Fix common typos and straighten quotes while typing. */
  autoCorrectEnabled: boolean;
  /** Show pilcrows, spaces and tabs, like Word's ¶ button. */
  showFormattingMarks: boolean;
  /** Show the horizontal and vertical rulers. */
  showRuler: boolean;
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
  version: 1 | 2 | 3;
  metadata: DocumentMetadata;
  content: unknown;
  pageSetup?: import('./pageSetup').PageSetup;
  headerFooter?: import('./pageSetup').HeaderFooter;
  comments?: import('./pageSetup').DocumentComment[];
  trackChangesEnabled?: boolean;
  watermark?: import('./styles').Watermark;
  customStyles?: import('./styles').DocumentStyle[];
  footnotes?: import('./pageSetup').DocumentFootnote[];
  endnotes?: import('./pageSetup').DocumentFootnote[];
  /** Bibliography sources, in the order Manage Sources shows them. */
  sources?: import('./references').CitationSource[];
  citationStyle?: import('./references').CitationStyle;
  /** Mail merge recipients, as loaded from a data file. */
  mailMerge?: import('./mailMerge').MailMergeData;
  /** Read-only until the reviewer turns editing back on. */
  restrictEditing?: boolean;
  /** Design tab: which style set the document formatting came from. */
  styleSetId?: string;
}

/**
 * Word's tab set, minus the tabs that need a cloud account (Share, Draw's
 * ink-to-text, Copilot). `pictureFormat` and `tableLayout` are contextual:
 * they only appear while the matching object is selected, as in Word.
 */
export type RibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'pageLayout'
  | 'references'
  | 'mailings'
  | 'review'
  | 'view'
  | 'pictureFormat'
  | 'tableLayout';

export type AppView = 'home' | 'editor';
