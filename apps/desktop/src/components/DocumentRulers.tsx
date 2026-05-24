import type { ReactNode, CSSProperties } from 'react';
import type { PageSetup } from '@dansword/core';
import { PAGE_DIMENSIONS } from '@dansword/core';

interface DocumentRulersProps {
  pageSetup: PageSetup;
  children: ReactNode;
}

function RulerHorizontal({ pageSetup }: { pageSetup: PageSetup }) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const width = pageSetup.orientation === 'portrait' ? dims.width : dims.height;
  const marginLeft = pageSetup.margins.left;
  const marginRight = pageSetup.margins.right;
  const inches = Math.ceil(width / 96);

  return (
    <div className="ruler-h" style={{ width }}>
      <div className="ruler-h-track">
        {Array.from({ length: inches + 1 }, (_, i) => (
          <span key={i} className="ruler-h-mark" style={{ left: i * 96 }}>
            {i}
          </span>
        ))}
        <div
          className="ruler-h-margin-left"
          style={{ width: marginLeft }}
        />
        <div
          className="ruler-h-margin-right"
          style={{ width: marginRight }}
        />
      </div>
    </div>
  );
}

function RulerVertical({ pageSetup }: { pageSetup: PageSetup }) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const height = pageSetup.orientation === 'portrait' ? dims.height : dims.width;
  const inches = Math.ceil(height / 96);

  return (
    <div className="ruler-v" style={{ minHeight: height }}>
      {Array.from({ length: inches + 1 }, (_, i) => (
        <span key={i} className="ruler-v-mark" style={{ top: i * 96 }}>
          {i}
        </span>
      ))}
    </div>
  );
}

export function DocumentRulers({ pageSetup, children }: DocumentRulersProps) {
  const dims = PAGE_DIMENSIONS[pageSetup.size];
  const width = pageSetup.orientation === 'portrait' ? dims.width : dims.height;

  return (
    <div
      className="doc-rulers-grid"
      style={{ '--page-width': `${width}px` } as CSSProperties}
    >
      <div className="doc-rulers-corner" />
      <RulerHorizontal pageSetup={pageSetup} />
      <RulerVertical pageSetup={pageSetup} />
      <div className="doc-rulers-content">{children}</div>
    </div>
  );
}

/** @deprecated use DocumentRulers */
export function Ruler({ pageSetup }: { pageSetup: PageSetup }) {
  return <RulerHorizontal pageSetup={pageSetup} />;
}
