import {
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  BookOpen,
  SeparatorHorizontal,
  Calendar,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Rows3,
  Columns3,
  Trash2,
  Combine,
  Split,
  Table2,
} from 'lucide-react';
import { insertTableOfContents } from '../../utils/headings';
import { promptForLink } from '../../utils/hyperlink';
import type { RibbonTabProps } from '../types';

const IMAGE_WRAPS = [
  { value: 'inline', label: 'Inline' },
  { value: 'square', label: 'Square' },
  { value: 'tight', label: 'Tight' },
  { value: 'through', label: 'Through' },
  { value: 'topBottom', label: 'Top/Bottom' },
] as const;

export function InsertTab({ editor, state, actions }: RibbonTabProps) {
  const setLink = () => {
    if (editor) void promptForLink(editor);
  };

  return (
    <>
      {/* Contextual picture tools. This group is gated on the image selection,
          which only updates now that ribbon state tracks every transaction. */}
      {state.imageActive && (
        <div className="ribbon-group" data-testid="ribbon-picture-tools">
          <div className="ribbon-group-content">
            <div className="ribbon-row">
              {(
                [
                  ['left', AlignLeft, 'Align Picture Left'],
                  ['center', AlignCenter, 'Align Picture Center'],
                  ['right', AlignRight, 'Align Picture Right'],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  className={`ribbon-btn-icon ${state.imageAlign === value ? 'active' : ''}`}
                  onClick={() => editor?.chain().focus().updateAttributes('image', { align: value }).run()}
                  title={label}
                >
                  <Icon size={15} />
                </button>
              ))}
              <div className="ribbon-divider-v" />
              {/* All five wrap modes the image node view supports; the ribbon
                  previously exposed only two, orphaning the rest. */}
              {IMAGE_WRAPS.map((wrap) => (
                <button
                  key={wrap.value}
                  className={`ribbon-btn-sm-compact ${state.imageWrap === wrap.value ? 'active' : ''}`}
                  onClick={() => editor?.chain().focus().updateAttributes('image', { wrap: wrap.value }).run()}
                  title={`${wrap.label} text wrapping`}
                >
                  {wrap.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contextual table tools — the app previously had no way at all to edit
          a table's structure once it had been inserted. */}
      {state.inTable && (
        <div className="ribbon-group" data-testid="ribbon-table-tools">
          <div className="ribbon-group-content">
            <div className="ribbon-column">
              <div className="ribbon-row">
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().addRowBefore().run()}
                  title="Insert row above"
                  data-testid="table-add-row-before"
                >
                  <Rows3 size={13} /> <span>Row ↑</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().addRowAfter().run()}
                  title="Insert row below"
                  data-testid="table-add-row-after"
                >
                  <Rows3 size={13} /> <span>Row ↓</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().deleteRow().run()}
                  title="Delete row"
                  data-testid="table-delete-row"
                >
                  <Trash2 size={13} /> <span>Row</span>
                </button>
                <div className="ribbon-divider-v" />
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().addColumnBefore().run()}
                  title="Insert column left"
                  data-testid="table-add-col-before"
                >
                  <Columns3 size={13} /> <span>Col ←</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().addColumnAfter().run()}
                  title="Insert column right"
                  data-testid="table-add-col-after"
                >
                  <Columns3 size={13} /> <span>Col →</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().deleteColumn().run()}
                  title="Delete column"
                  data-testid="table-delete-col"
                >
                  <Trash2 size={13} /> <span>Col</span>
                </button>
              </div>
              <div className="ribbon-row" style={{ marginTop: '2px' }}>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().mergeCells().run()}
                  title="Merge selected cells"
                  data-testid="table-merge-cells"
                >
                  <Combine size={13} /> <span>Merge</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().splitCell().run()}
                  title="Split cell"
                  data-testid="table-split-cell"
                >
                  <Split size={13} /> <span>Split</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
                  title="Toggle header row"
                  data-testid="table-toggle-header"
                >
                  <Table2 size={13} /> <span>Header</span>
                </button>
                <button
                  className="ribbon-btn-sm-compact"
                  onClick={() => editor?.chain().focus().deleteTable().run()}
                  title="Delete table"
                  data-testid="table-delete"
                >
                  <Trash2 size={13} /> <span>Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <div className="ribbon-row">
              <button
                className="ribbon-btn-horizontal-compact"
                onClick={actions.onInsertImage}
                title="Insert Picture"
              >
                <ImageIcon size={14} className="icon-picture" /> <span>Picture</span>
              </button>
              <div className="ribbon-divider-v" />
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => actions.onInsertShape('rect')}
                title="Rectangle"
              >
                <Square size={13} /> <span>Rect</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => actions.onInsertShape('circle')}
                title="Oval Shape"
              >
                <Circle size={13} /> <span>Oval</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => actions.onInsertShape('line')}
                title="Line Shape"
              >
                <Minus size={13} /> <span>Line</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => actions.onInsertShape('arrow')}
                title="Arrow Shape"
              >
                <ArrowRight size={13} /> <span>Arrow</span>
              </button>
            </div>
            <div className="ribbon-row" style={{ marginTop: '2px' }}>
              <button
                className="ribbon-btn-sm-compact"
                onClick={actions.onInsertFootnote}
                title="Insert Footnote"
                data-testid="ribbon-footnote"
              >
                <Superscript size={13} className="icon-footnote" /> <span>Footnote</span>
              </button>
              <button
                className={`ribbon-btn-sm-compact ${state.link ? 'active' : ''}`}
                onClick={setLink}
                title="Insert Hyperlink"
                data-testid="ribbon-link"
              >
                <LinkIcon size={13} className="icon-link" /> <span>Link</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() =>
                  editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
                title="Insert 3x3 Table"
                data-testid="ribbon-table"
              >
                <TableIcon size={13} className="icon-table" /> <span>Table</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && insertTableOfContents(editor)}
                title="Insert Table of Contents"
                data-testid="ribbon-toc"
              >
                <BookOpen size={13} className="icon-toc" /> <span>TOC</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor?.chain().focus().insertPageBreak().run()}
                title="Insert Page Break"
                data-testid="ribbon-page-break"
              >
                <SeparatorHorizontal size={13} /> <span>Page Break</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() =>
                  editor?.chain().focus().insertContent(` ${new Date().toLocaleDateString()} `).run()
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
  );
}
