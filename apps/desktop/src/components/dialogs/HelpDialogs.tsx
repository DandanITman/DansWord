import changelogSource from '../../../../../CHANGELOG.md?raw';
import { SHORTCUT_GROUPS } from '../../constants/shortcuts';

/** Help > Keyboard Shortcuts, rendered from the one shortcut table. */
export function KeyboardShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="dialog dialog-wide"
        onClick={(e) => e.stopPropagation()}
        data-testid="shortcuts-dialog"
      >
        <h2>Keyboard Shortcuts</h2>
        <div className="shortcut-columns">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="shortcut-group">
              <h3>{group.title}</h3>
              <table className="shortcut-table">
                <tbody>
                  {group.shortcuts.map((shortcut) => (
                    <tr key={shortcut.keys}>
                      <th scope="row">
                        <kbd>{shortcut.keys}</kbd>
                      </th>
                      <td>{shortcut.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <div className="dialog-actions">
          <button className="primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Help > What's New.
 *
 * The changelog is bundled at build time rather than fetched, so this works
 * offline and in the packaged app. Only the handful of Markdown constructs the
 * file actually uses are rendered — pulling in a Markdown library to show one
 * bundled document would be a poor trade.
 */
export function WhatsNewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const blocks: React.ReactElement[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const rawLine of changelogSource.split('\n')) {
    const line = rawLine.trimEnd();
    if (/^\s+/.test(rawLine) && bullets.length) {
      // A wrapped continuation of the bullet above it.
      bullets[bullets.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith('### ')) {
      blocks.push(<h4 key={blocks.length}>{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h3 key={blocks.length}>{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      // The document title is already the dialog heading.
      continue;
    } else if (line.trim()) {
      blocks.push(<p key={blocks.length}>{renderInline(line)}</p>);
    }
  }
  flush();

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="dialog dialog-wide"
        onClick={(e) => e.stopPropagation()}
        data-testid="whats-new-dialog"
      >
        <h2>What&apos;s New</h2>
        <div className="changelog-body">{blocks}</div>
        <div className="dialog-actions">
          <button className="primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Bold runs only — the changelog uses `**text**` and nothing else inline. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
