import { Palette, Stamp, Type as TypeIcon, Square, AlignVerticalSpaceAround } from 'lucide-react';
import {
  PARAGRAPH_SPACING_PRESETS,
  STYLE_SETS,
  THEME_COLORS,
  THEME_FONTS,
} from '@dansword/core';
import { ColorPickerButton } from '../../components/ColorPickerButton';
import { SHADING_COLORS } from '../../constants/colorSwatches';
import {
  RibbonButton,
  RibbonGroup,
  RibbonMenuButton,
  RibbonMenuHeader,
  RibbonMenuItem,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps } from '../types';

export function DesignTab({ actions, flags }: RibbonTabProps) {
  return (
    <>
      <RibbonGroup label="Document Formatting">
        <div className="rb-styleset-gallery" data-testid="design-style-sets">
          {STYLE_SETS.map((set) => (
            <button
              key={set.id}
              type="button"
              className={`rb-styleset-tile${flags.styleSetId === set.id ? ' is-active' : ''}`}
              title={`${set.name} style set`}
              data-testid={`design-style-${set.id}`}
              onClick={() => actions.onApplyStyleSet(set.id)}
            >
              <span className="rb-styleset-heading">Title</span>
              <span className="rb-styleset-body">Heading 1</span>
              <span className="rb-styleset-name">{set.name}</span>
            </button>
          ))}
        </div>
        <RibbonStack>
          <RibbonMenuButton
            icon={<Palette size={14} />}
            label="Colors"
            title="Theme colours"
            testId="design-colors"
          >
            <RibbonMenuHeader label="Theme colours" />
            {THEME_COLORS.map((theme) => (
              <RibbonMenuItem
                key={theme.id}
                label={theme.name}
                checked={flags.themeColorId === theme.id}
                icon={
                  <span className="rb-theme-swatches">
                    {theme.accents.slice(0, 4).map((accent) => (
                      <span key={accent} style={{ background: accent }} />
                    ))}
                  </span>
                }
                onClick={() => actions.onApplyThemeColors(theme.id)}
              />
            ))}
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<TypeIcon size={14} />}
            label="Fonts"
            title="Theme fonts"
            testId="design-fonts"
          >
            <RibbonMenuHeader label="Theme fonts" />
            {THEME_FONTS.map((set) => (
              <RibbonMenuItem
                key={set.id}
                label={set.name}
                hint={`${set.heading} / ${set.body}`}
                checked={flags.themeFontId === set.id}
                onClick={() => actions.onApplyThemeFonts(set.id)}
              />
            ))}
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<AlignVerticalSpaceAround size={14} />}
            label="Paragraph Spacing"
            title="Paragraph spacing"
            testId="design-paragraph-spacing"
          >
            <RibbonMenuHeader label="Built-in" />
            {PARAGRAPH_SPACING_PRESETS.map((preset) => (
              <RibbonMenuItem
                key={preset.id}
                label={preset.name}
                hint={`After ${preset.after}px · Line ${preset.lineHeight}`}
                onClick={() => actions.onApplyParagraphSpacing(preset.id)}
              />
            ))}
          </RibbonMenuButton>
          <RibbonButton
            icon={<span className="rb-glyph">✓</span>}
            label="Set as Default"
            title="Use this formatting for new documents"
            onClick={actions.onSetAsDefaultFormatting}
            testId="design-set-default"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Page Background">
        <RibbonStack>
          <RibbonButton
            icon={<Stamp size={20} />}
            label="Watermark"
            title="Watermark"
            size="large"
            active={flags.watermarkEnabled}
            onClick={actions.onOpenWatermark}
            testId="design-watermark"
          />
        </RibbonStack>
        <RibbonStack>
          <ColorPickerButton
            title="Page Color"
            colors={SHADING_COLORS}
            value={flags.pageSetup.pageColor}
            className="rb-btn rb-btn--small"
            onSelect={actions.onSetPageColor}
          >
            <Palette size={14} />
            <span className="rb-btn-label">Page Color</span>
          </ColorPickerButton>
          <RibbonButton
            icon={<Square size={14} />}
            label="Page Borders"
            title="Page borders"
            active={flags.pageSetup.border.style !== 'none'}
            onClick={actions.onOpenPageBorders}
            testId="design-page-borders"
          />
        </RibbonStack>
      </RibbonGroup>
    </>
  );
}
