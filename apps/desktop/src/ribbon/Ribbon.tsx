import type { MouseEvent, ReactElement } from 'react';
import type { Editor } from '@tiptap/react';
import type { DocumentStyle, RibbonTab } from '@dansword/core';
import { useRibbonState } from './useRibbonState';
import type { RibbonActions, RibbonTabProps } from './types';
import { FileTab } from './tabs/FileTab';
import { EditTab } from './tabs/EditTab';
import { InsertTab } from './tabs/InsertTab';
import { DesignTab } from './tabs/DesignTab';
import { LayoutTab } from './tabs/LayoutTab';
import { ReviewTab } from './tabs/ReviewTab';
import { ViewTab } from './tabs/ViewTab';

const TABS: { id: RibbonTab; label: string }[] = [
  { id: 'file', label: 'File' },
  { id: 'edit', label: 'Edit' },
  { id: 'insert', label: 'Insert' },
  { id: 'design', label: 'Design' },
  { id: 'pageLayout', label: 'Page Layout' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

const PANELS: Record<RibbonTab, (props: RibbonTabProps) => ReactElement> = {
  file: FileTab,
  edit: EditTab,
  insert: InsertTab,
  design: DesignTab,
  pageLayout: LayoutTab,
  review: ReviewTab,
  view: ViewTab,
};

export interface RibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  editor: Editor | null;
  actions: RibbonActions;
  trackChangesEnabled: boolean;
  formatPainterActive: boolean;
  focusMode: boolean;
  customStyles: DocumentStyle[];
  pendingInsertions: number;
  pendingDeletions: number;
}

export function Ribbon({
  activeTab,
  onTabChange,
  editor,
  actions,
  trackChangesEnabled,
  formatPainterActive,
  focusMode,
  customStyles,
  pendingInsertions,
  pendingDeletions,
}: RibbonProps) {
  // Recomputed on every editor transaction, so control state follows the caret.
  const state = useRibbonState(editor);

  // Keep the document selection while a ribbon button is pressed.
  const preserveEditorFocus = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) event.preventDefault();
  };

  const Panel = PANELS[activeTab];

  return (
    <div className="ribbon office-ribbon" data-testid="ribbon">
      <div className="ribbon-tabs office-ribbon-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            data-tab={tab.id}
            data-testid={`ribbon-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ribbon-panel office-ribbon-panel" onMouseDown={preserveEditorFocus}>
        <Panel
          editor={editor}
          state={state}
          actions={actions}
          flags={{
            trackChangesEnabled,
            formatPainterActive,
            focusMode,
            customStyles,
            pendingInsertions,
            pendingDeletions,
          }}
        />
      </div>
    </div>
  );
}
