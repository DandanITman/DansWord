import { useCallback, useEffect, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { ImageWrap } from '../extensions/ResizableImage';

type Align = 'left' | 'center' | 'right';

const WRAP_OPTIONS: { id: ImageWrap; label: string }[] = [
  { id: 'inline', label: 'Inline' },
  { id: 'square', label: 'Square' },
  { id: 'tight', label: 'Tight' },
  { id: 'through', label: 'Through' },
  { id: 'topBottom', label: 'Top/Bottom' },
];

export function ImageBlockView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const { src, alt, width, align = 'left' as Align, wrap = 'square' as ImageWrap, offsetX = 0, offsetY = 0 } =
    node.attrs as {
      src: string;
      alt?: string;
      width?: number | null;
      align?: Align;
      wrap?: ImageWrap;
      offsetX?: number;
      offsetY?: number;
    };

  const commitWidth = useCallback(
    (nextWidth: number) => {
      updateAttributes({ width: Math.max(80, Math.round(nextWidth)) });
    },
    [updateAttributes],
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        editor.chain().focus().deleteSelection().run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, selected]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const startX = e.clientX;
    const startWidth = img.offsetWidth;

    const onMove = (ev: MouseEvent) => {
      commitWidth(startWidth + ev.clientX - startX);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOrigin.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };

    const onMove = (ev: MouseEvent) => {
      if (!dragOrigin.current) return;
      const dx = ev.clientX - dragOrigin.current.x;
      const dy = ev.clientY - dragOrigin.current.y;
      updateAttributes({
        offsetX: Math.round(dragOrigin.current.ox + dx),
        offsetY: Math.round(dragOrigin.current.oy + dy),
      });
    };
    const onUp = () => {
      dragOrigin.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <NodeViewWrapper
      className={`image-block align-${align} wrap-${wrap}${selected ? ' is-selected' : ''}`}
      data-align={align}
      data-wrap={wrap}
      style={
        wrap === 'square' || wrap === 'tight' || wrap === 'through'
          ? { marginLeft: offsetX, marginTop: offsetY }
          : { transform: `translate(${offsetX}px, ${offsetY}px)` }
      }
      onClick={() => {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.chain().focus().setNodeSelection(pos).run();
        }
      }}
    >
      <div className="image-block-inner">
        {selected && (
          <div className="image-drag-handle" onMouseDown={startDrag} title="Drag to move">
            ⋮⋮
          </div>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ''}
          draggable={false}
          style={width ? { width: `${width}px` } : { maxWidth: '100%' }}
          onLoad={() => {
            if (!width && imgRef.current) {
              const natural = imgRef.current.naturalWidth;
              const max = 480;
              if (natural > max) commitWidth(max);
            }
          }}
        />
        {selected && (
          <>
            <div className="image-resize-handle se" onMouseDown={startResize} title="Drag to resize" />
            <div className="image-toolbar">
              <button
                type="button"
                className={align === 'left' ? 'active' : ''}
                onClick={() => updateAttributes({ align: 'left' })}
                title="Align left"
              >
                L
              </button>
              <button
                type="button"
                className={align === 'center' ? 'active' : ''}
                onClick={() => updateAttributes({ align: 'center' })}
                title="Align center"
              >
                C
              </button>
              <button
                type="button"
                className={align === 'right' ? 'active' : ''}
                onClick={() => updateAttributes({ align: 'right' })}
                title="Align right"
              >
                R
              </button>
              {WRAP_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={wrap === w.id ? 'active' : ''}
                  onClick={() => updateAttributes({ wrap: w.id })}
                  title={`Wrap: ${w.label}`}
                >
                  {w.label[0]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
