import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { mergeAttributes } from '@tiptap/core';
import { ImageBlockView } from '../components/ImageBlockView';

export type ImageWrap = 'inline' | 'square' | 'tight' | 'through' | 'topBottom';

export const ResizableImage = Image.extend({
  name: 'image',
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = (el as HTMLElement).getAttribute('width') ?? (el as HTMLElement).style.width;
          if (!w) return null;
          const n = parseInt(String(w), 10);
          return Number.isNaN(n) ? null : n;
        },
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width, style: `width:${attrs.width}px` } : {}),
      },
      height: {
        default: null,
        parseHTML: (el) => {
          const h = (el as HTMLElement).getAttribute('height');
          if (!h) return null;
          const n = parseInt(h, 10);
          return Number.isNaN(n) ? null : n;
        },
      },
      align: {
        default: 'left',
        parseHTML: (el) => (el as HTMLElement).dataset.align ?? 'left',
        renderHTML: (attrs) => ({ 'data-align': attrs.align }),
      },
      wrap: {
        default: 'square' as ImageWrap,
        parseHTML: (el) => (el as HTMLElement).dataset.wrap ?? 'square',
        renderHTML: (attrs) => ({ 'data-wrap': attrs.wrap }),
      },
      offsetX: {
        default: 0,
        parseHTML: (el) => Number((el as HTMLElement).dataset.offsetX ?? 0),
        renderHTML: (attrs) => ({ 'data-offset-x': attrs.offsetX }),
      },
      offsetY: {
        default: 0,
        parseHTML: (el) => Number((el as HTMLElement).dataset.offsetY ?? 0),
        renderHTML: (attrs) => ({ 'data-offset-y': attrs.offsetY }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'doc-image',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
}).configure({
  allowBase64: true,
  inline: false,
  HTMLAttributes: { class: 'doc-image' },
});
