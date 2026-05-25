import { Extension } from '@tiptap/core';

type ParagraphFormattingAttrs = {
  textAlign?: string | null;
  indentLevel?: number | null;
  lineHeight?: string | null;
  spaceBefore?: number | null;
  spaceAfter?: number | null;
  borderColor?: string | null;
  shading?: string | null;
};

function readPx(value: string | null) {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function paragraphStyle(attrs: ParagraphFormattingAttrs) {
  const styles: string[] = [];
  if (attrs.textAlign && attrs.textAlign !== 'left') styles.push(`text-align: ${attrs.textAlign}`);
  const indentLevel = Number(attrs.indentLevel ?? 0);
  if (indentLevel > 0) styles.push(`margin-left: ${indentLevel * 36}px`);
  if (attrs.lineHeight) styles.push(`line-height: ${attrs.lineHeight}`);
  if (attrs.spaceBefore) styles.push(`margin-top: ${attrs.spaceBefore}px`);
  if (attrs.spaceAfter) styles.push(`margin-bottom: ${attrs.spaceAfter}px`);
  if (attrs.borderColor) styles.push(`border-left: 3px solid ${attrs.borderColor}`, 'padding-left: 10px');
  if (attrs.shading) styles.push(`background-color: ${attrs.shading}`, 'padding-top: 2px', 'padding-bottom: 2px');
  return styles.join('; ');
}

export const ParagraphFormatting = Extension.create({
  name: 'paragraphFormatting',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indentLevel: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-indent-level');
              return raw ? Number(raw) : Math.round((readPx(element.style.marginLeft) ?? 0) / 36);
            },
            renderHTML: (attrs) => {
              const style = paragraphStyle(attrs);
              return {
                ...(attrs.indentLevel ? { 'data-indent-level': attrs.indentLevel } : {}),
                ...(style ? { style } : {}),
              };
            },
          },
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
          },
          spaceBefore: {
            default: null,
            parseHTML: (element) => readPx(element.style.marginTop),
          },
          spaceAfter: {
            default: null,
            parseHTML: (element) => readPx(element.style.marginBottom),
          },
          borderColor: {
            default: null,
            parseHTML: (element) => element.style.borderLeftColor || null,
            renderHTML: (attributes) => {
              if (!attributes.borderColor) return {};
              return {
                style: `border-left: 3px solid ${attributes.borderColor}; padding-left: 10px`,
              };
            },
          },
          shading: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.shading) return {};
              return {
                style: `background-color: ${attributes.shading}; padding-top: 2px; padding-bottom: 2px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseParagraphIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(editor.getAttributes('paragraph').indentLevel ?? editor.getAttributes('heading').indentLevel ?? 0);
          return commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', {
            indentLevel: Math.min(8, current + 1),
          });
        },
      decreaseParagraphIndent:
        () =>
        ({ editor, commands }) => {
          const current = Number(editor.getAttributes('paragraph').indentLevel ?? editor.getAttributes('heading').indentLevel ?? 0);
          return commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', {
            indentLevel: Math.max(0, current - 1),
          });
        },
      setLineSpacing:
        (lineHeight: string) =>
        ({ editor, commands }) =>
          commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { lineHeight }),
      setParagraphSpacing:
        (spaceBefore: number, spaceAfter: number) =>
        ({ editor, commands }) =>
          commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', {
            spaceBefore,
            spaceAfter,
          }),
      setParagraphBorder:
        (borderColor: string | null) =>
        ({ editor, commands }) =>
          commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { borderColor }),
      setParagraphShading:
        (shading: string | null) =>
        ({ editor, commands }) =>
          commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { shading }),
      clearParagraphFormatting:
        () =>
        ({ editor, commands }) =>
          commands.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', {
            indentLevel: 0,
            lineHeight: null,
            spaceBefore: null,
            spaceAfter: null,
            borderColor: null,
            shading: null,
          }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphFormatting: {
      increaseParagraphIndent: () => ReturnType;
      decreaseParagraphIndent: () => ReturnType;
      setLineSpacing: (lineHeight: string) => ReturnType;
      setParagraphSpacing: (spaceBefore: number, spaceAfter: number) => ReturnType;
      setParagraphBorder: (borderColor: string | null) => ReturnType;
      setParagraphShading: (shading: string | null) => ReturnType;
      clearParagraphFormatting: () => ReturnType;
    };
  }
}
