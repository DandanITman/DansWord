import type { Editor } from '@tiptap/react';

function trackInsertRangesInRange(editor: Editor, from: number, to: number) {
  const ranges: Array<{ from: number; to: number }> = [];
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    if (node.marks.some((m) => m.type.name === 'trackInsert')) {
      ranges.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  return ranges;
}

function selectionTrackRange(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  if (!empty) {
    const ranges = trackInsertRangesInRange(editor, from, to);
    if (ranges.length) {
      return { from: ranges[0].from, to: ranges[ranges.length - 1].to };
    }
  }

  const markType = editor.state.schema.marks.trackInsert;
  if (!markType) return null;
  const $pos = editor.state.doc.resolve(from);
  const marks = $pos.marks();
  if (!marks.some((m) => m.type.name === 'trackInsert')) return null;

  let start = from;
  let end = from;
  while (start > 0) {
    const prev = editor.state.doc.resolve(start - 1);
    if (!markType.isInSet(prev.marks())) break;
    start -= 1;
  }
  while (end < editor.state.doc.content.size) {
    const next = editor.state.doc.resolve(end);
    if (!markType.isInSet(next.marks())) break;
    end += 1;
  }
  return { from: start, to: end };
}

export function acceptAllTrackChanges(editor: Editor) {
  const { state } = editor;
  let tr = state.tr;
  state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((m) => m.type.name === 'trackInsert');
    if (mark) {
      tr = tr.removeMark(pos, pos + node.nodeSize, mark.type);
    }
  });
  editor.view.dispatch(tr);
}

export function rejectAllTrackChanges(editor: Editor) {
  const { state } = editor;
  const ranges: Array<{ from: number; to: number }> = [];
  state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    if (node.marks.some((m) => m.type.name === 'trackInsert')) {
      ranges.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  let tr = state.tr;
  for (let i = ranges.length - 1; i >= 0; i--) {
    tr = tr.delete(ranges[i].from, ranges[i].to);
  }
  editor.view.dispatch(tr);
}

export function acceptTrackChangeInSelection(editor: Editor) {
  const range = selectionTrackRange(editor);
  if (!range) {
    window.alert('Place the cursor in a tracked change or select tracked text.');
    return;
  }

  const { state } = editor;
  let tr = state.tr;
  state.doc.nodesBetween(range.from, range.to, (node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((m) => m.type.name === 'trackInsert');
    if (mark) {
      tr = tr.removeMark(pos, pos + node.nodeSize, mark.type);
    }
  });
  editor.view.dispatch(tr);
}

export function rejectTrackChangeInSelection(editor: Editor) {
  const range = selectionTrackRange(editor);
  if (!range) {
    window.alert('Place the cursor in a tracked change or select tracked text.');
    return;
  }
  editor.view.dispatch(editor.state.tr.delete(range.from, range.to));
}

export function countTrackChanges(editor: Editor) {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.isText && node.marks.some((m) => m.type.name === 'trackInsert')) count++;
  });
  return count;
}
