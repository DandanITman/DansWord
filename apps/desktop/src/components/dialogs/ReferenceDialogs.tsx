import { useState } from 'react';
import {
  SOURCE_TYPE_LABELS,
  formatBibliographyEntry,
  includedRecords,
  suggestedTag,
  type CitationSource,
  type CitationStyle,
  type MailMergeData,
  type SourceType,
} from '@dansword/core';

/** References > Manage Sources: the source list plus the Create Source form. */
export function SourcesDialog({
  open,
  sources,
  citationStyle,
  onChange,
  onClose,
}: {
  open: boolean;
  sources: CitationSource[];
  citationStyle: CitationStyle;
  onChange: (sources: CitationSource[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Partial<CitationSource>>({ type: 'book' });
  if (!open) return null;

  const add = () => {
    const author = (draft.author ?? '').trim();
    const title = (draft.title ?? '').trim();
    if (!author && !title) return;
    const year = (draft.year ?? '').trim() || String(new Date().getFullYear());
    const source: CitationSource = {
      id: crypto.randomUUID(),
      type: (draft.type as SourceType) ?? 'book',
      author,
      title: title || 'Untitled',
      year,
      publisher: draft.publisher?.trim() || undefined,
      container: draft.container?.trim() || undefined,
      volume: draft.volume?.trim() || undefined,
      issue: draft.issue?.trim() || undefined,
      pages: draft.pages?.trim() || undefined,
      url: draft.url?.trim() || undefined,
      tag: suggestedTag(author, year),
    };
    onChange([...sources, source]);
    setDraft({ type: source.type });
  };

  const field = (
    key: keyof CitationSource,
    label: string,
    type: 'text' | 'url' = 'text',
  ) => (
    <label>
      {label}
      <input
        type={type}
        value={String(draft[key] ?? '')}
        aria-label={label}
        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
      />
    </label>
  );

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="dialog panel-card dialog-wide"
        data-testid="sources-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Source Manager</h2>
        <div className="source-list" data-testid="source-list">
          {sources.length === 0 ? (
            <p className="muted">No sources yet. Fill in the form below to create one.</p>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="source-row">
                <div>
                  <strong>{source.tag}</strong>
                  <span className="muted"> {SOURCE_TYPE_LABELS[source.type]}</span>
                  <div className="source-preview">{formatBibliographyEntry(source, citationStyle)}</div>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => onChange(sources.filter((entry) => entry.id !== source.id))}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <h3>Create source</h3>
        <div className="dialog-grid">
          <label>
            Type of source
            <select
              value={String(draft.type ?? 'book')}
              aria-label="Type of source"
              onChange={(event) =>
                setDraft((current) => ({ ...current, type: event.target.value as SourceType }))
              }
            >
              {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((type) => (
                <option key={type} value={type}>
                  {SOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          {field('author', 'Author')}
          {field('title', 'Title')}
          {field('year', 'Year')}
          {field('publisher', 'Publisher')}
          {field('container', 'Journal or site')}
          {field('volume', 'Volume')}
          {field('issue', 'Issue')}
          {field('pages', 'Pages')}
          {field('url', 'URL', 'url')}
        </div>
        <div className="dialog-actions">
          <button className="icon-btn primary" onClick={add} data-testid="source-add">
            Add source
          </button>
          <button className="icon-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mailings > Edit Recipient List. */
export function RecipientsDialog({
  open,
  data,
  onChange,
  onClose,
}: {
  open: boolean;
  data: MailMergeData;
  onChange: (data: MailMergeData) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const excluded = new Set(data.excluded);

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="dialog panel-card dialog-wide"
        data-testid="recipients-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Mail Merge Recipients</h2>
        <p className="muted">
          {data.sourceName ? `${data.sourceName} — ` : ''}
          {includedRecords(data).length} of {data.records.length} recipients selected.
        </p>
        <div className="recipients-table-wrap">
          <table className="recipients-table">
            <thead>
              <tr>
                <th scope="col">Include</th>
                {data.fields.map((field) => (
                  <th key={field} scope="col">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.records.map((record, index) => (
                <tr key={index} className={excluded.has(index) ? 'is-excluded' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!excluded.has(index)}
                      aria-label={`Include recipient ${index + 1}`}
                      onChange={(event) => {
                        const next = new Set(data.excluded);
                        if (event.target.checked) next.delete(index);
                        else next.add(index);
                        onChange({ ...data, excluded: [...next].sort((a, b) => a - b) });
                      }}
                    />
                  </td>
                  {data.fields.map((field) => (
                    <td key={field}>{record[field]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dialog-actions">
          <button
            className="icon-btn"
            onClick={() => onChange({ ...data, excluded: [] })}
            data-testid="recipients-select-all"
          >
            Select all
          </button>
          <button className="icon-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
