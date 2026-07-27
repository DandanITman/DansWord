import type { Editor } from '@tiptap/react';
import type {
  CitationSource,
  CitationStyle,
  DocumentStyle,
  PageSetup,
  PageSizePreset,
  PageOrientation,
  LineNumberMode,
  CaptionLabel,
} from '@dansword/core';
import type { ShapeType } from '../extensions/DocShape';
import type { InkTool } from '../extensions/InkDrawing';
import type { RibbonState } from './useRibbonState';

/** View tab / status bar document views, matching Word's set. */
export type ViewMode = 'read' | 'print' | 'web' | 'outline' | 'draft' | 'focus';

/** Review > Display for Review. */
export type MarkupView = 'simple' | 'all' | 'none' | 'original';

/** Review > Show Markup checkboxes. */
export interface MarkupOptions {
  insertionsAndDeletions: boolean;
  formatting: boolean;
  comments: boolean;
}

export type PasteMode = 'default' | 'text' | 'match';

/** Every command the ribbon can invoke on the surrounding app. */
export interface RibbonActions {
  // File and Quick Access
  onNew: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  /** Backstage on the Export section — File > Export. */
  onOpenBackstage: () => void;
  /** Backstage on the New section, for the templates. */
  onOpenNewBackstage: () => void;
  /** Backstage on the Open section, for recents and Browse. */
  onOpenBackstageOpen: () => void;
  onOpenInfo: () => void;
  onOpenVersionHistory: () => void;
  onRenameFile: () => void;
  onCreateCopy: () => void;
  onDeleteFile: () => void;
  onPrint: () => void;
  onExportPdf: () => void;

  // Home
  onPaste: (mode: PasteMode) => void;
  onFormatPainterCopy: () => void;
  onFormatPainterApply: () => void;
  onOpenStyleEditor: () => void;
  onOpenFontDialog: () => void;
  onOpenParagraphDialog: () => void;
  onOpenBordersDialog: () => void;
  onSortParagraphs: (direction: 'asc' | 'desc') => void;
  onToggleFormattingMarks: () => void;
  onToggleFindReplace: (field?: 'find' | 'replace') => void;

  // Insert
  onInsertImage: () => void;
  onInsertShape: (type: ShapeType) => void;
  onInsertTextBox: (style: 'simple' | 'sidebar' | 'quote') => void;
  onInsertCoverPage: (id: string) => void;
  onInsertBlankPage: () => void;
  onOpenHeaderFooter: () => void;
  onInsertPageNumbers: (show: boolean) => void;
  onOpenSymbolPicker: () => void;
  onOpenEmojiPicker: () => void;
  onInsertBookmark: () => void;
  onOpenCrossReference: () => void;

  // Draw
  onInsertDrawingCanvas: () => void;
  onSetInkTool: (tool: InkTool) => void;
  onSetInkColor: (color: string) => void;
  onSetInkWidth: (width: number) => void;

  // Design
  onApplyStyleSet: (id: string) => void;
  onOpenWatermark: () => void;
  onSetPageColor: (color: string | null) => void;
  onOpenPageBorders: () => void;

  // Layout
  onOpenPageSetup: () => void;
  onApplyMarginPreset: (preset: string) => void;
  onSetOrientation: (orientation: PageOrientation) => void;
  onSetPageSize: (size: PageSizePreset) => void;
  onSetColumns: (count: number) => void;
  onOpenColumnsDialog: () => void;
  onSetLineNumbers: (mode: LineNumberMode) => void;
  onToggleHyphenation: () => void;

  // References
  onInsertToc: () => void;
  onUpdateToc: () => void;
  onInsertFootnote: () => void;
  onInsertEndnote: () => void;
  onShowNotes: () => void;
  onInsertCitation: (sourceId: string) => void;
  onManageSources: () => void;
  onSetCitationStyle: (style: CitationStyle) => void;
  onInsertBibliography: () => void;
  onInsertCaption: (label: CaptionLabel) => void;
  onInsertTableOfFigures: (label: CaptionLabel) => void;
  onMarkIndexEntry: () => void;
  onInsertIndex: () => void;

  // Review
  onOpenProofing: () => void;
  onOpenThesaurus: () => void;
  onOpenWordCount: () => void;
  onSetLanguage: (language: string) => void;
  onToggleSpellCheck: () => void;
  onToggleGrammarCheck: () => void;
  onNewComment: () => void;
  onDeleteComment: (scope: 'current' | 'all' | 'resolved') => void;
  onGoToComment: (delta: number) => void;
  onToggleComments: () => void;
  onToggleTrackChanges: () => void;
  onSetMarkupView: (view: MarkupView) => void;
  onToggleMarkupOption: (option: keyof MarkupOptions) => void;
  onToggleReviewingPane: () => void;
  onGoToChange: (delta: number) => void;
  onCompareDocuments: () => void;
  onCheckAccessibility: () => void;
  onToggleRestrictEditing: () => void;

  // View
  onSetViewMode: (mode: ViewMode) => void;
  onToggleFocusMode: () => void;
  onToggleRuler: () => void;
  onToggleGridlines: () => void;
  onToggleNavigation: () => void;
  onSetZoom: (zoom: number) => void;
  onOpenZoomDialog: () => void;
  onZoomToFit: (fit: 'pageWidth' | 'onePage' | 'multiplePages') => void;
  onToggleShowHeaderFooter: () => void;
  onToggleShowFootnotes: () => void;
  onToggleShowEndnotes: () => void;
  onToggleTheme: () => void;
  onToggleRibbonCollapsed: () => void;

  // Help
  onOpenHelp: () => void;
  onContactSupport: () => void;
  onSendFeedback: () => void;
  onOpenShortcuts: () => void;
  onOpenWhatsNew: () => void;

  // Picture and table tools
  onOpenAltText: () => void;
  onOpenPictureLayout: () => void;
  onResetPicture: () => void;
  onOpenTableProperties: () => void;
}

export interface RibbonFlags {
  trackChangesEnabled: boolean;
  formatPainterActive: boolean;
  focusMode: boolean;
  customStyles: DocumentStyle[];
  /** Tracked changes awaiting a decision, shown on the Review tab. */
  pendingInsertions: number;
  pendingDeletions: number;
  viewMode: ViewMode;
  zoom: number;
  showFormattingMarks: boolean;
  showRuler: boolean;
  showGridlines: boolean;
  showHeaderFooter: boolean;
  showFootnotes: boolean;
  showEndnotes: boolean;
  theme: 'light' | 'dark';
  ribbonCollapsed: boolean;
  accessibilityOpen: boolean;
  accessibilityIssues: number;
  navigationOpen: boolean;
  commentsOpen: boolean;
  reviewingPaneOpen: boolean;
  markupView: MarkupView;
  markupOptions: MarkupOptions;
  restrictEditing: boolean;
  language: string;
  spellCheckEnabled: boolean;
  grammarCheckEnabled: boolean;
  pageSetup: PageSetup;
  watermarkEnabled: boolean;
  showPageNumbers: boolean;
  styleSetId: string;
  citationStyle: CitationStyle;
  sources: CitationSource[];
  commentCount: number;
  unresolvedComments: number;
  ink: { tool: InkTool; color: string; width: number };
  /** Spelling and grammar problems the checker currently reports. */
  proofingIssues: number;
}

export interface RibbonTabProps {
  editor: Editor | null;
  state: RibbonState;
  actions: RibbonActions;
  /** Flags owned by the app rather than by the editor. */
  flags: RibbonFlags;
}
