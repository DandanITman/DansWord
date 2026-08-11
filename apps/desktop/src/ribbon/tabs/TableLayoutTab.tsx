import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownAZ,
  Combine,
  Columns3,
  Grid3x3,
  Rows3,
  Settings2,
  Split,
  Table2,
  Trash2,
} from 'lucide-react';
import { CellSelection, selectedRect } from '@tiptap/pm/tables';
import { ColorPickerButton } from '../../components/ColorPickerButton';
import { SHADING_COLORS } from '../../constants/colorSwatches';
import { TABLE_STYLES } from '../../extensions/TableFormatting';
import {
  RibbonButton,
  RibbonGroup,
  RibbonLine,
  RibbonMenuButton,
  RibbonMenuItem,
  RibbonMenuSeparator,
  RibbonSpin,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps } from '../types';

/**
 * Word splits table tools across "Table Design" and "Table Layout". Both fit in
 * one contextual tab here, in Word's group order, so the whole set is reachable
 * without a second tab switch.
 */
export function TableLayoutTab({ editor, state, actions }: RibbonTabProps) {
  const chain = () => editor?.chain().focus();

  /**
   * Word's Select menu scopes to the table part, never the document. Going
   * through prosemirror-tables' own rect keeps "Select Table" from becoming
   * Select All, which would let the next keystroke wipe the document.
   */
  const selectTablePart = (part: 'row' | 'column' | 'table') => {
    if (!editor) return;
    const { state: pmState } = editor.view;
    const rect = selectedRect(pmState);
    if (!rect) return;
    const anchorCell =
      part === 'row' ? rect.map.map[rect.top * rect.map.width]
      : part === 'column' ? rect.map.map[rect.left]
      : rect.map.map[0];
    const headCell =
      part === 'row' ? rect.map.map[rect.top * rect.map.width + rect.map.width - 1]
      : part === 'column' ? rect.map.map[(rect.map.height - 1) * rect.map.width + rect.left]
      : rect.map.map[rect.map.width * rect.map.height - 1];
    const tr = pmState.tr.setSelection(
      CellSelection.create(pmState.doc, rect.tableStart + anchorCell, rect.tableStart + headCell),
    );
    editor.view.dispatch(tr);
    editor.view.focus();
  };

  /** CSS px are 1/96in, and the boxes read in inches as Word's do. */
  const PPI = 96;
  const pxToIn = (px: number) => Math.round((px / PPI) * 100) / 100;
  const inToPx = (inches: number) => Math.round(inches * PPI);

  /**
   * The caret's cell size, measured off the rendered table rather than the
   * attributes: a column that has never been resized carries no `colwidth`,
   * and Word still shows its real width.
   */
  const cellSize = (() => {
    const cell = editor?.view.dom.querySelector('td.selectedCell, th.selectedCell')
      ?? (() => {
        const { from } = editor?.state.selection ?? { from: 0 };
        const dom = editor ? (editor.view.domAtPos(from).node as HTMLElement) : null;
        return dom?.nodeType === 1 ? dom.closest('td, th') : dom?.parentElement?.closest('td, th');
      })();
    const box = (cell as HTMLElement | null)?.getBoundingClientRect();
    const row = (cell as HTMLElement | null)?.closest('tr')?.getBoundingClientRect();
    return { width: box?.width ?? 0, height: row?.height ?? 0 };
  })();

  /** Applies a width to every cell in the caret's column. */
  const setColumnWidth = (px: number) => {
    if (!editor) return;
    const rect = selectedRect(editor.view.state);
    if (!rect) return;
    const { tr } = editor.view.state;
    for (let row = 0; row < rect.map.height; row += 1) {
      const cellPos = rect.map.map[row * rect.map.width + rect.left];
      const pos = rect.tableStart + cellPos;
      const node = tr.doc.nodeAt(pos);
      if (node) tr.setNodeMarkup(pos, undefined, { ...node.attrs, colwidth: [px] });
    }
    editor.view.dispatch(tr);
  };

  /** Applies a height to the caret's row, the attribute the drag resizer writes. */
  const setRowHeight = (px: number) => {
    if (!editor) return;
    const rect = selectedRect(editor.view.state);
    if (!rect) return;
    const { tr } = editor.view.state;
    const rowPos = rect.tableStart + rect.map.map[rect.top * rect.map.width] - 1;
    const row = tr.doc.nodeAt(rowPos);
    if (row?.type.name === 'tableRow') {
      tr.setNodeMarkup(rowPos, undefined, { ...row.attrs, height: px || null });
      editor.view.dispatch(tr);
    }
  };

  /** Strips explicit widths so the browser lays the table out on content. */
  const clearWidths = () => {
    if (!editor) return;
    const rect = selectedRect(editor.view.state);
    if (!rect) return;
    const { tr } = editor.view.state;
    for (const cellPos of rect.map.map) {
      const pos = rect.tableStart + cellPos;
      const node = tr.doc.nodeAt(pos);
      if (node) tr.setNodeMarkup(pos, undefined, { ...node.attrs, colwidth: null });
    }
    editor.view.dispatch(tr);
  };

  const distributeColumns = () => {
    if (!editor) return;
    const rect = selectedRect(editor.view.state);
    if (!rect) return;
    const table = editor.view.dom.querySelector('table');
    const total = table?.getBoundingClientRect().width ?? 0;
    if (!total) return;
    const each = Math.floor(total / rect.map.width);
    const { tr } = editor.view.state;
    for (const cellPos of rect.map.map) {
      const pos = rect.tableStart + cellPos;
      const node = tr.doc.nodeAt(pos);
      if (node) tr.setNodeMarkup(pos, undefined, { ...node.attrs, colwidth: [each] });
    }
    editor.view.dispatch(tr);
  };

  const distributeRows = () => {
    if (!editor) return;
    const rect = selectedRect(editor.view.state);
    if (!rect) return;
    const rows = editor.view.dom.querySelectorAll('table tr');
    const tallest = Math.max(
      0,
      ...[...rows].map((row) => (row as HTMLElement).getBoundingClientRect().height),
    );
    if (!tallest) return;
    const { tr } = editor.view.state;
    const seen = new Set<number>();
    for (let row = 0; row < rect.map.height; row += 1) {
      const rowPos = rect.tableStart + rect.map.map[row * rect.map.width] - 1;
      if (seen.has(rowPos)) continue;
      seen.add(rowPos);
      const node = tr.doc.nodeAt(rowPos);
      if (node?.type.name === 'tableRow') {
        tr.setNodeMarkup(rowPos, undefined, { ...node.attrs, height: Math.round(tallest) });
      }
    }
    editor.view.dispatch(tr);
  };

  return (
    <>
      <RibbonGroup label="Table">
        <RibbonStack>
          <RibbonMenuButton
            icon={<Table2 size={14} />}
            label="Select"
            title="Select part of the table"
            testId="table-select"
          >
            <RibbonMenuItem label="Select Cell" onClick={() => chain()?.selectParentNode().run()} />
            <RibbonMenuItem label="Select Column" onClick={() => selectTablePart('column')} />
            <RibbonMenuItem label="Select Row" onClick={() => selectTablePart('row')} />
            <RibbonMenuItem label="Select Table" onClick={() => selectTablePart('table')} />
          </RibbonMenuButton>
          <RibbonButton
            icon={<Settings2 size={14} />}
            label="Properties"
            title="Table properties"
            onClick={actions.onOpenTableProperties}
            testId="table-properties"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Rows &amp; Columns">
        <RibbonStack>
          <RibbonLine>
            <RibbonButton
              icon={<Rows3 size={14} />}
              label="Insert Above"
              title="Insert a row above"
              onClick={() => chain()?.addRowBefore().run()}
              testId="table-add-row-before"
            />
            <RibbonButton
              icon={<Rows3 size={14} />}
              label="Insert Below"
              title="Insert a row below"
              onClick={() => chain()?.addRowAfter().run()}
              testId="table-add-row-after"
            />
          </RibbonLine>
          <RibbonLine>
            <RibbonButton
              icon={<Columns3 size={14} />}
              label="Insert Left"
              title="Insert a column to the left"
              onClick={() => chain()?.addColumnBefore().run()}
              testId="table-add-col-before"
            />
            <RibbonButton
              icon={<Columns3 size={14} />}
              label="Insert Right"
              title="Insert a column to the right"
              onClick={() => chain()?.addColumnAfter().run()}
              testId="table-add-col-after"
            />
          </RibbonLine>
        </RibbonStack>
        <RibbonStack>
          <RibbonMenuButton
            icon={<Trash2 size={20} />}
            label="Delete"
            title="Delete rows, columns or the whole table"
            size="large"
            testId="table-delete-menu"
          >
            <RibbonMenuItem
              label="Delete Row"
              onClick={() => chain()?.deleteRow().run()}
              testId="table-delete-row"
            />
            <RibbonMenuItem
              label="Delete Column"
              onClick={() => chain()?.deleteColumn().run()}
              testId="table-delete-col"
            />
            <RibbonMenuSeparator />
            <RibbonMenuItem
              label="Delete Table"
              onClick={() => chain()?.deleteTable().run()}
              testId="table-delete"
            />
          </RibbonMenuButton>
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Merge">
        <RibbonStack>
          <RibbonButton
            icon={<Combine size={14} />}
            label="Merge Cells"
            title="Merge the selected cells"
            onClick={() => chain()?.mergeCells().run()}
            testId="table-merge-cells"
          />
          <RibbonButton
            icon={<Split size={14} />}
            label="Split Cells"
            title="Split the current cell"
            onClick={() => chain()?.splitCell().run()}
            testId="table-split-cell"
          />
        </RibbonStack>
      </RibbonGroup>

      {/* Word's Cell Size group. There was no way to give a column a specific
          width at all — only "Fix Columns", which resets them. Widths and
          heights are the attributes the drag resizers already write, so the
          boxes and the drag agree. */}
      <RibbonGroup label="Cell Size">
        <RibbonStack>
          <RibbonSpin
            label="Row height"
            value={pxToIn(cellSize.height)}
            step={0.1}
            min={0}
            max={22}
            suffix='"'
            testId="table-row-height"
            onChange={(value) => setRowHeight(inToPx(value))}
          />
          <RibbonSpin
            label="Column width"
            value={pxToIn(cellSize.width)}
            step={0.1}
            min={0}
            max={22}
            suffix='"'
            testId="table-column-width"
            onChange={(value) => setColumnWidth(inToPx(value))}
          />
        </RibbonStack>
        <RibbonStack>
          <RibbonButton
            icon={<Columns3 size={14} />}
            label="Distribute Columns"
            title="Give every column the same width"
            onClick={distributeColumns}
            testId="table-distribute-columns"
          />
          <RibbonButton
            icon={<Rows3 size={14} />}
            label="Distribute Rows"
            title="Give every row the same height"
            onClick={distributeRows}
            testId="table-distribute-rows"
          />
          <RibbonMenuButton
            icon={<Grid3x3 size={14} />}
            label="AutoFit"
            title="Fit the table to its contents or the window"
            testId="table-autofit"
          >
            <RibbonMenuItem
              label="AutoFit Contents"
              onClick={() => {
                clearWidths();
                chain()?.fixTables().run();
              }}
              testId="table-autofit-contents"
            />
            <RibbonMenuItem
              label="AutoFit Window"
              onClick={distributeColumns}
              testId="table-autofit-window"
            />
            <RibbonMenuItem
              label="Fixed Column Width"
              onClick={() => setColumnWidth(cellSize.width || 120)}
              testId="table-autofit-fixed"
            />
          </RibbonMenuButton>
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Alignment">
        <RibbonStack>
          <RibbonLine>
            {(
              [
                ['left', AlignLeft, 'Align cell text left'],
                ['center', AlignCenter, 'Centre cell text'],
                ['right', AlignRight, 'Align cell text right'],
              ] as const
            ).map(([value, Icon, title]) => (
              <RibbonButton
                key={value}
                icon={<Icon size={15} />}
                title={title}
                size="icon"
                active={state.align === value}
                onClick={() => chain()?.setTextAlign(value).run()}
                testId={`table-align-${value}`}
              />
            ))}
          </RibbonLine>
          <RibbonButton
            icon={<Table2 size={14} />}
            label="Header Row"
            title="Toggle the header row"
            active={state.tableHeaderRow}
            onClick={() => chain()?.toggleHeaderRow().run()}
            testId="table-toggle-header"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Data">
        <RibbonStack>
          <RibbonMenuButton
            icon={<ArrowDownAZ size={14} />}
            label="Sort"
            title="Sort the paragraphs or rows"
            testId="table-sort"
          >
            <RibbonMenuItem label="Ascending (A to Z)" onClick={() => actions.onSortParagraphs('asc')} />
            <RibbonMenuItem label="Descending (Z to A)" onClick={() => actions.onSortParagraphs('desc')} />
          </RibbonMenuButton>
          <RibbonButton
            icon={<Grid3x3 size={14} />}
            label="Fix Columns"
            title="Reset the column widths"
            onClick={() => chain()?.fixTables().run()}
            testId="table-fix-columns"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Table Styles">
        <RibbonLine>
          {TABLE_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`rb-table-style-tile style-${style.id}${
                state.tableStyle === style.id ? ' is-active' : ''
              }`}
              title={style.label}
              aria-label={style.label}
              data-testid={`table-style-${style.id}`}
              onClick={() => chain()?.setTableStyle(style.id).run()}
            >
              <span />
              <span />
              <span />
            </button>
          ))}
          <ColorPickerButton
            title="Cell Shading"
            colors={SHADING_COLORS}
            className="rb-btn rb-btn--small"
            onSelect={(color) => chain()?.setCellShading(color).run()}
          >
            <span className="rb-glyph">▨</span>
            <span className="rb-btn-label">Shading</span>
          </ColorPickerButton>
        </RibbonLine>
      </RibbonGroup>
    </>
  );
}
