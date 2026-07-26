import { useEffect, useRef, type MouseEvent } from 'react';
import type { Editor } from '@tiptap/react';
import type { RibbonTab } from '@dansword/core';
import { useRibbonState } from './useRibbonState';
import type { RibbonActions, RibbonFlags, RibbonTabProps } from './types';
import { FileTab } from './tabs/FileTab';
import { HomeTab } from './tabs/HomeTab';
import { InsertTab } from './tabs/InsertTab';
import { DrawTab } from './tabs/DrawTab';
import { DesignTab } from './tabs/DesignTab';
import { LayoutTab } from './tabs/LayoutTab';
import { ReferencesTab } from './tabs/ReferencesTab';
import { MailingsTab } from './tabs/MailingsTab';
import { ReviewTab } from './tabs/ReviewTab';
import { ViewTab } from './tabs/ViewTab';
import { PictureFormatTab } from './tabs/PictureFormatTab';
import { TableLayoutTab } from './tabs/TableLayoutTab';

const TABS: { id: RibbonTab; label: string }[] = [
  { id: 'file', label: 'File' },
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'draw', label: 'Draw' },
  { id: 'design', label: 'Design' },
  { id: 'pageLayout', label: 'Layout' },
  { id: 'references', label: 'References' },
  { id: 'mailings', label: 'Mailings' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

/** Tabs that only appear while their object is selected, as in Word. */
const CONTEXTUAL: { id: RibbonTab; label: string }[] = [
  { id: 'pictureFormat', label: 'Picture Format' },
  { id: 'tableLayout', label: 'Table Layout' },
];

const PANELS: Record<RibbonTab, (props: RibbonTabProps) => React.ReactElement> = {
  file: FileTab,
  home: HomeTab,
  insert: InsertTab,
  draw: DrawTab,
  design: DesignTab,
  pageLayout: LayoutTab,
  references: ReferencesTab,
  mailings: MailingsTab,
  review: ReviewTab,
  view: ViewTab,
  pictureFormat: PictureFormatTab,
  tableLayout: TableLayoutTab,
};

export interface RibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  editor: Editor | null;
  actions: RibbonActions;
  flags: RibbonFlags;
  /** Collapse the ribbon to just its tab strip, as Ctrl+F1 does in Word. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Ribbon({
  activeTab,
  onTabChange,
  editor,
  actions,
  flags,
  collapsed,
  onToggleCollapsed,
}: RibbonProps) {
  // Recomputed on every editor transaction, so control state follows the caret.
  const state = useRibbonState(editor);
  const previous = useRef({ image: false, table: false });

  /**
   * Follow the selection into the contextual tabs and back out again.
   *
   * Selecting a picture in Word activates Picture Format; clicking away returns
   * to whichever tab you were on. Without this the contextual tabs exist but
   * nothing ever opens them.
   */
  useEffect(() => {
    const wasImage = previous.current.image;
    const wasTable = previous.current.table;
    previous.current = { image: state.imageActive, table: state.inTable };

    if (state.imageActive && !wasImage) {
      onTabChange('pictureFormat');
      return;
    }
    if (state.inTable && !wasTable && !state.imageActive) {
      onTabChange('tableLayout');
      return;
    }
    if (!state.imageActive && activeTab === 'pictureFormat') onTabChange('home');
    if (!state.inTable && activeTab === 'tableLayout') onTabChange('home');
  }, [state.imageActive, state.inTable, activeTab, onTabChange]);

  // Keep the document selection while a ribbon button is pressed.
  const preserveEditorFocus = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, select, textarea')) return;
    if (target.closest('button')) event.preventDefault();
  };

  const Panel = PANELS[activeTab];
  const visibleContextual = CONTEXTUAL.filter(
    (tab) =>
      (tab.id === 'pictureFormat' && state.imageActive) ||
      (tab.id === 'tableLayout' && state.inTable),
  );

  return (
    <div
      className={`ribbon office-ribbon${collapsed ? ' is-collapsed' : ''}`}
      data-testid="ribbon"
    >
      <div className="ribbon-tabs office-ribbon-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              if (collapsed) onToggleCollapsed();
              onTabChange(tab.id);
            }}
            data-tab={tab.id}
            data-testid={`ribbon-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
        {visibleContextual.map((tab) => (
          <button
            key={tab.id}
            className={`ribbon-tab is-contextual ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            data-tab={tab.id}
            data-testid={`ribbon-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          className="ribbon-collapse"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Pin the ribbon (Ctrl+F1)' : 'Collapse the ribbon (Ctrl+F1)'}
          aria-label={collapsed ? 'Pin the ribbon' : 'Collapse the ribbon'}
          data-testid="ribbon-collapse"
        >
          {collapsed ? '⌃' : '⌄'}
        </button>
      </div>
      {!collapsed && (
        <div
          className="ribbon-panel office-ribbon-panel"
          role="tabpanel"
          onMouseDown={preserveEditorFocus}
        >
          <Panel editor={editor} state={state} actions={actions} flags={flags} />
        </div>
      )}
    </div>
  );
}
