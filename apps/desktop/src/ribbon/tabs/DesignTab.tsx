import { Type, Stamp, LayoutTemplate } from 'lucide-react';
import { BUILTIN_STYLES } from '@dansword/core';
import { applyDocumentStyle } from '../../utils/applyStyle';
import type { RibbonTabProps } from '../types';

export function DesignTab({ editor, actions, flags }: RibbonTabProps) {
  const styleGallery = flags.customStyles.length ? flags.customStyles : BUILTIN_STYLES;

  return (
    <>
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-row design-style-row">
            {styleGallery.map((style) => (
              <button
                key={style.id}
                className="ribbon-btn-style-compact"
                onClick={() => editor && applyDocumentStyle(editor, style)}
                title={`Apply ${style.name}`}
                data-testid={`design-style-${style.id}`}
              >
                {style.name}
              </button>
            ))}
            <button className="ribbon-btn-horizontal-compact" onClick={actions.onOpenStyleEditor}>
              <Type size={14} /> <span>Manage Styles</span>
            </button>
          </div>
        </div>
      </div>
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-row">
            <button
              className="ribbon-btn-horizontal-compact"
              onClick={actions.onOpenWatermark}
              title="Set Page Watermark"
            >
              <Stamp size={15} /> <span>Watermark</span>
            </button>
            <button
              className="ribbon-btn-horizontal-compact"
              onClick={actions.onOpenPageSetup}
              title="Page Setup"
            >
              <LayoutTemplate size={15} /> <span>Page Setup</span>
            </button>
          </div>
          <div className="ribbon-row" style={{ marginTop: '4px' }}>
            {(['Normal', 'Narrow', 'Wide'] as const).map((preset) => (
              <button
                key={preset}
                className="ribbon-btn-sm-compact"
                onClick={() => actions.onApplyMarginPreset(preset)}
                title={`${preset} margins`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
