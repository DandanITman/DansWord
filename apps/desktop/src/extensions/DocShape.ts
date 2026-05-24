import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ShapeBlockView } from '../components/ShapeBlockView';

export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow';

export const DocShape = Node.create({
  name: 'docShape',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      shapeType: { default: 'rect' as ShapeType },
      width: { default: 160 },
      height: { default: 100 },
      fill: { default: '#3b82f6' },
      stroke: { default: '#1e40af' },
      strokeWidth: { default: 2 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-doc-shape]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-doc-shape': 'true' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeBlockView);
  },

  addCommands() {
    return {
      insertShape:
        (attrs?: Partial<{ shapeType: ShapeType; width: number; height: number }>) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { shapeType: 'rect', width: 160, height: 100, ...attrs },
          }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docShape: {
      insertShape: (attrs?: Partial<{ shapeType: ShapeType; width: number; height: number }>) => ReturnType;
    };
  }
}
