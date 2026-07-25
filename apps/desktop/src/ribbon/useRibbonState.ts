import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';

export interface RibbonState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  superscript: boolean;
  subscript: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  link: boolean;
  linkHref: string;

  align: 'left' | 'center' | 'right' | 'justify' | null;
  headingLevel: number | null;

  fontFamily: string;
  fontSize: string;
  color: string | null;
  highlight: string | null;
  lineHeight: string;
  borderColor: string | null;
  shading: string | null;

  imageActive: boolean;
  imageAlign: string;
  imageWrap: string;

  inTable: boolean;

  canUndo: boolean;
  canRedo: boolean;
}

const EMPTY: RibbonState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  superscript: false,
  subscript: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  codeBlock: false,
  link: false,
  linkHref: '',
  align: null,
  headingLevel: null,
  fontFamily: 'Calibri',
  fontSize: '11',
  color: null,
  highlight: null,
  lineHeight: '',
  borderColor: null,
  shading: null,
  imageActive: false,
  imageAlign: 'left',
  imageWrap: 'square',
  inTable: false,
  canUndo: false,
  canRedo: false,
};

/**
 * Ribbon control state, recomputed on every editor transaction.
 *
 * The ribbon used to call `editor.isActive(...)` directly during App's render.
 * In TipTap v2 `useEditor` re-renders only the component that owns the hook,
 * and App re-rendered only when the document *content* changed — so a
 * selection-only transaction (moving the caret, clicking an image) updated
 * nothing. Bold stayed lit after leaving bold text, the font dropdowns showed
 * whatever was true at the last edit, and the contextual picture group never
 * appeared because selecting an image changes no content.
 *
 * `useEditorState` subscribes to the transaction counter instead, so caret
 * movement refreshes these values, and its equality check keeps unrelated
 * transactions from re-rendering the ribbon.
 */
export function useRibbonState(editor: Editor | null): RibbonState {
  return useEditorState({
    editor,
    selector: ({ editor: instance }): RibbonState => {
      if (!instance) return EMPTY;

      const textStyle = instance.getAttributes('textStyle');
      const paragraph = instance.getAttributes('paragraph');
      const heading = instance.getAttributes('heading');
      const image = instance.getAttributes('image');
      const block = instance.isActive('heading') ? heading : paragraph;

      const headingLevel = instance.isActive('heading') ? Number(heading.level ?? 0) || null : null;

      const align = (['left', 'center', 'right', 'justify'] as const).find((value) =>
        instance.isActive({ textAlign: value }),
      );

      return {
        bold: instance.isActive('bold'),
        italic: instance.isActive('italic'),
        underline: instance.isActive('underline'),
        strike: instance.isActive('strike'),
        superscript: instance.isActive('superscript'),
        subscript: instance.isActive('subscript'),
        bulletList: instance.isActive('bulletList'),
        orderedList: instance.isActive('orderedList'),
        blockquote: instance.isActive('blockquote'),
        codeBlock: instance.isActive('codeBlock'),
        link: instance.isActive('link'),
        linkHref: String(instance.getAttributes('link').href ?? ''),

        align: align ?? null,
        headingLevel,

        fontFamily: String(textStyle.fontFamily ?? 'Calibri'),
        fontSize: String(textStyle.fontSize ?? '11pt').replace('pt', ''),
        color: (textStyle.color as string | undefined) ?? null,
        highlight: (instance.getAttributes('highlight').color as string | undefined) ?? null,
        lineHeight: String(block.lineHeight ?? ''),
        borderColor: (block.borderColor as string | undefined) ?? null,
        shading: (block.shading as string | undefined) ?? null,

        imageActive: instance.isActive('image'),
        imageAlign: String(image.align ?? 'left'),
        imageWrap: String(image.wrap ?? 'square'),

        inTable: instance.isActive('table'),

        canUndo: instance.can().undo(),
        canRedo: instance.can().redo(),
      };
    },
  }) ?? EMPTY;
}
