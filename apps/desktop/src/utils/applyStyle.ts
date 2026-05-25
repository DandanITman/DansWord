import type { DocumentStyle } from '@dansword/core';
import type { Editor } from '@tiptap/react';

export function applyDocumentStyle(editor: Editor, style: DocumentStyle) {
  let chain = editor.chain().focus();

  if (style.headingLevel) {
    chain = chain.setHeading({ level: style.headingLevel });
  } else {
    chain = chain.setParagraph().unsetAllMarks();
  }

  const textStyleAttrs: Record<string, string> = {};
  if (style.fontFamily) textStyleAttrs.fontFamily = style.fontFamily;
  if (style.fontSize) textStyleAttrs.fontSize = style.fontSize;
  if (style.color) textStyleAttrs.color = style.color;

  chain = chain.setMark('textStyle', textStyleAttrs);
  if (style.bold) chain = chain.setMark('bold');
  else chain = chain.unsetMark('bold');
  if (style.italic) chain = chain.setMark('italic');
  else chain = chain.unsetMark('italic');
  if (style.underline) chain = chain.setMark('underline');
  else chain = chain.unsetMark('underline');

  chain.run();
}
