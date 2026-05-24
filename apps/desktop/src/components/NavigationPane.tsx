import type { Editor } from '@tiptap/react';
import type { PageSetup } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';
import { extractHeadings } from '../utils/headings';

interface NavigationPaneProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

export function NavigationPane({ editor, open, onClose }: NavigationPaneProps) {
  if (!open) return null;
  const headings = editor ? extractHeadings(editor) : [];

  return (
    <aside className="side-pane">
      <div className="side-pane-header">
        <strong>Navigation</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="side-pane-body">
        {headings.length === 0 ? (
          <p className="muted">No headings in this document.</p>
        ) : (
          <ul className="nav-list">
            {headings.map((h, i) => (
              <li key={`${h.pos}-${i}`} style={{ paddingLeft: (h.level - 1) * 12 }}>
                <button
                  onClick={() => {
                    editor?.chain().focus().setTextSelection(h.pos + 1).run();
                  }}
                >
                  {h.text || '(empty heading)'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

interface RulerProps {
  pageSetup: PageSetup;
}

export function Ruler({ pageSetup }: RulerProps) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const width = pageSetup.orientation === 'portrait' ? dims.width : dims.height;

  return (
    <div className="ruler" style={{ width }}>
      {Array.from({ length: Math.floor(width / 96) + 1 }, (_, i) => (
        <span key={i} className="ruler-mark" style={{ left: i * 96 }}>
          {i}
        </span>
      ))}
    </div>
  );
}
