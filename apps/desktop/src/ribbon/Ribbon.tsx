import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Editor } from '@tiptap/react';
import type { RibbonTab } from '@dansword/core';
import { useRibbonState } from './useRibbonState';
import type { RibbonActions, RibbonFlags, RibbonTabProps } from './types';
import { HomeTab } from './tabs/HomeTab';
import { InsertTab } from './tabs/InsertTab';
import { DrawTab } from './tabs/DrawTab';
import { LayoutTab } from './tabs/LayoutTab';
import { ReferencesTab } from './tabs/ReferencesTab';
import { ReviewTab } from './tabs/ReviewTab';
import { ViewTab } from './tabs/ViewTab';
import { HelpTab } from './tabs/HelpTab';
import { PictureFormatTab } from './tabs/PictureFormatTab';
import { TableLayoutTab } from './tabs/TableLayoutTab';
import { FileMenu } from '../components/FileMenu';
import {
  RibbonStripActions,
  type EditingMode,
  type RibbonLayout,
  type RibbonVisibility,
} from '../components/RibbonStripActions';

/**
 * Below this panel width the ribbon switches to its compact density. Home is
 * the widest tab at full density — about 1245px with its four Styles tiles —
 * so this sits just above that and 1280px still gets the full gallery.
 */
const COMPACT_BELOW = 1250;

const TABS: { id: RibbonTab; label: string }[] = [
  { id: 'file', label: 'File' },
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'pageLayout', label: 'Layout' },
  { id: 'references', label: 'References' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
  { id: 'help', label: 'Help' },
];

/** Tabs that only appear while their object is selected, as in Word. */
const CONTEXTUAL: { id: RibbonTab; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'pictureFormat', label: 'Picture Format' },
  { id: 'tableLayout', label: 'Table Layout' },
];

// 'file' is absent on purpose: it opens a dropdown, not a panel.
const PANELS: Record<Exclude<RibbonTab, 'file'>, (props: RibbonTabProps) => React.ReactElement> = {
  home: HomeTab,
  insert: InsertTab,
  pageLayout: LayoutTab,
  references: ReferencesTab,
  review: ReviewTab,
  view: ViewTab,
  help: HelpTab,
  draw: DrawTab,
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
  /** File > Rename, Create a Copy and Delete need a document on disk. */
  hasFile: boolean;
  layout: RibbonLayout;
  onSetLayout: (layout: RibbonLayout) => void;
  visibility: RibbonVisibility;
  onSetVisibility: (visibility: RibbonVisibility) => void;
  editingMode: EditingMode;
  onSetEditingMode: (mode: EditingMode) => void;
  onToggleComments: () => void;
}

export function Ribbon({
  activeTab,
  onTabChange,
  editor,
  actions,
  flags,
  collapsed,
  onToggleCollapsed,
  hasFile,
  layout,
  onSetLayout,
  visibility,
  onSetVisibility,
  editingMode,
  onSetEditingMode,
  onToggleComments,
}: RibbonProps) {
  const [fileMenuAnchor, setFileMenuAnchor] = useState<HTMLElement | null>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  // Recomputed on every editor transaction, so control state follows the caret.
  const state = useRibbonState(editor);
  const previous = useRef({ image: false, table: false, ink: false });

  /**
   * The panel used to scroll sideways once the groups outgrew the window, so
   * below about 1280px the rightmost groups simply went behind a scrollbar —
   * Word never scrolls its ribbon. The window can be as narrow as 900px, so
   * the density steps down first and buys back the space instead.
   */
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // A width threshold, not a scrollWidth measurement: compacting changes
    // what scrollWidth reports, so feeding it back in oscillates and then
    // latches — the ribbon sat compact at 1280px with 400px to spare.
    const measure = () => setDensity(panel.clientWidth < COMPACT_BELOW ? 'compact' : 'normal');

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [activeTab, collapsed]);

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
    const wasInk = previous.current.ink;
    previous.current = { image: state.imageActive, table: state.inTable, ink: state.inkActive };

    // Ink first: a drawing canvas is a block atom, so it can never be selected
    // at the same time as a picture or from inside a table.
    if (state.inkActive && !wasInk) {
      onTabChange('draw');
      return;
    }
    if (state.imageActive && !wasImage) {
      onTabChange('pictureFormat');
      return;
    }
    if (state.inTable && !wasTable && !state.imageActive) {
      onTabChange('tableLayout');
      return;
    }
    if (!state.inkActive && activeTab === 'draw') onTabChange('home');
    if (!state.imageActive && activeTab === 'pictureFormat') onTabChange('home');
    if (!state.inTable && activeTab === 'tableLayout') onTabChange('home');
  }, [state.imageActive, state.inTable, state.inkActive, activeTab, onTabChange]);

  // Keep the document selection while a ribbon button is pressed.
  const preserveEditorFocus = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, select, textarea')) return;
    if (target.closest('button')) event.preventDefault();
  };

  // The File tab never becomes active, so fall back to whatever is showing.
  const Panel = PANELS[activeTab === 'file' ? 'home' : activeTab];
  const visibleContextual = CONTEXTUAL.filter(
    (tab) =>
      (tab.id === 'draw' && state.inkActive) ||
      (tab.id === 'pictureFormat' && state.imageActive) ||
      (tab.id === 'tableLayout' && state.inTable),
  );

  return (
    <div
      className={`ribbon office-ribbon${collapsed ? ' is-collapsed' : ''}${
        layout === 'singleLine' ? ' is-single-line' : ''
      }`}
      data-testid="ribbon"
    >
      <div className="ribbon-tabs office-ribbon-tabs" role="tablist">
        {TABS.map((tab) =>
          tab.id === 'file' ? (
            <button
              key={tab.id}
              ref={setFileMenuAnchor}
              className={`ribbon-tab ${fileMenuOpen ? 'active' : ''}`}
              aria-haspopup="menu"
              aria-expanded={fileMenuOpen}
              onClick={() => setFileMenuOpen((open) => !open)}
              data-tab={tab.id}
              data-testid={`ribbon-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ) : (
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
          ),
        )}
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
        <RibbonStripActions
          unresolvedComments={flags.unresolvedComments}
          commentsOpen={flags.commentsOpen}
          onToggleComments={onToggleComments}
          editingMode={editingMode}
          onSetEditingMode={onSetEditingMode}
          layout={layout}
          onSetLayout={onSetLayout}
          visibility={visibility}
          onSetVisibility={onSetVisibility}
        />
      </div>
      {!collapsed && (
        <div
          ref={panelRef}
          className={`ribbon-panel office-ribbon-panel${density === 'compact' ? ' is-compact' : ''}`}
          role="tabpanel"
          onMouseDown={preserveEditorFocus}
        >
          <Panel editor={editor} state={state} actions={actions} flags={flags} />
        </div>
      )}
      <FileMenu
        anchor={fileMenuAnchor}
        open={fileMenuOpen}
        onClose={() => setFileMenuOpen(false)}
        actions={actions}
        hasFile={hasFile}
      />
    </div>
  );
}
