import { FileText, Globe, Eye } from 'lucide-react';

interface StatusBarProps {
  words: number;
  pages: number;
  currentPage?: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  language: string;
  trackChangesEnabled?: boolean;
  viewMode?: 'print' | 'web' | 'focus';
  onViewModeChange?: (mode: 'print' | 'web' | 'focus') => void;
}

export function StatusBar({
  words,
  pages,
  currentPage = 1,
  zoom,
  onZoomChange,
  language,
  trackChangesEnabled,
  viewMode = 'print',
  onViewModeChange,
}: StatusBarProps) {
  const langLabel = language.replace('-', ' - ');

  return (
    <div className="status-bar office-status" data-testid="status-bar">
      <div className="status-bar-left">
        <span>{langLabel}</span>
        <span className="status-divider" />
        <span>{words.toLocaleString()} words</span>
        {trackChangesEnabled && (
          <>
            <span className="status-divider" />
            <span className="status-track">Track Changes</span>
          </>
        )}
      </div>
      <div className="status-bar-center">
        <span className="status-page-indicator">
          {currentPage}/{pages}
        </span>
      </div>
      <div className="status-bar-right">
        <div className="status-view-modes">
          <button
            className={viewMode === 'print' ? 'active' : ''}
            onClick={() => onViewModeChange?.('print')}
            title="Print Layout"
          >
            <FileText size={14} />
          </button>
          <button
            className={viewMode === 'web' ? 'active' : ''}
            onClick={() => onViewModeChange?.('web')}
            title="Web Layout"
          >
            <Globe size={14} />
          </button>
          <button
            className={viewMode === 'focus' ? 'active' : ''}
            onClick={() => onViewModeChange?.('focus')}
            title="Focus Mode"
          >
            <Eye size={14} />
          </button>
        </div>
        <button className="status-zoom-btn" onClick={() => onZoomChange(Math.max(50, zoom - 10))}>-</button>
        <input
          type="range"
          className="status-zoom-slider"
          min={50}
          max={200}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        />
        <button className="status-zoom-btn" onClick={() => onZoomChange(Math.min(200, zoom + 10))}>+</button>
        <span className="status-zoom-pct">{zoom}%</span>
      </div>
    </div>
  );
}

