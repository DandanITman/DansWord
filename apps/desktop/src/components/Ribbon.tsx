import type { Editor } from '@tiptap/react';
import type { DocumentStyle, RibbonTab } from '@dansword/core';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Printer,
  FileDown,
  Paintbrush,
  Highlighter,
  LayoutTemplate,
  BookOpen,
  MessageSquare,
  GitCompare,
  Maximize2,
  PanelLeft,
  Search,
  FileType,
  SeparatorHorizontal,
  Stamp,
  CheckCheck,
  XCircle,
  Check,
  X,
  Calendar,
  Type,
  FilePlus,
  FolderOpen,
  Save,
  ClipboardPaste,
  Scissors,
  Copy,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Superscript,
  Subscript,
  Users,
  Share2,
} from 'lucide-react';
import type { ShapeType } from '../extensions/DocShape';
import { insertTableOfContents } from '../utils/headings';
import { applyDocumentStyle } from '../utils/applyStyle';
import { acceptAllTrackChanges, rejectAllTrackChanges, acceptTrackChangeInSelection, rejectTrackChangeInSelection } from '../utils/trackChanges';

interface RibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  editor: Editor | null;
  onPrint: () => void;
  onExportPdf: () => void;
  onInsertImage: () => void;
  onOpenPageSetup: () => void;
  onOpenHeaderFooter: () => void;
  onToggleNavigation: () => void;
  onToggleComments: () => void;
  onToggleFindReplace: () => void;
  onToggleFocusMode: () => void;
  trackChangesEnabled: boolean;
  onToggleTrackChanges: () => void;
  formatPainterActive: boolean;
  onFormatPainterCopy: () => void;
  onFormatPainterApply: () => void;
  focusMode: boolean;
  customStyles: DocumentStyle[];
  onOpenStyleEditor: () => void;
  onOpenWatermark: () => void;
  onNew: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onOpenBackstage: () => void;
  onInsertShape: (type: ShapeType) => void;
  onInsertFootnote: () => void;
  onInsertMergeField: () => void;
  onOpenMailMerge: () => void;
  onOpenCollaboration: () => void;
  collabActive?: boolean;
}

const TABS: { id: RibbonTab; label: string }[] = [
  { id: 'file', label: 'File' },
  { id: 'edit', label: 'Edit' },
  { id: 'insert', label: 'Insert' },
  { id: 'design', label: 'Design' },
  { id: 'pageLayout', label: 'Page Layout' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

const FONT_FAMILIES = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Courier New'];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36'];

export function Ribbon({
  activeTab,
  onTabChange,
  editor,
  onPrint,
  onExportPdf,
  onInsertImage,
  onOpenPageSetup,
  onOpenHeaderFooter,
  onToggleNavigation,
  onToggleComments,
  onToggleFindReplace,
  onToggleFocusMode,
  trackChangesEnabled,
  onToggleTrackChanges,
  formatPainterActive,
  onFormatPainterCopy,
  onFormatPainterApply,
  focusMode,
  customStyles,
  onOpenStyleEditor,
  onOpenWatermark,
  onNew,
  onOpenFile,
  onSave,
  onOpenBackstage,
  onInsertShape,
  onInsertFootnote,
  onInsertMergeField,
  onOpenMailMerge,
  onOpenCollaboration,
  collabActive,
}: RibbonProps) {
  const runClipboard = (cmd: 'cut' | 'copy' | 'paste') => {
    editor?.view.dom.focus();
    document.execCommand(cmd);
  };

  const clearFormatting = () => {
    editor?.chain().focus().clearNodes().unsetAllMarks().clearParagraphFormatting().run();
  };

  const setFontColor = () => {
    if (!editor) return;
    const previous = editor.getAttributes('textStyle').color as string | undefined;
    const color = window.prompt('Font color hex value. Leave blank to clear.', previous ?? '#111827');
    if (color === null) return;
    if (!color.trim()) {
      editor.chain().focus().unsetColor().run();
      return;
    }
    editor.chain().focus().setColor(color.trim()).run();
  };

  const setHighlight = () => {
    if (!editor) return;
    const previous = editor.getAttributes('highlight').color as string | undefined;
    const color = window.prompt('Highlight color hex value. Leave blank to clear.', previous ?? '#fef08a');
    if (color === null) return;
    if (!color.trim()) {
      editor.chain().focus().unsetHighlight().run();
      return;
    }
    editor.chain().focus().setHighlight({ color: color.trim() }).run();
  };

  const setParagraphSpacing = () => {
    const before = window.prompt('Space before paragraph (px)', '0');
    if (before === null) return;
    const after = window.prompt('Space after paragraph (px)', '12');
    if (after === null) return;
    editor?.chain().focus().setParagraphSpacing(Number(before) || 0, Number(after) || 0).run();
  };

  const setParagraphBorder = () => {
    const color = window.prompt('Paragraph border color. Leave blank to clear.', '#94a3b8');
    if (color === null) return;
    editor?.chain().focus().setParagraphBorder(color.trim() || null).run();
  };

  const setParagraphShading = () => {
    const color = window.prompt('Paragraph shading color. Leave blank to clear.', '#f8fafc');
    if (color === null) return;
    editor?.chain().focus().setParagraphShading(color.trim() || null).run();
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="ribbon office-ribbon" data-testid="ribbon">
      <div className="ribbon-tabs office-ribbon-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            data-tab={tab.id}
            data-testid={`ribbon-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ribbon-panel office-ribbon-panel">
        {activeTab === 'file' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <button className="ribbon-btn-lg-compact" onClick={onNew} title="New Document">
                  <FilePlus size={20} />
                  <span>New</span>
                </button>
                <button className="ribbon-btn-lg-compact" onClick={onOpenFile} title="Open Document">
                  <FolderOpen size={20} />
                  <span>Open</span>
                </button>
                <button className="ribbon-btn-lg-compact" onClick={onSave} title="Save Document" data-testid="ribbon-save">
                  <Save size={20} />
                  <span>Save</span>
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <button className="ribbon-btn-horizontal-compact" onClick={onOpenBackstage} title="Save As / Export Options">
                  <FileDown size={14} /> <span>Save As / Export</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={onPrint} title="Print Document">
                  <Printer size={14} /> <span>Print</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={onExportPdf} title="Export as PDF">
                  <FileDown size={14} /> <span>Export PDF</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={onOpenMailMerge} title="Mail Merge Wizard">
                  <Users size={14} /> <span>Mail Merge</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'edit' && (
          <>
            {/* Clipboard Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-row">
                  <button className="ribbon-btn-lg-compact" onClick={() => runClipboard('paste')} title="Paste">
                    <ClipboardPaste size={20} className="icon-paste" />
                    <span>Paste</span>
                  </button>
                  <div className="ribbon-column">
                    <button className="ribbon-btn-sm-compact" onClick={() => runClipboard('cut')} title="Cut">
                      <Scissors size={13} className="icon-cut" />
                      <span>Cut</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => runClipboard('copy')} title="Copy">
                      <Copy size={13} className="icon-copy" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Font Family / Size & Formatting Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    <select
                      className="ribbon-select font-family-select"
                      value={editor?.getAttributes('textStyle').fontFamily ?? 'Calibri'}
                      onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      className="ribbon-select ribbon-select-sm"
                      data-testid="ribbon-font-size"
                      value={String(editor?.getAttributes('textStyle').fontSize ?? '11pt').replace('pt', '')}
                      onChange={(e) =>
                        editor
                          ?.chain()
                          .focus()
                          .setMark('textStyle', {
                            ...editor.getAttributes('textStyle'),
                            fontSize: `${e.target.value}pt`,
                          })
                          .run()
                      }
                    >
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button className="ribbon-btn-icon" onClick={setFontColor} title="Font Color">
                      <Type size={15} className="icon-color" />
                    </button>
                    <button
                      className={`ribbon-btn-icon ${editor?.isActive('highlight') ? 'active' : ''}`}
                      onClick={setHighlight}
                      title="Highlight Text"
                    >
                      <Highlighter size={15} className="icon-highlight" />
                    </button>
                    <button className="ribbon-btn-icon" onClick={clearFormatting} title="Clear Formatting">
                      <Eraser size={15} />
                    </button>
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className={`ribbon-btn-icon ${editor?.isActive('bold') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold" data-testid="ribbon-bold">
                      <Bold size={14} className="icon-bold" />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('italic') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic" data-testid="ribbon-italic">
                      <Italic size={14} className="icon-italic" />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('underline') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline" data-testid="ribbon-underline">
                      <Underline size={14} className="icon-underline" />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('strike') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough">
                      <Strikethrough size={14} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('superscript') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleSuperscript().run()} title="Superscript">
                      <Superscript size={14} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('subscript') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleSubscript().run()} title="Subscript">
                      <Subscript size={14} />
                    </button>
                    <button
                      className={`ribbon-btn-icon ${formatPainterActive ? 'active' : ''}`}
                      onClick={() => (formatPainterActive ? onFormatPainterApply() : onFormatPainterCopy())}
                      title="Format Painter"
                    >
                      <Paintbrush size={14} className="icon-painter" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Paragraph / Spacing / Alignment Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    <button className={`ribbon-btn-icon ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align Left" data-testid="ribbon-align-left">
                      <AlignLeft size={15} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Align Center" data-testid="ribbon-align-center">
                      <AlignCenter size={15} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Align Right" data-testid="ribbon-align-right">
                      <AlignRight size={15} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} title="Justify">
                      <AlignJustify size={15} />
                    </button>
                    <div className="ribbon-divider-v" />
                    <select
                      className="ribbon-select ribbon-select-sm"
                      value={editor?.getAttributes('paragraph').lineHeight ?? editor?.getAttributes('heading').lineHeight ?? ''}
                      onChange={(e) => editor?.chain().focus().setLineSpacing(e.target.value).run()}
                      title="Line spacing"
                    >
                      <option value="">Line</option>
                      <option value="1">1.0</option>
                      <option value="1.15">1.15</option>
                      <option value="1.5">1.5</option>
                      <option value="2">2.0</option>
                    </select>
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className={`ribbon-btn-icon ${editor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullets" data-testid="ribbon-bullet-list">
                      <List size={14} />
                    </button>
                    <button className={`ribbon-btn-icon ${editor?.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbers" data-testid="ribbon-ordered-list">
                      <ListOrdered size={14} />
                    </button>
                    <button className="ribbon-btn-icon" onClick={() => editor?.chain().focus().decreaseParagraphIndent().run()} title="Decrease Indent">
                      <AlignLeft size={14} style={{ transform: 'scaleX(-1)' }} />
                    </button>
                    <button className="ribbon-btn-icon" onClick={() => editor?.chain().focus().increaseParagraphIndent().run()} title="Increase Indent">
                      <AlignLeft size={14} />
                    </button>
                    <div className="ribbon-divider-v" />
                    <button className="ribbon-btn-horizontal-compact" onClick={setParagraphSpacing} title="Spacing">
                      <span>Spacing</span>
                    </button>
                    <button className="ribbon-btn-horizontal-compact" onClick={setParagraphBorder} title="Paragraph Border">
                      <span>Border</span>
                    </button>
                    <button className="ribbon-btn-horizontal-compact" onClick={setParagraphShading} title="Shading/Background">
                      <span>Shade</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Styles Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    {(customStyles.length ? customStyles : [
                      { id: 'normal', name: 'Normal' },
                      { id: 'heading1', name: 'H1', headingLevel: 1 as const },
                      { id: 'heading2', name: 'H2', headingLevel: 2 as const },
                    ]).slice(0, 3).map((s) => (
                      <button key={s.id} className="ribbon-btn-style-compact" onClick={() => editor && applyDocumentStyle(editor, s)} title={`Apply ${s.name}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className="ribbon-btn-horizontal-compact" onClick={onOpenStyleEditor}>
                      <Type size={13} /> <span>More Styles</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Editing Group */}
            <div className="ribbon-group" style={{ borderRight: 'none' }}>
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <button className="ribbon-btn-horizontal-compact" onClick={onToggleFindReplace}>
                    <Search size={14} /> <span>Find & Replace</span>
                  </button>
                  <button className="ribbon-btn-horizontal-compact" onClick={() => editor?.chain().focus().selectAll().run()}>
                    <span>Select All</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'design' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-row">
                  {(customStyles.length ? customStyles : [
                    { id: 'normal', name: 'Normal' },
                    { id: 'heading1', name: 'Heading 1', headingLevel: 1 as const },
                    { id: 'heading2', name: 'Heading 2', headingLevel: 2 as const },
                  ]).slice(0, 4).map((s) => (
                    <button key={s.id} className="ribbon-btn-style-compact" onClick={() => editor && applyDocumentStyle(editor, s)} title={`Apply ${s.name}`}>
                      {s.name}
                    </button>
                  ))}
                  <button className="ribbon-btn-horizontal-compact" onClick={onOpenStyleEditor}>
                    <Type size={14} /> <span>Manage Styles</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <button className="ribbon-btn-horizontal-compact" onClick={onOpenWatermark} title="Set Page Watermark">
                  <Stamp size={15} /> <span>Watermark</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            {editor?.isActive('image') && (
              <div className="ribbon-group">
                <div className="ribbon-group-content">
                  <div className="ribbon-row">
                    <button
                      className={`ribbon-btn-icon ${editor.getAttributes('image').align === 'left' || !editor.getAttributes('image').align ? 'active' : ''}`}
                      onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
                      title="Align Picture Left"
                    >
                      <AlignLeft size={15} />
                    </button>
                    <button
                      className={`ribbon-btn-icon ${editor.getAttributes('image').align === 'center' ? 'active' : ''}`}
                      onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
                      title="Align Picture Center"
                    >
                      <AlignCenter size={15} />
                    </button>
                    <button
                      className={`ribbon-btn-icon ${editor.getAttributes('image').align === 'right' ? 'active' : ''}`}
                      onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
                      title="Align Picture Right"
                    >
                      <AlignRight size={15} />
                    </button>
                    <div className="ribbon-divider-v" />
                    <button
                      className={`ribbon-btn-horizontal-compact ${editor.getAttributes('image').wrap === 'square' || !editor.getAttributes('image').wrap ? 'active' : ''}`}
                      onClick={() => editor.chain().focus().updateAttributes('image', { wrap: 'square' }).run()}
                      title="Square Text Wrapping"
                    >
                      Wrap
                    </button>
                    <button
                      className={`ribbon-btn-horizontal-compact ${editor.getAttributes('image').wrap === 'inline' ? 'active' : ''}`}
                      onClick={() => editor.chain().focus().updateAttributes('image', { wrap: 'inline' }).run()}
                      title="Inline Picture"
                    >
                      Inline
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    <button className="ribbon-btn-horizontal-compact" onClick={onInsertImage} title="Insert Picture">
                      <ImageIcon size={14} className="icon-picture" /> <span>Picture</span>
                    </button>
                    <div className="ribbon-divider-v" />
                    <button className="ribbon-btn-sm-compact" onClick={() => onInsertShape('rect')} title="Rectangle">
                      <Square size={13} /> <span>Rect</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => onInsertShape('circle')} title="Oval Shape">
                      <Circle size={13} /> <span>Oval</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => onInsertShape('line')} title="Line Shape">
                      <Minus size={13} /> <span>Line</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => onInsertShape('arrow')} title="Arrow Shape">
                      <ArrowRight size={13} /> <span>Arrow</span>
                    </button>
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className="ribbon-btn-sm-compact" onClick={onInsertFootnote} title="Insert Footnote">
                      <Superscript size={13} className="icon-footnote" /> <span>Footnote</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={onInsertMergeField} title="Insert Mail Merge Field">
                      <Type size={13} /> <span>Merge Field</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={setLink} title="Insert Hyperlink">
                      <LinkIcon size={13} className="icon-link" /> <span>Link</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert 3x3 Table">
                      <TableIcon size={13} className="icon-table" /> <span>Table</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor && insertTableOfContents(editor)} title="Insert Table of Contents">
                      <BookOpen size={13} className="icon-toc" /> <span>TOC</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor?.chain().focus().insertPageBreak().run()} title="Insert Page Break">
                      <SeparatorHorizontal size={13} /> <span>Page Break</span>
                    </button>
                    <button
                      className="ribbon-btn-sm-compact"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .insertContent(` ${new Date().toLocaleDateString()} `)
                          .run()
                      }
                      title="Insert Current Date"
                    >
                      <Calendar size={13} className="icon-calendar" /> <span>Date</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'pageLayout' && (
          <>
            <div className="ribbon-group" style={{ borderRight: 'none' }}>
              <div className="ribbon-group-content">
                <button className="ribbon-btn-lg-compact" onClick={onOpenPageSetup} title="Page Margins & Setup">
                  <LayoutTemplate size={20} />
                  <span>Page Setup</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={onOpenHeaderFooter} title="Edit Header/Footer">
                  <FileType size={14} /> <span>Header/Footer</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={onOpenWatermark} title="Set Watermark">
                  <Stamp size={14} /> <span>Watermark</span>
                </button>
                <button className="ribbon-btn-horizontal-compact" onClick={() => editor?.chain().focus().insertPageBreak().run()} title="Insert Page Break">
                  <SeparatorHorizontal size={14} /> <span>Page Break</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'review' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    <button className={`ribbon-btn-horizontal-compact ${trackChangesEnabled ? 'active' : ''}`} onClick={onToggleTrackChanges} title="Track Changes">
                      <GitCompare size={14} /> <span>Track Changes</span>
                    </button>
                    <button className="ribbon-btn-horizontal-compact" onClick={onToggleComments} title="Document Comments">
                      <MessageSquare size={14} /> <span>Comments</span>
                    </button>
                    <button className={`ribbon-btn-horizontal-compact ${collabActive ? 'active' : ''}`} onClick={onOpenCollaboration} title="Start Collaboration">
                      <Share2 size={14} /> <span>Collaborate</span>
                    </button>
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor && acceptTrackChangeInSelection(editor)} title="Accept Selected Change">
                      <Check size={14} /> <span>Accept</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor && rejectTrackChangeInSelection(editor)} title="Reject Selected Change">
                      <X size={14} /> <span>Reject</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor && acceptAllTrackChanges(editor)} title="Accept All Changes">
                      <CheckCheck size={14} /> <span>Accept All</span>
                    </button>
                    <button className="ribbon-btn-sm-compact" onClick={() => editor && rejectAllTrackChanges(editor)} title="Reject All Changes">
                      <XCircle size={14} /> <span>Reject All</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'view' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-content">
                <div className="ribbon-column">
                  <div className="ribbon-row">
                    <button className="ribbon-btn-horizontal-compact" onClick={onToggleNavigation} title="Toggle Navigation Panel">
                      <PanelLeft size={14} /> <span>Navigation</span>
                    </button>
                    <button className={`ribbon-btn-horizontal-compact ${focusMode ? 'active' : ''}`} onClick={onToggleFocusMode} title="Toggle Focus Mode">
                      <Maximize2 size={14} /> <span>Focus Mode</span>
                    </button>
                  </div>
                  <div className="ribbon-row" style={{ marginTop: '2px' }}>
                    <button className="ribbon-btn-horizontal-compact" onClick={onPrint} title="Print Document">
                      <Printer size={14} /> <span>Print</span>
                    </button>
                    <button className="ribbon-btn-horizontal-compact" onClick={onExportPdf} title="Export as PDF">
                      <FileDown size={14} /> <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
