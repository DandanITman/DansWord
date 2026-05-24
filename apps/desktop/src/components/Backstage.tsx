import type { AppSettings, DocumentMetadata, DocumentRevision } from '@dansword/core';
import { DEFAULT_SETTINGS } from '@dansword/core';
import { RevisionHistoryPanel } from './RevisionHistoryPanel';

type BackstageSection = 'info' | 'new' | 'open' | 'save' | 'export' | 'print' | 'options' | 'history';

interface BackstageProps {
  section: BackstageSection;
  onSectionChange: (section: BackstageSection) => void;
  onClose: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  fileName: string;
  filePath: string | null;
  revisions: DocumentRevision[];
  onRestoreRevision: (id: string) => void;
  metadata: DocumentMetadata;
  onMetadataChange: (metadata: DocumentMetadata) => void;
  onExportRtf: () => void;
  onExportHtml: () => void;
}

const NAV: { id: BackstageSection; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'new', label: 'New' },
  { id: 'open', label: 'Open' },
  { id: 'save', label: 'Save / Save As' },
  { id: 'export', label: 'Export' },
  { id: 'print', label: 'Print' },
  { id: 'history', label: 'Version History' },
  { id: 'options', label: 'Options' },
];

const EXPORT_FORMATS = [
  { label: 'DOCX', desc: 'Microsoft Word format', action: 'docx' as const },
  { label: 'RTF', desc: 'Rich Text Format', action: 'rtf' as const },
  { label: 'HTML', desc: 'Web page with styling', action: 'html' as const },
  { label: 'PDF', desc: 'Print to PDF', action: 'pdf' as const },
];

export function Backstage({
  section,
  onSectionChange,
  onClose,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportDocx,
  onExportPdf,
  onPrint,
  settings,
  onSettingsChange,
  fileName,
  filePath,
  revisions,
  onRestoreRevision,
  metadata,
  onMetadataChange,
  onExportRtf,
  onExportHtml,
}: BackstageProps) {
  const exportHandlers = {
    docx: onExportDocx,
    rtf: onExportRtf,
    html: onExportHtml,
    pdf: onExportPdf,
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="backstage" onClick={(e) => e.stopPropagation()} data-testid="backstage">
        <nav className="backstage-nav">
          <div className="backstage-nav-header">File</div>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? 'active' : ''}
              onClick={() => onSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
          <div className="backstage-nav-back">
            <button className="icon-btn ghost-muted" onClick={onClose}>
              ← Back to document
            </button>
          </div>
        </nav>
        <div className="backstage-content">
          {section === 'info' && (
            <>
              <h2>Document Properties</h2>
              <p className="backstage-subtitle">Edit metadata stored with your document.</p>
              <div className="dialog-grid">
                <label>
                  Title
                  <input
                    value={metadata.title}
                    onChange={(e) => onMetadataChange({ ...metadata, title: e.target.value })}
                  />
                </label>
                <label>
                  Author
                  <input
                    value={metadata.author}
                    onChange={(e) => onMetadataChange({ ...metadata, author: e.target.value })}
                  />
                </label>
                <label>
                  Subject
                  <input
                    value={metadata.subject ?? ''}
                    onChange={(e) => onMetadataChange({ ...metadata, subject: e.target.value })}
                  />
                </label>
                <label>
                  Keywords
                  <input
                    value={metadata.keywords ?? ''}
                    onChange={(e) => onMetadataChange({ ...metadata, keywords: e.target.value })}
                  />
                </label>
                <label>
                  Company
                  <input
                    value={metadata.company ?? ''}
                    onChange={(e) => onMetadataChange({ ...metadata, company: e.target.value })}
                  />
                </label>
              </div>
              <div className="meta-grid">
                <div className="meta-card">
                  <div className="meta-card-label">File name</div>
                  <div className="meta-card-value">{fileName}</div>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">Location</div>
                  <div className="meta-card-value">{filePath ?? 'Not saved yet'}</div>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">Created</div>
                  <div className="meta-card-value">{new Date(metadata.created).toLocaleString()}</div>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">Modified</div>
                  <div className="meta-card-value">{new Date(metadata.modified).toLocaleString()}</div>
                </div>
              </div>
            </>
          )}
          {section === 'new' && (
            <>
              <h2>New Document</h2>
              <p className="backstage-subtitle">Start fresh with a blank page.</p>
              <button className="icon-btn primary" onClick={onNew}>
                Create blank document
              </button>
            </>
          )}
          {section === 'open' && (
            <>
              <h2>Open</h2>
              <p className="backstage-subtitle">Browse for a document on your computer.</p>
              <button className="icon-btn primary" onClick={onOpen}>
                Browse for file…
              </button>
            </>
          )}
          {section === 'save' && (
            <>
              <h2>Save</h2>
              <p className="backstage-subtitle">Save changes to the current file or choose a new location.</p>
              <div className="action-row">
                <button className="icon-btn primary" onClick={onSave}>
                  Save
                </button>
                <button className="icon-btn" onClick={onSaveAs}>
                  Save As…
                </button>
              </div>
            </>
          )}
          {section === 'export' && (
            <>
              <h2>Export</h2>
              <p className="backstage-subtitle">Save a copy in another format.</p>
              <div className="export-grid">
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.action}
                    className="export-card"
                    onClick={exportHandlers[fmt.action]}
                  >
                    <span className="export-card-title">{fmt.label}</span>
                    <span className="export-card-desc">{fmt.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {section === 'print' && (
            <>
              <h2>Print</h2>
              <p className="backstage-subtitle">Send the document to your printer.</p>
              <button className="icon-btn primary" onClick={onPrint}>
                Print document
              </button>
            </>
          )}
          {section === 'history' && (
            <RevisionHistoryPanel
              revisions={revisions}
              onRestore={onRestoreRevision}
              onClose={onClose}
            />
          )}
          {section === 'options' && (
            <>
              <h2>Options</h2>
              <p className="backstage-subtitle">Customize appearance and behavior.</p>
              <div className="dialog-grid" style={{ maxWidth: 420 }}>
                <label>
                  Theme
                  <select
                    value={settings.theme}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        theme: e.target.value as AppSettings['theme'],
                      })
                    }
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label>
                  Accent color
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => onSettingsChange({ ...settings, accentColor: e.target.value })}
                  />
                </label>
                <label>
                  Default font
                  <input
                    value={settings.defaultFontFamily}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, defaultFontFamily: e.target.value })
                    }
                  />
                </label>
                <label>
                  Default font size
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={settings.defaultFontSize}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, defaultFontSize: Number(e.target.value) || DEFAULT_SETTINGS.defaultFontSize })
                    }
                  />
                </label>
                <label>
                  Default save location
                  <input
                    value={settings.defaultSaveLocation}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, defaultSaveLocation: e.target.value })
                    }
                    placeholder="Leave blank for Documents\\DansWord"
                  />
                </label>
                <label>
                  Auto-save interval (seconds)
                  <input
                    type="number"
                    min={5}
                    value={settings.autoSaveIntervalMs / 1000}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        autoSaveIntervalMs: Number(e.target.value) * 1000,
                      })
                    }
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={settings.spellCheckEnabled}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, spellCheckEnabled: e.target.checked })
                    }
                  />
                  Enable spell check (Hunspell)
                </label>
                <label>
                  Proofing language
                  <select
                    value={settings.language}
                    onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="de-DE">German</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                  </select>
                </label>
                <button
                  className="icon-btn"
                  onClick={() => onSettingsChange({ ...DEFAULT_SETTINGS })}
                >
                  Reset to defaults
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type { BackstageSection };
