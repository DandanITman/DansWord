import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface GoToDialogProps {
  open: boolean;
  editor: Editor | null;
  pages: number;
  onClose: () => void;
}

type Target = 'page' | 'line' | 'bookmark';

/**
 * Word's Ctrl+G. Long documents had no navigation command at all — the page
 * indicator was inert and Find offered no Go To — so the only way to reach
 * page 40 was to scroll.
 *
 * The page geometry is read back off `.doc-page`'s `--page-height` custom
 * property rather than threaded down from WordEditor, so this stays a leaf
 * component with no new plumbing through App.
 */
export function GoToDialog({ open, editor, pages, onClose }: GoToDialogProps) {
  const [target, setTarget] = useState<Target>('page');
  const [value, setValue] = useState('1');

  useEffect(() => {
    if (open) setValue('1');
  }, [open]);

  if (!open) return null;

  const go = () => {
    if (!editor) return onClose();

    if (target === 'bookmark') {
      const name = value.trim().toLowerCase();
      let found: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (found != null) return false;
        const bookmark = node.marks.find((mark) => mark.type.name === 'bookmark');
        const label = String(bookmark?.attrs?.name ?? node.attrs?.name ?? '').toLowerCase();
        if (bookmark && (!name || label === name)) found = pos;
        return true;
      });
      if (found != null) editor.chain().focus().setTextSelection(found).scrollIntoView().run();
      return onClose();
    }

    const page = editor.view.dom.closest('.doc-page') as HTMLElement | null;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return onClose();

    if (target === 'line') {
      // Lines are uniform in the editor's own layout, so the nth line is the
      // nth line box from the top of the editable surface.
      const lineHeight = 24;
      const y = editor.view.dom.getBoundingClientRect().top + (parsed - 1) * lineHeight + 2;
      const at = editor.view.posAtCoords({ left: editor.view.dom.getBoundingClientRect().left + 4, top: y });
      if (at) editor.chain().focus().setTextSelection(at.pos).scrollIntoView().run();
      return onClose();
    }

    const pageHeight = page
      ? Number.parseFloat(getComputedStyle(page).getPropertyValue('--page-height')) || 0
      : 0;
    if (!pageHeight) return onClose();

    const clamped = Math.min(Math.max(1, parsed), Math.max(1, pages));
    const rect = editor.view.dom.getBoundingClientRect();
    const at = editor.view.posAtCoords({
      left: rect.left + 4,
      top: rect.top + (clamped - 1) * pageHeight + 2,
    });
    if (at) editor.chain().focus().setTextSelection(at.pos).scrollIntoView().run();
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} data-testid="go-to-dialog">
        <h2>Go To</h2>
        <div className="field-row">
          <label htmlFor="goto-target">Go to what</label>
          <select
            id="goto-target"
            value={target}
            onChange={(event) => setTarget(event.target.value as Target)}
            data-testid="go-to-target"
          >
            <option value="page">Page</option>
            <option value="line">Line</option>
            <option value="bookmark">Bookmark</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="goto-value">
            {target === 'bookmark' ? 'Bookmark name' : `Enter ${target} number`}
          </label>
          <input
            id="goto-value"
            type={target === 'bookmark' ? 'text' : 'number'}
            min={1}
            value={value}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') go();
            }}
            data-testid="go-to-value"
          />
        </div>
        {target === 'page' && (
          <p className="dialog-hint">This document has {pages} page{pages === 1 ? '' : 's'}.</p>
        )}
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={go} data-testid="go-to-confirm">
            Go To
          </button>
        </div>
      </div>
    </div>
  );
}
