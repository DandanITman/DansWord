import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Contrast,
  Crop,
  Droplet,
  Eye,
  RotateCcw,
  RotateCw,
  Sun,
} from 'lucide-react';
import { ColorPickerButton } from '../../components/ColorPickerButton';
import { BORDER_COLORS } from '../../constants/colorSwatches';
import { IMAGE_FRAMES, IMAGE_WRAPS } from '../../extensions/ResizableImage';
import {
  RibbonButton,
  RibbonGroup,
  RibbonLine,
  RibbonMenuButton,
  RibbonMenuHeader,
  RibbonMenuItem,
  RibbonMenuSeparator,
  RibbonSpin,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps } from '../types';

/** Picture Format is contextual: it only renders while a picture is selected. */
export function PictureFormatTab({ editor, state, actions }: RibbonTabProps) {
  const update = (attrs: Record<string, unknown>) =>
    editor?.chain().focus().updateAttributes('image', attrs).run();

  /** Word sizes pictures in inches, not screen pixels; CSS px are 1/96in. */
  const PPI = 96;
  const pxToIn = (px: number) => Math.round((px / PPI) * 100) / 100;
  const inToPx = (inches: number) => Math.round(inches * PPI);

  const aspect =
    state.imageLockAspect && state.imageWidth && state.imageHeight
      ? state.imageWidth / state.imageHeight
      : null;

  return (
    <>
      <RibbonGroup label="Adjust">
        <RibbonStack>
          <RibbonMenuButton
            icon={<Sun size={14} />}
            label="Corrections"
            title="Brightness and contrast"
            testId="picture-corrections"
            menuWidth={230}
          >
            <RibbonMenuHeader label="Brightness" />
            <div className="rb-slider-row">
              <input
                type="range"
                min={20}
                max={180}
                value={state.imageBrightness}
                aria-label="Brightness"
                onChange={(event) => update({ brightness: Number(event.target.value) })}
              />
              <span>{state.imageBrightness}%</span>
            </div>
            <RibbonMenuHeader label="Contrast" />
            <div className="rb-slider-row">
              <input
                type="range"
                min={20}
                max={180}
                value={state.imageContrast}
                aria-label="Contrast"
                onChange={(event) => update({ contrast: Number(event.target.value) })}
              />
              <span>{state.imageContrast}%</span>
            </div>
            <RibbonMenuSeparator />
            <RibbonMenuItem
              label="Reset Corrections"
              onClick={() => update({ brightness: 100, contrast: 100 })}
            />
          </RibbonMenuButton>
          <RibbonMenuButton
            icon={<Droplet size={14} />}
            label="Color"
            title="Colour saturation"
            testId="picture-color"
            menuWidth={230}
          >
            <RibbonMenuHeader label="Saturation" />
            <div className="rb-slider-row">
              <input
                type="range"
                min={0}
                max={200}
                value={state.imageSaturation}
                aria-label="Saturation"
                onChange={(event) => update({ saturation: Number(event.target.value) })}
              />
              <span>{state.imageSaturation}%</span>
            </div>
            <RibbonMenuSeparator />
            <RibbonMenuItem label="Grayscale" onClick={() => update({ saturation: 0 })} />
            <RibbonMenuItem label="Full Colour" onClick={() => update({ saturation: 100 })} />
          </RibbonMenuButton>
          <RibbonButton
            icon={<RotateCcw size={14} />}
            label="Reset Picture"
            title="Undo every adjustment made to this picture"
            onClick={actions.onResetPicture}
            testId="picture-reset"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Picture Styles">
        <RibbonLine>
          {IMAGE_FRAMES.map((frameStyle) => (
            <button
              key={frameStyle.id}
              type="button"
              className={`rb-frame-tile frame-${frameStyle.id}${
                state.imageFrame === frameStyle.id ? ' is-active' : ''
              }`}
              title={frameStyle.label}
              aria-label={frameStyle.label}
              data-testid={`picture-frame-${frameStyle.id}`}
              onClick={() => update({ frame: frameStyle.id })}
            />
          ))}
          <ColorPickerButton
            title="Picture Border"
            colors={BORDER_COLORS}
            value={state.imageBorderColor}
            className="rb-btn rb-btn--small"
            onSelect={(color) => update({ borderColor: color, frame: color ? 'border' : 'none' })}
          >
            <span className="rb-glyph">▭</span>
            <span className="rb-btn-label">Picture Border</span>
          </ColorPickerButton>
        </RibbonLine>
      </RibbonGroup>

      <RibbonGroup label="Arrange">
        <RibbonStack>
          <RibbonMenuButton
            icon={<Eye size={14} />}
            label="Wrap Text"
            title="Wrap text around the picture"
            testId="picture-wrap-text"
            menuWidth={250}
          >
            {IMAGE_WRAPS.map((wrap) => (
              <RibbonMenuItem
                key={wrap.id}
                label={wrap.label}
                hint={wrap.hint}
                checked={state.imageWrap === wrap.id}
                onClick={() => editor?.chain().focus().setImageWrap(wrap.id).run()}
                testId={`picture-wrap-${wrap.id}`}
              />
            ))}
          </RibbonMenuButton>
          <RibbonLine>
            {(
              [
                ['left', AlignLeft, 'Align Left'],
                ['center', AlignCenter, 'Align Centre'],
                ['right', AlignRight, 'Align Right'],
              ] as const
            ).map(([value, Icon, label]) => (
              <RibbonButton
                key={value}
                icon={<Icon size={15} />}
                title={label}
                size="icon"
                active={state.imageAlign === value}
                onClick={() => editor?.chain().focus().setImageAlign(value).run()}
                testId={`picture-align-${value}`}
              />
            ))}
            <RibbonButton
              icon={<RotateCw size={15} />}
              title="Rotate right 90°"
              size="icon"
              onClick={() => editor?.chain().focus().rotateImage(90).run()}
              testId="picture-rotate-right"
            />
            <RibbonButton
              icon={<RotateCcw size={15} />}
              title="Rotate left 90°"
              size="icon"
              onClick={() => editor?.chain().focus().rotateImage(-90).run()}
              testId="picture-rotate-left"
            />
          </RibbonLine>
          <RibbonButton
            icon={<Contrast size={14} />}
            label="Position…"
            title="Size and position dialog"
            onClick={actions.onOpenPictureLayout}
            testId="picture-layout-dialog"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Size" onLaunch={actions.onOpenPictureLayout} launchTitle="Layout dialog">
        <RibbonStack>
          <RibbonSpin
            label="Height"
            value={pxToIn(state.imageHeight ?? 0)}
            step={0.1}
            max={22}
            suffix='"'
            testId="picture-height"
            onChange={(value) => {
              const height = Math.max(16, inToPx(value));
              update({
                height,
                ...(aspect && state.imageWidth ? { width: Math.round(height * aspect) } : {}),
              });
            }}
          />
          <RibbonSpin
            label="Width"
            value={pxToIn(state.imageWidth ?? 0)}
            step={0.1}
            max={22}
            suffix='"'
            testId="picture-width"
            onChange={(value) => {
              const width = Math.max(16, inToPx(value));
              update({
                width,
                ...(aspect && state.imageHeight ? { height: Math.round(width / aspect) } : {}),
              });
            }}
          />
        </RibbonStack>
        <RibbonStack>
          <RibbonButton
            icon={<Crop size={14} />}
            label="Fit to Column"
            title="Resize the picture to the text column width"
            onClick={() => update({ width: null, height: null })}
            testId="picture-fit-column"
          />
          <RibbonButton
            icon={<span className="rb-glyph">🔒</span>}
            label="Lock Aspect Ratio"
            title="Keep the proportions when resizing"
            active={state.imageLockAspect}
            onClick={() => update({ lockAspect: !state.imageLockAspect })}
            testId="picture-lock-aspect"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Accessibility">
        <RibbonButton
          icon={<span className="rb-glyph">Alt</span>}
          label="Alt Text"
          title="Describe the picture for screen readers"
          size="large"
          onClick={actions.onOpenAltText}
          testId="picture-alt-text"
        />
      </RibbonGroup>
    </>
  );
}
