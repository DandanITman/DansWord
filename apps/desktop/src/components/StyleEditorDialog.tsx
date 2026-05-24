import type { DocumentStyle } from '@dansword/core';

interface StyleEditorDialogProps {
  open: boolean;
  styles: DocumentStyle[];
  onChange: (styles: DocumentStyle[]) => void;
  onClose: () => void;
}

export function StyleEditorDialog({ open, styles, onChange, onClose }: StyleEditorDialogProps) {
  if (!open) return null;

  const customStyles = styles.filter((s) => !['normal', 'title', 'heading1', 'heading2', 'heading3'].includes(s.id));

  const addStyle = () => {
    const name = window.prompt('Style name');
    if (!name?.trim()) return;
    onChange([
      ...styles,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        fontFamily: 'Calibri',
        fontSize: '11pt',
      },
    ]);
  };

  const editStyle = (style: DocumentStyle) => {
    const fontFamily = window.prompt('Font family', style.fontFamily ?? 'Calibri');
    if (fontFamily === null) return;
    const fontSize = window.prompt('Font size (e.g. 11pt)', style.fontSize ?? '11pt');
    if (fontSize === null) return;
    onChange(
      styles.map((s) =>
        s.id === style.id ? { ...s, fontFamily, fontSize, bold: window.confirm('Bold?') } : s,
      ),
    );
  };

  const removeStyle = (id: string) => {
    onChange(styles.filter((s) => s.id !== id));
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog panel-card" onClick={(e) => e.stopPropagation()}>
        <h2>Style Editor</h2>
        <p className="muted">Built-in styles are listed on the Home ribbon. Add custom styles below.</p>
        <ul className="style-list">
          {customStyles.map((style) => (
            <li key={style.id} className="style-list-item">
              <span>
                <strong>{style.name}</strong>
                <span className="muted"> — {style.fontFamily} {style.fontSize}</span>
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="icon-btn" onClick={() => editStyle(style)}>Edit</button>
                <button className="icon-btn" onClick={() => removeStyle(style.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="dialog-actions">
          <button className="icon-btn" onClick={addStyle}>Add Style</button>
          <button className="icon-btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
