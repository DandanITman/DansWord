import type { PageSetup, PageOrientation, PageSizePreset } from '@dansword/core';
import { MARGIN_PRESETS } from '@dansword/core';

interface PageSetupDialogProps {
  open: boolean;
  pageSetup: PageSetup;
  onChange: (setup: PageSetup) => void;
  onClose: () => void;
}

export function PageSetupDialog({ open, pageSetup, onChange, onClose }: PageSetupDialogProps) {
  if (!open) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog panel-card" onClick={(e) => e.stopPropagation()}>
        <h2>Page Setup</h2>
        <div className="dialog-grid">
          <label>
            Page size
            <select
              value={pageSetup.size}
              onChange={(e) => onChange({ ...pageSetup, size: e.target.value as PageSizePreset })}
            >
              <option value="letter">Letter (8.5 × 11)</option>
              <option value="a4">A4</option>
              <option value="legal">Legal</option>
            </select>
          </label>
          <label>
            Orientation
            <select
              value={pageSetup.orientation}
              onChange={(e) =>
                onChange({ ...pageSetup, orientation: e.target.value as PageOrientation })
              }
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
          <label>
            Margin preset
            <select
              onChange={(e) => {
                const preset = MARGIN_PRESETS[e.target.value];
                if (preset) onChange({ ...pageSetup, margins: { ...preset } });
              }}
            >
              <option value="">Custom</option>
              {Object.keys(MARGIN_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
            <label key={side}>
              {side[0].toUpperCase() + side.slice(1)} margin (px)
              <input
                type="number"
                min={0}
                value={pageSetup.margins[side]}
                onChange={(e) =>
                  onChange({
                    ...pageSetup,
                    margins: { ...pageSetup.margins, [side]: Number(e.target.value) },
                  })
                }
              />
            </label>
          ))}
          <label>
            Columns
            <select
              value={pageSetup.columns.count}
              onChange={(e) =>
                onChange({
                  ...pageSetup,
                  columns: { ...pageSetup.columns, count: Number(e.target.value) },
                })
              }
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {pageSetup.columns.count > 1 && (
            <label>
              Column gap (px)
              <input
                type="number"
                min={12}
                value={pageSetup.columns.gap}
                onChange={(e) =>
                  onChange({
                    ...pageSetup,
                    columns: { ...pageSetup.columns, gap: Number(e.target.value) },
                  })
                }
              />
            </label>
          )}
        </div>
        <div className="dialog-actions">
          <button className="icon-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface HeaderFooterDialogProps {
  open: boolean;
  header: string;
  footer: string;
  showPageNumbers: boolean;
  onChange: (header: string, footer: string, showPageNumbers: boolean) => void;
  onClose: () => void;
}

export function HeaderFooterDialog({
  open,
  header,
  footer,
  showPageNumbers,
  onChange,
  onClose,
}: HeaderFooterDialogProps) {
  if (!open) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog panel-card" onClick={(e) => e.stopPropagation()}>
        <h2>Header & Footer</h2>
        <label>
          Header text
          <input
            value={header}
            onChange={(e) => onChange(e.target.value, footer, showPageNumbers)}
            placeholder="Header appears at top of each page"
          />
        </label>
        <label>
          Footer text
          <input
            value={footer}
            onChange={(e) => onChange(header, e.target.value, showPageNumbers)}
            placeholder="Footer appears at bottom of each page"
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showPageNumbers}
            onChange={(e) => onChange(header, footer, e.target.checked)}
          />
          Show page numbers in footer
        </label>
        <div className="dialog-actions">
          <button className="icon-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
