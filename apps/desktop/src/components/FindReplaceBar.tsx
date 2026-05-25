import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Search, Replace } from 'lucide-react';
import { findInEditor, replaceInEditor } from '../utils/findInEditor';
import { uiAlert } from '../utils/uiPrompt';

interface FindReplaceBarProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

export function FindReplaceBar({ editor, open, onClose }: FindReplaceBarProps) {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  if (!open) return null;

  const findNext = async () => {
    if (!editor) return;
    const start = editor.state.selection.to;
    const match = findInEditor(editor, findQuery, start) ?? findInEditor(editor, findQuery, 0);
    if (!match) {
      await uiAlert('No matches found.');
      return;
    }
    editor.chain().focus().setTextSelection(match).run();
  };

  const findPrev = async () => {
    if (!editor) return;
    const { doc } = editor.state;
    const lowerQuery = findQuery.toLowerCase();
    let lastMatch: { from: number; to: number } | null = null;
    const cursor = editor.state.selection.from;

    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      const lowerText = node.text.toLowerCase();
      let start = 0;
      while (start < lowerText.length) {
        const index = lowerText.indexOf(lowerQuery, start);
        if (index === -1) break;
        const from = pos + index;
        const to = from + findQuery.length;
        if (to <= cursor) lastMatch = { from, to };
        start = index + 1;
      }
    });

    if (!lastMatch) {
      await uiAlert('No previous matches.');
      return;
    }
    editor.chain().focus().setTextSelection(lastMatch).run();
  };

  const replaceOne = async () => {
    if (!editor) return;
    const count = replaceInEditor(editor, findQuery, replaceQuery, false);
    if (!count) await uiAlert('No matches found.');
    else await findNext();
  };

  const replaceAll = async () => {
    if (!editor) return;
    const count = replaceInEditor(editor, findQuery, replaceQuery, true);
    await uiAlert(count ? `Replaced ${count} occurrence(s).` : 'No matches found.');
  };

  return (
    <div className="find-replace-bar" data-testid="find-replace-bar">
      <div className="find-field">
        <Search size={14} />
        <input
          data-testid="find-input"
          value={findQuery}
          onChange={(e) => setFindQuery(e.target.value)}
          placeholder="Find"
          onKeyDown={(e) => e.key === 'Enter' && findNext()}
        />
      </div>
      <div className="find-field">
        <Replace size={14} />
        <input
          data-testid="replace-input"
          value={replaceQuery}
          onChange={(e) => setReplaceQuery(e.target.value)}
          placeholder="Replace with"
          onKeyDown={(e) => e.key === 'Enter' && replaceOne()}
        />
      </div>
      <div className="find-actions">
        <button className="icon-btn" onClick={findNext} data-testid="find-next">
          Next
        </button>
        <button className="icon-btn" onClick={findPrev}>
          Previous
        </button>
        <button className="icon-btn" onClick={replaceOne}>
          Replace
        </button>
        <button className="icon-btn" onClick={replaceAll} data-testid="replace-all">
          Replace All
        </button>
        <button className="icon-btn ghost-muted" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
