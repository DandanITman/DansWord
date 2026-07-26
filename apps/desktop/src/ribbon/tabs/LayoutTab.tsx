import {
  AlignCenterHorizontal,
  Columns3,
  FlipVertical,
  Hash,
  LayoutTemplate,
  Minus,
  MoveHorizontal,
  RectangleHorizontal,
  RectangleVertical,
  RotateCw,
  SeparatorHorizontal,
} from 'lucide-react';
import {
  MARGIN_PRESETS,
  MARGIN_PRESET_HINTS,
  PAGE_SIZE_LABELS,
  type PageSizePreset,
} from '@dansword/core';
import { IMAGE_WRAPS } from '../../extensions/ResizableImage';
import {
  RibbonButton,
  RibbonGroup,
  RibbonMenuButton,
  RibbonMenuHeader,
  RibbonMenuItem,
  RibbonMenuSeparator,
  RibbonSpin,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps } from '../types';

/** Pixels per inch, so the spin boxes can show inches like Word does. */
const PPI = 96;

export function LayoutTab({ editor, state, actions, flags }: RibbonTabProps) {
  const { pageSetup } = flags;
  const objectSelected = state.imageActive || state.shapeActive || state.textBoxActive;

  return (
    <>
      <RibbonGroup label="Page Setup" onLaunch={actions.onOpenPageSetup} launchTitle="Page Setup dialog">
        <RibbonStack>
          <RibbonMenuButton
            icon={<LayoutTemplate size={20} />}
            label="Margins"
            title="Margins"
            size="large"
            testId="layout-margins"
            menuWidth={240}
          >
            <RibbonMenuHeader label="Margins" />
            {Object.keys(MARGIN_PRESETS).map((preset) => (
              <RibbonMenuItem
                key={preset}
                label={preset}
                hint={MARGIN_PRESET_HINTS[preset]?.replace('\n', '  ')}
                onClick={() => actions.onApplyMarginPreset(preset)}
                testId={`layout-margin-${preset.toLowerCase()}`}
              />
            ))}
            <RibbonMenuSeparator />
            <RibbonMenuItem label="Custom Margins…" onClick={actions.onOpenPageSetup} />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<RectangleVertical size={20} />}
            label="Orientation"
            title="Orientation"
            size="large"
            testId="layout-orientation"
          >
            <RibbonMenuItem
              icon={<RectangleVertical size={13} />}
              label="Portrait"
              checked={pageSetup.orientation === 'portrait'}
              onClick={() => actions.onSetOrientation('portrait')}
            />
            <RibbonMenuItem
              icon={<RectangleHorizontal size={13} />}
              label="Landscape"
              checked={pageSetup.orientation === 'landscape'}
              onClick={() => actions.onSetOrientation('landscape')}
            />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<RectangleHorizontal size={20} />}
            label="Size"
            title="Page size"
            size="large"
            testId="layout-size"
            menuWidth={230}
          >
            <RibbonMenuHeader label="Page size" />
            {(Object.keys(PAGE_SIZE_LABELS) as PageSizePreset[]).map((size) => (
              <RibbonMenuItem
                key={size}
                label={PAGE_SIZE_LABELS[size]}
                checked={pageSetup.size === size}
                onClick={() => actions.onSetPageSize(size)}
                testId={`layout-size-${size}`}
              />
            ))}
            <RibbonMenuSeparator />
            <RibbonMenuItem label="More Paper Sizes…" onClick={actions.onOpenPageSetup} />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<Columns3 size={20} />}
            label="Columns"
            title="Columns"
            size="large"
            testId="layout-columns"
          >
            <RibbonMenuItem label="One" checked={pageSetup.columns.count === 1} onClick={() => actions.onSetColumns(1)} />
            <RibbonMenuItem label="Two" checked={pageSetup.columns.count === 2} onClick={() => actions.onSetColumns(2)} />
            <RibbonMenuItem label="Three" checked={pageSetup.columns.count === 3} onClick={() => actions.onSetColumns(3)} />
            <RibbonMenuSeparator />
            <RibbonMenuItem label="More Columns…" onClick={actions.onOpenColumnsDialog} />
          </RibbonMenuButton>
        </RibbonStack>
        <RibbonStack>
          <RibbonMenuButton
            icon={<SeparatorHorizontal size={14} />}
            label="Breaks"
            title="Breaks"
            testId="layout-breaks"
          >
            <RibbonMenuHeader label="Page breaks" />
            <RibbonMenuItem
              label="Page"
              hint="Ctrl+Enter"
              onClick={() => editor?.chain().focus().insertPageBreak().run()}
            />
            <RibbonMenuItem
              label="Column"
              onClick={() => editor?.chain().focus().insertPageBreak().run()}
            />
            <RibbonMenuSeparator />
            <RibbonMenuItem
              label="Text Wrapping"
              onClick={() => editor?.chain().focus().setHardBreak().run()}
            />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<Hash size={14} />}
            label="Line Numbers"
            title="Line numbers"
            active={pageSetup.lineNumbers !== 'none'}
            testId="layout-line-numbers"
          >
            <RibbonMenuItem
              label="None"
              checked={pageSetup.lineNumbers === 'none'}
              onClick={() => actions.onSetLineNumbers('none')}
            />
            <RibbonMenuItem
              label="Continuous"
              checked={pageSetup.lineNumbers === 'continuous'}
              onClick={() => actions.onSetLineNumbers('continuous')}
            />
            <RibbonMenuItem
              label="Restart Each Page"
              checked={pageSetup.lineNumbers === 'restartEachPage'}
              onClick={() => actions.onSetLineNumbers('restartEachPage')}
            />
          </RibbonMenuButton>
          <RibbonButton
            icon={<Minus size={14} />}
            label="Hyphenation"
            title="Break words across lines to even out the right margin"
            active={pageSetup.hyphenation}
            onClick={actions.onToggleHyphenation}
            testId="layout-hyphenation"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup
        label="Paragraph"
        onLaunch={actions.onOpenParagraphDialog}
        launchTitle="Paragraph dialog"
      >
        <RibbonStack>
          <RibbonSpin
            label="Indent left"
            value={(state.indentLevel * 36) / PPI}
            step={0.25}
            suffix='"'
            testId="layout-indent-left"
            onChange={(value) => {
              const level = Math.max(0, Math.round((value * PPI) / 36));
              const delta = level - state.indentLevel;
              const chain = editor?.chain().focus();
              if (!chain) return;
              for (let step = 0; step < Math.abs(delta); step += 1) {
                if (delta > 0) chain.increaseParagraphIndent();
                else chain.decreaseParagraphIndent();
              }
              chain.run();
            }}
          />
          <RibbonSpin
            label="Indent right"
            value={state.indentRight / PPI}
            step={0.25}
            suffix='"'
            testId="layout-indent-right"
            onChange={(value) => editor?.chain().focus().setRightIndent(Math.round(value * PPI)).run()}
          />
        </RibbonStack>
        <RibbonStack>
          <RibbonSpin
            label="Space before"
            value={state.spaceBefore}
            step={2}
            suffix="px"
            testId="layout-space-before"
            onChange={(value) =>
              editor?.chain().focus().setParagraphSpacing(value, state.spaceAfter).run()
            }
          />
          <RibbonSpin
            label="Space after"
            value={state.spaceAfter}
            step={2}
            suffix="px"
            testId="layout-space-after"
            onChange={(value) =>
              editor?.chain().focus().setParagraphSpacing(state.spaceBefore, value).run()
            }
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Arrange">
        <RibbonStack>
          <RibbonMenuButton
            icon={<MoveHorizontal size={14} />}
            label="Position"
            title="Position the selected object on the page"
            disabled={!objectSelected}
            testId="layout-position"
          >
            <RibbonMenuHeader label="With text wrapping" />
            {(
              [
                ['topLeft', 'Top Left'],
                ['topCenter', 'Top Centre'],
                ['topRight', 'Top Right'],
                ['middleLeft', 'Middle Left'],
                ['middleCenter', 'Middle Centre'],
                ['middleRight', 'Middle Right'],
                ['bottomLeft', 'Bottom Left'],
                ['bottomCenter', 'Bottom Centre'],
                ['bottomRight', 'Bottom Right'],
              ] as const
            ).map(([position, label]) => (
              <RibbonMenuItem
                key={position}
                label={label}
                onClick={() => editor?.chain().focus().setImagePosition(position).run()}
              />
            ))}
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<AlignCenterHorizontal size={14} />}
            label="Wrap Text"
            title="Wrap text around the selected object"
            disabled={!objectSelected}
            testId="layout-wrap-text"
            menuWidth={250}
          >
            {IMAGE_WRAPS.map((wrap) => (
              <RibbonMenuItem
                key={wrap.id}
                label={wrap.label}
                hint={wrap.hint}
                checked={state.imageWrap === wrap.id}
                onClick={() => editor?.chain().focus().setImageWrap(wrap.id).run()}
              />
            ))}
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<FlipVertical size={14} />}
            label="Align"
            title="Align the selected object"
            disabled={!objectSelected}
            testId="layout-align-object"
          >
            <RibbonMenuItem
              label="Align Left"
              checked={state.imageAlign === 'left'}
              onClick={() => editor?.chain().focus().setImageAlign('left').run()}
            />
            <RibbonMenuItem
              label="Align Centre"
              checked={state.imageAlign === 'center'}
              onClick={() => editor?.chain().focus().setImageAlign('center').run()}
            />
            <RibbonMenuItem
              label="Align Right"
              checked={state.imageAlign === 'right'}
              onClick={() => editor?.chain().focus().setImageAlign('right').run()}
            />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<RotateCw size={14} />}
            label="Rotate"
            title="Rotate the selected object"
            disabled={!state.imageActive}
            testId="layout-rotate"
          >
            <RibbonMenuItem label="Rotate Right 90°" onClick={() => editor?.chain().focus().rotateImage(90).run()} />
            <RibbonMenuItem label="Rotate Left 90°" onClick={() => editor?.chain().focus().rotateImage(-90).run()} />
            <RibbonMenuItem label="Flip Upside Down" onClick={() => editor?.chain().focus().rotateImage(180).run()} />
            <RibbonMenuSeparator />
            <RibbonMenuItem label="Reset Rotation" onClick={() => editor?.chain().focus().rotateImage(-state.imageRotation).run()} />
          </RibbonMenuButton>
        </RibbonStack>
      </RibbonGroup>
    </>
  );
}
