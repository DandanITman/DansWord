import { LayoutTemplate, FileType, Stamp, SeparatorHorizontal } from 'lucide-react';
import type { RibbonTabProps } from '../types';

export function LayoutTab({ editor, actions }: RibbonTabProps) {
  return (
    <div className="ribbon-group" style={{ borderRight: 'none' }}>
      <div className="ribbon-group-content">
        <button
          className="ribbon-btn-lg-compact"
          onClick={actions.onOpenPageSetup}
          title="Page Margins & Setup"
        >
          <LayoutTemplate size={20} />
          <span>Page Setup</span>
        </button>
        <button
          className="ribbon-btn-horizontal-compact"
          onClick={actions.onOpenHeaderFooter}
          title="Edit Header/Footer"
        >
          <FileType size={14} /> <span>Header/Footer</span>
        </button>
        <button
          className="ribbon-btn-horizontal-compact"
          onClick={actions.onOpenWatermark}
          title="Set Watermark"
        >
          <Stamp size={14} /> <span>Watermark</span>
        </button>
        <button
          className="ribbon-btn-horizontal-compact"
          onClick={() => editor?.chain().focus().insertPageBreak().run()}
          title="Insert Page Break"
        >
          <SeparatorHorizontal size={14} /> <span>Page Break</span>
        </button>
      </div>
    </div>
  );
}
