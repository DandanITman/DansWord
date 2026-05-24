import type { DocumentStyle } from '@dansword/core';
import type { Editor } from '@tiptap/react';

export function applyDocumentStyle(editor: Editor, style: DocumentStyle) {
  let chain = editor.chain().focus();

  if (style.headingLevel) {
    chain = chain.setParagraph().toggleHeading({ level: style.headingLevel });
  } else {
    chain = chain.setParagraph();
  }

  const textStyleAttrs = {
    ...editor.getAttributes('textStyle'),
    ...(style.fontFamily ? { fontFamily: style.fontFamily } : {}),
    ...(style.fontSize ? { fontSize: style.fontSize } : {}),
    ...(style.color ? { color: style.color } : {}),
  };
  if (Object.keys(textStyleAttrs).length) chain = chain.setMark('textStyle', textStyleAttrs);
  if (style.bold) chain = chain.setMark('bold');
  else chain = chain.unsetMark('bold');
  if (style.italic) chain = chain.setMark('italic');
  else chain = chain.unsetMark('italic');
  if (style.underline) chain = chain.setMark('underline');
  else chain = chain.unsetMark('underline');

  chain.run();
}
