import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Paintbrush,
  Highlighter,
  Eraser,
  Type,
  ClipboardPaste,
  Scissors,
  Copy,
  Search,
  Undo2,
  Redo2,
  CaseSensitive,
} from 'lucide-react';
import { BUILTIN_STYLES } from '@dansword/core';
import { ColorPickerButton } from '../../components/ColorPickerButton';
import {
  BORDER_COLORS,
  FONT_COLORS,
  HIGHLIGHT_COLORS,
  SHADING_COLORS,
} from '../../constants/colorSwatches';
import { applyDocumentStyle } from '../../utils/applyStyle';
import { copySelection, cutSelection, pasteFromClipboard } from '../../utils/clipboard';
import { uiPrompt } from '../../utils/uiPrompt';
import type { RibbonTabProps } from '../types';

const FONT_FAMILIES = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Courier New'];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36'];

export function EditTab({ editor, state, actions, flags }: RibbonTabProps) {
  const styleGallery = flags.customStyles.length ? flags.customStyles : BUILTIN_STYLES;

  const setParagraphSpacing = async () => {
    const before = await uiPrompt('Space before paragraph (px)', '0');
    if (before === null) return;
    const after = await uiPrompt('Space after paragraph (px)', '12');
    if (after === null) return;
    editor?.chain().focus().setParagraphSpacing(Number(before) || 0, Number(after) || 0).run();
  };

  const setLink = async () => {
    if (!editor) return;
    const url = await uiPrompt('Enter URL', state.linkHref || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const changeCase = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, ' ');
    const next = text === text.toUpperCase() ? text.toLowerCase() : text.toUpperCase();
    editor.chain().focus().insertContentAt({ from, to }, next).run();
  };

  return (
    <>
      {/* Clipboard */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-row">
            <button
              className="ribbon-btn-lg-compact"
              onClick={() => editor && void pasteFromClipboard(editor)}
              title="Paste"
              data-testid="ribbon-paste"
            >
              <ClipboardPaste size={20} className="icon-paste" />
              <span>Paste</span>
            </button>
            <div className="ribbon-column">
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && void cutSelection(editor)}
                title="Cut"
                data-testid="ribbon-cut"
              >
                <Scissors size={13} className="icon-cut" />
                <span>Cut</span>
              </button>
              <button
                className="ribbon-btn-sm-compact"
                onClick={() => editor && void copySelection(editor)}
                title="Copy"
                data-testid="ribbon-copy"
              >
                <Copy size={13} className="icon-copy" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Undo / redo */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <button
              className="ribbon-btn-sm-compact"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!state.canUndo}
              title="Undo (Ctrl+Z)"
              data-testid="ribbon-undo"
            >
              <Undo2 size={13} />
              <span>Undo</span>
            </button>
            <button
              className="ribbon-btn-sm-compact"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!state.canRedo}
              title="Redo (Ctrl+Y)"
              data-testid="ribbon-redo"
            >
              <Redo2 size={13} />
              <span>Redo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <div className="ribbon-row">
              <select
                className="ribbon-select font-family-select"
                value={state.fontFamily}
                onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <select
                className="ribbon-select ribbon-select-sm"
                data-testid="ribbon-font-size"
                value={state.fontSize}
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
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ColorPickerButton
                title="Font Color"
                colors={FONT_COLORS}
                value={state.color}
                className="ribbon-btn-icon"
                onSelect={(color) => {
                  if (!editor) return;
                  if (!color) editor.chain().focus().unsetColor().run();
                  else editor.chain().focus().setColor(color).run();
                }}
              >
                <Type size={15} className="icon-color" />
              </ColorPickerButton>
              <ColorPickerButton
                title="Highlight Text"
                colors={HIGHLIGHT_COLORS}
                value={state.highlight}
                className={`ribbon-btn-icon ${state.highlight ? 'active' : ''}`}
                onSelect={(color) => {
                  if (!editor) return;
                  if (!color) editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color }).run();
                }}
              >
                <Highlighter size={15} className="icon-highlight" />
              </ColorPickerButton>
              <button
                className="ribbon-btn-icon"
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .clearNodes()
                    .unsetAllMarks()
                    .clearParagraphFormatting()
                    .run()
                }
                title="Clear Formatting"
                data-testid="ribbon-clear-formatting"
              >
                <Eraser size={15} />
              </button>
              <button className="ribbon-btn-icon" onClick={changeCase} title="Change Case">
                <CaseSensitive size={15} />
              </button>
            </div>
            <div className="ribbon-row" style={{ marginTop: '2px' }}>
              <button
                className={`ribbon-btn-icon ${state.bold ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Bold"
                data-testid="ribbon-bold"
              >
                <Bold size={14} className="icon-bold" />
              </button>
              <button
                className={`ribbon-btn-icon ${state.italic ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Italic"
                data-testid="ribbon-italic"
              >
                <Italic size={14} className="icon-italic" />
              </button>
              <button
                className={`ribbon-btn-icon ${state.underline ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="Underline"
                data-testid="ribbon-underline"
              >
                <Underline size={14} className="icon-underline" />
              </button>
              <button
                className={`ribbon-btn-icon ${state.strike ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                title="Strikethrough"
                data-testid="ribbon-strike"
              >
                <Strikethrough size={14} />
              </button>
              <button
                className={`ribbon-btn-icon ${state.superscript ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                title="Superscript"
                data-testid="ribbon-superscript"
              >
                <Superscript size={14} />
              </button>
              <button
                className={`ribbon-btn-icon ${state.subscript ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleSubscript().run()}
                title="Subscript"
                data-testid="ribbon-subscript"
              >
                <Subscript size={14} />
              </button>
              <button
                className={`ribbon-btn-icon ${flags.formatPainterActive ? 'active' : ''}`}
                onClick={() =>
                  flags.formatPainterActive
                    ? actions.onFormatPainterApply()
                    : actions.onFormatPainterCopy()
                }
                title="Format Painter"
              >
                <Paintbrush size={14} className="icon-painter" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paragraph */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <div className="ribbon-row">
              {(
                [
                  ['left', AlignLeft, 'Align Left', 'ribbon-align-left'],
                  ['center', AlignCenter, 'Align Center', 'ribbon-align-center'],
                  ['right', AlignRight, 'Align Right', 'ribbon-align-right'],
                  ['justify', AlignJustify, 'Justify', 'ribbon-align-justify'],
                ] as const
              ).map(([value, Icon, label, testId]) => (
                <button
                  key={value}
                  className={`ribbon-btn-icon ${state.align === value ? 'active' : ''}`}
                  onClick={() => editor?.chain().focus().setTextAlign(value).run()}
                  title={label}
                  data-testid={testId}
                >
                  <Icon size={15} />
                </button>
              ))}
              <div className="ribbon-divider-v" />
              <select
                className="ribbon-select ribbon-select-sm"
                value={state.lineHeight}
                onChange={(e) => editor?.chain().focus().setLineSpacing(e.target.value).run()}
                title="Line spacing"
                data-testid="ribbon-line-spacing"
              >
                <option value="">Line</option>
                <option value="1">1.0</option>
                <option value="1.15">1.15</option>
                <option value="1.5">1.5</option>
                <option value="2">2.0</option>
              </select>
            </div>
            <div className="ribbon-row" style={{ marginTop: '2px' }}>
              <button
                className={`ribbon-btn-icon ${state.bulletList ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Bullets"
                data-testid="ribbon-bullet-list"
              >
                <List size={14} />
              </button>
              <button
                className={`ribbon-btn-icon ${state.orderedList ? 'active' : ''}`}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                title="Numbers"
                data-testid="ribbon-ordered-list"
              >
                <ListOrdered size={14} />
              </button>
              <button
                className="ribbon-btn-icon"
                onClick={() => editor?.chain().focus().decreaseParagraphIndent().run()}
                title="Decrease Indent"
                data-testid="ribbon-decrease-indent"
              >
                <AlignLeft size={14} style={{ transform: 'scaleX(-1)' }} />
              </button>
              <button
                className="ribbon-btn-icon"
                onClick={() => editor?.chain().focus().increaseParagraphIndent().run()}
                title="Increase Indent"
                data-testid="ribbon-increase-indent"
              >
                <AlignLeft size={14} />
              </button>
              <div className="ribbon-divider-v" />
              <button
                className="ribbon-btn-horizontal-compact"
                onClick={setParagraphSpacing}
                title="Spacing"
              >
                <span>Spacing</span>
              </button>
              <ColorPickerButton
                title="Paragraph Border"
                colors={BORDER_COLORS}
                value={state.borderColor}
                className="ribbon-btn-horizontal-compact"
                onSelect={(color) => editor?.chain().focus().setParagraphBorder(color).run()}
              >
                <span>Border</span>
              </ColorPickerButton>
              <ColorPickerButton
                title="Shading/Background"
                colors={SHADING_COLORS}
                value={state.shading}
                className="ribbon-btn-horizontal-compact"
                onSelect={(color) => editor?.chain().focus().setParagraphShading(color).run()}
              >
                <span>Shade</span>
              </ColorPickerButton>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <div className="ribbon-row">
              {styleGallery.slice(0, 3).map((style) => (
                <button
                  key={style.id}
                  className={`ribbon-btn-style-compact ${
                    style.headingLevel && state.headingLevel === style.headingLevel ? 'active' : ''
                  }`}
                  onClick={() => editor && applyDocumentStyle(editor, style)}
                  title={`Apply ${style.name}`}
                  data-testid={`edit-style-${style.id}`}
                >
                  {style.name}
                </button>
              ))}
            </div>
            <div className="ribbon-row" style={{ marginTop: '2px' }}>
              <button className="ribbon-btn-horizontal-compact" onClick={actions.onOpenStyleEditor}>
                <Type size={13} /> <span>More Styles</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editing */}
      <div className="ribbon-group" style={{ borderRight: 'none' }}>
        <div className="ribbon-group-content">
          <div className="ribbon-column">
            <button className="ribbon-btn-horizontal-compact" onClick={actions.onToggleFindReplace}>
              <Search size={14} /> <span>Find &amp; Replace</span>
            </button>
            <button
              className="ribbon-btn-horizontal-compact"
              onClick={() => editor?.chain().focus().selectAll().run()}
              data-testid="ribbon-select-all"
            >
              <span>Select All</span>
            </button>
            <button
              className={`ribbon-btn-horizontal-compact ${state.link ? 'active' : ''}`}
              onClick={setLink}
              title="Insert Hyperlink"
            >
              <span>Link</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
