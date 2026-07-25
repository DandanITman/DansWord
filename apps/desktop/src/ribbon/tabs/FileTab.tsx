import { FilePlus, FolderOpen, Save, FileDown, Printer } from 'lucide-react';
import type { RibbonTabProps } from '../types';

export function FileTab({ actions }: RibbonTabProps) {
  return (
    <>
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <button className="ribbon-btn-lg-compact" onClick={actions.onNew} title="New Document">
            <FilePlus size={20} />
            <span>New</span>
          </button>
          <button className="ribbon-btn-lg-compact" onClick={actions.onOpenFile} title="Open Document">
            <FolderOpen size={20} />
            <span>Open</span>
          </button>
          <button
            className="ribbon-btn-lg-compact"
            onClick={actions.onSave}
            title="Save Document"
            data-testid="ribbon-save"
          >
            <Save size={20} />
            <span>Save</span>
          </button>
        </div>
      </div>
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <button
            className="ribbon-btn-horizontal-compact"
            onClick={actions.onOpenBackstage}
            title="Save As / Export Options"
          >
            <FileDown size={14} /> <span>Save As / Export</span>
          </button>
          <button
            className="ribbon-btn-horizontal-compact"
            onClick={actions.onPrint}
            title="Print Document"
          >
            <Printer size={14} /> <span>Print</span>
          </button>
          <button
            className="ribbon-btn-horizontal-compact"
            onClick={actions.onExportPdf}
            title="Export as PDF"
          >
            <FileDown size={14} /> <span>Export PDF</span>
          </button>
        </div>
      </div>
    </>
  );
}
