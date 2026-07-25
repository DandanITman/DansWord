import { PanelLeft, Maximize2, Printer, FileDown, Hash } from 'lucide-react';
import type { RibbonTabProps } from '../types';

export function ViewTab({ actions, flags }: RibbonTabProps) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-content">
        <div className="ribbon-column">
          <div className="ribbon-row">
            <button
              className="ribbon-btn-horizontal-compact"
              onClick={actions.onToggleNavigation}
              title="Toggle Navigation Panel"
            >
              <PanelLeft size={14} /> <span>Navigation</span>
            </button>
            <button
              className={`ribbon-btn-horizontal-compact ${flags.focusMode ? 'active' : ''}`}
              onClick={actions.onToggleFocusMode}
              title="Toggle Focus Mode"
            >
              <Maximize2 size={14} /> <span>Focus Mode</span>
            </button>
            <button
              className="ribbon-btn-horizontal-compact"
              onClick={actions.onOpenWordCount}
              title="Word Count"
              data-testid="ribbon-word-count"
            >
              <Hash size={14} /> <span>Word Count</span>
            </button>
          </div>
          <div className="ribbon-row" style={{ marginTop: '2px' }}>
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
              <FileDown size={14} /> <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
