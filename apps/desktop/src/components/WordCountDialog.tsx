import type { Editor } from '@tiptap/react';

interface WordCountDialogProps {
  open: boolean;
  editor: Editor | null;
  pages: number;
  onClose: () => void;
}

/** Word count details. The View tab previously had no such command at all. */
export function WordCountDialog({ open, editor, pages, onClose }: WordCountDialogProps) {
  if (!open) return null;

  const text = editor?.getText() ?? '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = editor
    ? editor.state.doc.content.content.filter((node) => node.type.name === 'paragraph' && node.textContent.trim())
        .length
    : 0;

  const rows: Array<[string, number]> = [
    ['Pages', pages],
    ['Words', words],
    ['Characters (with spaces)', text.length],
    ['Characters (no spaces)', charactersNoSpaces],
    ['Paragraphs', paragraphs],
  ];

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} data-testid="word-count-dialog">
        <h2>Word Count</h2>
        <table className="word-count-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td data-testid={`word-count-${label.split(' ')[0].toLowerCase()}`}>
                  {value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dialog-actions">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
