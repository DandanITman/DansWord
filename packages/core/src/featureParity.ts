/** Feature parity vs Microsoft Word / LibreOffice Writer (local only — no AI/cloud). */

export type ParityStatus = 'implemented' | 'partial' | 'missing';

export type ParityCategory =
  | 'file'
  | 'edit'
  | 'font'
  | 'paragraph'
  | 'insert'
  | 'pageLayout'
  | 'review'
  | 'view'
  | 'advanced';

export interface ParityFeature {
  id: string;
  name: string;
  category: ParityCategory;
  status: ParityStatus;
  word: boolean;
  openOffice: boolean;
  notes?: string;
}

export const FEATURE_PARITY: ParityFeature[] = [
  // File
  { id: 'file.new', name: 'New document', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.open', name: 'Open file', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.save', name: 'Save / Save As', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.autosave', name: 'Auto-save', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.dansword', name: 'Native .dansword format', category: 'file', status: 'implemented', word: false, openOffice: false },
  { id: 'file.docx', name: 'DOCX import/export', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.rtf', name: 'RTF import/export', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.html', name: 'HTML export', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.txt', name: 'Plain text open/save', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.doc', name: 'Legacy .doc import', category: 'file', status: 'partial', word: true, openOffice: true, notes: 'LibreOffice DOCX conversion when installed; else text fallback' },
  { id: 'file.pdf', name: 'PDF export', category: 'file', status: 'implemented', word: true, openOffice: true, notes: 'Electron printToPDF engine' },
  { id: 'file.print', name: 'Print', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.revisions', name: 'Local version history', category: 'file', status: 'implemented', word: true, openOffice: true },
  { id: 'file.password', name: 'Password protection', category: 'file', status: 'missing', word: true, openOffice: true },

  // Edit
  { id: 'edit.undo', name: 'Undo / Redo', category: 'edit', status: 'implemented', word: true, openOffice: true },
  { id: 'edit.cutcopypaste', name: 'Cut / Copy / Paste', category: 'edit', status: 'partial', word: true, openOffice: true, notes: 'OS clipboard' },
  { id: 'edit.find', name: 'Find', category: 'edit', status: 'implemented', word: true, openOffice: true },
  { id: 'edit.replace', name: 'Find & Replace', category: 'edit', status: 'implemented', word: true, openOffice: true },
  { id: 'edit.selectAll', name: 'Select all', category: 'edit', status: 'implemented', word: true, openOffice: true },

  // Font
  { id: 'font.bold', name: 'Bold, italic, underline, strike', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.family', name: 'Font family & size', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.color', name: 'Font color', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.highlight', name: 'Text highlight', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.superscript', name: 'Subscript / superscript', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.clear', name: 'Clear formatting', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.styles', name: 'Quick styles gallery', category: 'font', status: 'implemented', word: true, openOffice: true },
  { id: 'font.painter', name: 'Format painter', category: 'font', status: 'implemented', word: true, openOffice: true },

  // Paragraph
  { id: 'para.align', name: 'Text alignment', category: 'paragraph', status: 'implemented', word: true, openOffice: true },
  { id: 'para.lists', name: 'Bulleted & numbered lists', category: 'paragraph', status: 'implemented', word: true, openOffice: true },
  { id: 'para.headings', name: 'Heading styles', category: 'paragraph', status: 'implemented', word: true, openOffice: true },
  { id: 'para.indent', name: 'Increase/decrease indent', category: 'paragraph', status: 'implemented', word: true, openOffice: true },
  { id: 'para.spacing', name: 'Line & paragraph spacing', category: 'paragraph', status: 'implemented', word: true, openOffice: true },
  { id: 'para.borders', name: 'Borders & shading', category: 'paragraph', status: 'implemented', word: true, openOffice: true, notes: 'Paragraph border/shading controls with DOCX/HTML export' },

  // Insert
  { id: 'insert.image', name: 'Pictures', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.imageWrap', name: 'Text wrapping around images', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.table', name: 'Tables', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.link', name: 'Hyperlinks', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.pageBreak', name: 'Page breaks', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.toc', name: 'Table of contents', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.hr', name: 'Horizontal line', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.date', name: 'Insert date', category: 'insert', status: 'implemented', word: true, openOffice: true },
  { id: 'insert.shapes', name: 'Shapes / drawing', category: 'insert', status: 'implemented', word: true, openOffice: true, notes: 'Rect, oval, line, arrow' },
  { id: 'insert.equation', name: 'Equations', category: 'insert', status: 'missing', word: true, openOffice: true },
  { id: 'insert.footnote', name: 'Footnotes & endnotes', category: 'insert', status: 'partial', word: true, openOffice: true, notes: 'Footnotes with DOCX export; endnotes N/A' },

  // Page layout
  { id: 'layout.size', name: 'Page size & orientation', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.margins', name: 'Margins', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.headerFooter', name: 'Headers & footers', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.pageNumbers', name: 'Page numbers (print)', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.watermark', name: 'Watermarks', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.columns', name: 'Columns', category: 'pageLayout', status: 'implemented', word: true, openOffice: true },
  { id: 'layout.sectionBreak', name: 'Section breaks', category: 'pageLayout', status: 'missing', word: true, openOffice: true },

  // Review
  { id: 'review.spell', name: 'Spell check', category: 'review', status: 'implemented', word: true, openOffice: true, notes: 'Hunspell via nspell' },
  { id: 'review.comments', name: 'Comments', category: 'review', status: 'implemented', word: true, openOffice: true },
  { id: 'review.trackChanges', name: 'Track changes', category: 'review', status: 'implemented', word: true, openOffice: true },
  { id: 'review.compare', name: 'Compare documents', category: 'review', status: 'missing', word: true, openOffice: true },
  { id: 'review.thesaurus', name: 'Thesaurus', category: 'review', status: 'missing', word: true, openOffice: true },

  // View
  { id: 'view.zoom', name: 'Zoom', category: 'view', status: 'implemented', word: true, openOffice: true },
  { id: 'view.ruler', name: 'Rulers', category: 'view', status: 'implemented', word: true, openOffice: true },
  { id: 'view.navigation', name: 'Navigation pane', category: 'view', status: 'implemented', word: true, openOffice: true },
  { id: 'view.focus', name: 'Focus / distraction-free', category: 'view', status: 'implemented', word: true, openOffice: true },
  { id: 'view.wordCount', name: 'Word count', category: 'view', status: 'implemented', word: true, openOffice: true },
  { id: 'view.pagination', name: 'Print pagination', category: 'view', status: 'implemented', word: true, openOffice: true, notes: 'Multi-page layout + printToPDF' },

  // Advanced
  { id: 'adv.mailMerge', name: 'Mail merge', category: 'advanced', status: 'implemented', word: true, openOffice: true },
  { id: 'adv.macros', name: 'Macros', category: 'advanced', status: 'missing', word: true, openOffice: true },
  { id: 'adv.collab', name: 'Real-time collaboration', category: 'advanced', status: 'partial', word: true, openOffice: false, notes: 'LAN envelope sync over WebSocket' },
  { id: 'adv.cloudSync', name: 'Cloud sync / OneDrive', category: 'advanced', status: 'missing', word: true, openOffice: false },
  { id: 'adv.aiAssist', name: 'AI writing assistant', category: 'advanced', status: 'missing', word: true, openOffice: false },
];

/** Out-of-scope features (AI, cloud) — must stay missing. */
export const EXCLUDED_FEATURE_IDS = ['adv.cloudSync', 'adv.aiAssist'] as const;

export function paritySummary() {
  const implemented = FEATURE_PARITY.filter((f) => f.status === 'implemented').length;
  const partial = FEATURE_PARITY.filter((f) => f.status === 'partial').length;
  const missing = FEATURE_PARITY.filter((f) => f.status === 'missing').length;
  const total = FEATURE_PARITY.length;
  const wordBaseline = FEATURE_PARITY.filter((f) => f.word).length;
  const covered = FEATURE_PARITY.filter((f) => f.word && (f.status === 'implemented' || f.status === 'partial')).length;
  return {
    total,
    implemented,
    partial,
    missing,
    wordBaseline,
    covered,
    coveragePct: Math.round((covered / wordBaseline) * 100),
  };
}

export function featuresByStatus(status: ParityStatus) {
  return FEATURE_PARITY.filter((f) => f.status === status);
}

export const IMPLEMENTED_FEATURE_IDS = FEATURE_PARITY.filter(
  (f) => f.status === 'implemented',
).map((f) => f.id);
