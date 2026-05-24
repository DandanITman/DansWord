import type { Editor } from '@tiptap/react';

export function findInEditor(
  editor: Editor,
  query: string,
  startFrom = 0,
): { from: number; to: number } | null {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  const doc = editor.state.doc;
  let found: { from: number; to: number } | null = null;

  doc.descendants((node, pos) => {
    if (found || !node.isText || !node.text) return;
    const text = node.text;
    const lowerText = text.toLowerCase();
    let searchStart = 0;
    if (pos < startFrom) searchStart = Math.max(0, startFrom - pos);
    const index = lowerText.indexOf(lowerQuery, searchStart);
    if (index !== -1 && pos + index >= startFrom) {
      found = { from: pos + index, to: pos + index + query.length };
    }
  });

  return found;
}

export function findAllInEditor(editor: Editor, query: string): Array<{ from: number; to: number }> {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  const matches: Array<{ from: number; to: number }> = [];

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const lowerText = node.text.toLowerCase();
    let start = 0;
    while (start < lowerText.length) {
      const index = lowerText.indexOf(lowerQuery, start);
      if (index === -1) break;
      matches.push({ from: pos + index, to: pos + index + query.length });
      start = index + 1;
    }
  });

  return matches;
}


export function replaceInEditor(editor: Editor, query: string, replacement: string, all = false) {
  const matches = findAllInEditor(editor, query);
  if (!matches.length) return 0;

  if (all) {
    let tr = editor.state.tr;
    for (let i = matches.length - 1; i >= 0; i--) {
      tr = tr.insertText(replacement, matches[i].from, matches[i].to);
    }
    editor.view.dispatch(tr);
    return matches.length;
  }

  const sel = editor.state.selection.to;
  const next =
    findInEditor(editor, query, sel) ?? findInEditor(editor, query, 0);
  if (!next) return 0;
  editor.chain().focus().insertContentAt({ from: next.from, to: next.to }, replacement).run();
  return 1;
}
