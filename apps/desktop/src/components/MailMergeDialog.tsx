import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  parseCsv,
  applyMergeToEnvelope,
  listMergeFields,
} from '@dansword/core';
import type { DocumentEnvelope } from '@dansword/core';
import { exportToDocx, type DocxExportOptions } from '@dansword/openxml';

interface MailMergeDialogProps {
  open: boolean;
  envelope: DocumentEnvelope;
  editor: Editor | null;
  onClose: () => void;
}

function docxOptions(envelope: DocumentEnvelope, title: string): DocxExportOptions {
  return {
    title,
    pageSetup: envelope.pageSetup,
    headerFooter: envelope.headerFooter,
    footnotes: envelope.footnotes,
  };
}

export function MailMergeDialog({ open, envelope, editor, onClose }: MailMergeDialogProps) {
  const [csvText, setCsvText] = useState(
    'FirstName,LastName,Email\nJane,Doe,jane@example.com\nJohn,Smith,john@example.com',
  );
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);

  if (!open) return null;

  const fields = listMergeFields(envelope.content);

  const records = parseCsv(csvText);

  const loadCsvFile = async () => {
    const path = await window.dansword.openFile();
    if (!path) return;
    const text = await window.dansword.readTextFile(path);
    setCsvText(text);
    setPreview(null);
  };

  const pickOutputFolder = async () => {
    const folder = await window.dansword.openFolder();
    if (folder) setOutputDir(folder);
  };

  const showPreview = () => {
    if (!records.length) {
      setStatus('Add CSV data with a header row and at least one record.');
      return;
    }
    const merged = applyMergeToEnvelope(envelope, records[0]);
    const text = JSON.stringify(merged.content, null, 2).slice(0, 1200);
    setPreview(`Preview (record 1 — ${records[0].FirstName ?? records[0].Name ?? 'row 1'}):\n${text}…`);
    setStatus('');
  };

  const insertSampleFields = () => {
    if (!editor) {
      setStatus('Open the document editor first.');
      return;
    }
    editor.chain().focus().insertMergeField('FirstName').insertContent(' ').insertMergeField('LastName').run();
    setStatus('Inserted {{FirstName}} {{LastName}} at cursor.');
  };

  const runMerge = async () => {
    if (!records.length) {
      setStatus('Add a CSV with a header row and at least one data row.');
      return;
    }
    const defaultDir = outputDir ?? (await window.dansword.getDefaultSaveDir());
    let saved = 0;
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const merged = applyMergeToEnvelope(envelope, record);
      const name = record.FirstName || record.Name || record.first_name || `Recipient_${i + 1}`;
      const sep = defaultDir.includes('\\') ? '\\' : '/';
      const filePath = `${defaultDir}${sep}Merge_${name.replace(/[^\w-]+/g, '_')}.docx`;
      const blob = await exportToDocx(merged.content, docxOptions(merged, `Merge ${name}`));
      const buffer = new Uint8Array(await blob.arrayBuffer());
      await window.dansword.writeFile(filePath, buffer);
      saved++;
    }
    setStatus(`Generated ${saved} merged document(s) in ${defaultDir}`);
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog panel-card mail-merge-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Mail Merge</h2>
        <p className="dialog-hint">
          Use merge fields like <code>{'{{FirstName}}'}</code> in your document. CSV columns must match field names.
        </p>
        {fields.length > 0 && (
          <p className="dialog-hint">Fields found: {fields.map((f) => `{{${f}}}`).join(', ')}</p>
        )}
        <label>
          CSV data
          <textarea rows={8} value={csvText} onChange={(e) => { setCsvText(e.target.value); setPreview(null); }} />
        </label>
        {outputDir && <p className="dialog-hint">Output folder: {outputDir}</p>}
        {preview && <pre className="merge-preview">{preview}</pre>}
        <div className="dialog-actions">
          <button type="button" className="icon-btn" onClick={() => void loadCsvFile()}>Load CSV</button>
          <button type="button" className="icon-btn" onClick={() => void pickOutputFolder()}>Output folder</button>
          <button type="button" className="icon-btn" onClick={insertSampleFields}>Insert sample fields</button>
          <button type="button" className="icon-btn" onClick={showPreview}>Preview first</button>
          <button type="button" className="icon-btn primary" onClick={() => void runMerge()}>Generate documents</button>
          <button type="button" className="icon-btn" onClick={onClose}>Close</button>
        </div>
        {status && <p className="merge-status">{status}</p>}
      </div>
    </div>
  );
}
