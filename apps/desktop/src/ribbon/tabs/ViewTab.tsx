import {
  BookOpen,
  FileText,
  Globe,
  Grid3x3,
  Hash,
  ListTree,
  Maximize2,
  PanelLeft,
  Printer,
  Ruler,
  ScrollText,
  Search,
  ZoomIn,
} from 'lucide-react';
import {
  RibbonButton,
  RibbonGroup,
  RibbonLine,
  RibbonMenuButton,
  RibbonMenuHeader,
  RibbonMenuItem,
  RibbonMenuSeparator,
  RibbonStack,
} from '../RibbonKit';
import type { RibbonTabProps, ViewMode } from '../types';

const VIEWS: Array<{ id: ViewMode; label: string; icon: typeof FileText; title: string }> = [
  { id: 'read', label: 'Read Mode', icon: BookOpen, title: 'Read the document without the editing chrome' },
  { id: 'print', label: 'Print Layout', icon: FileText, title: 'See the pages as they will print' },
  { id: 'web', label: 'Web Layout', icon: Globe, title: 'See the document as one continuous page' },
  { id: 'outline', label: 'Outline', icon: ListTree, title: 'Work with the heading structure' },
  { id: 'draft', label: 'Draft', icon: ScrollText, title: 'Plain text for fast editing' },
];

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

export function ViewTab({ actions, flags }: RibbonTabProps) {
  return (
    <>
      <RibbonGroup label="Views">
        <RibbonLine>
          {VIEWS.map((view) => (
            <RibbonButton
              key={view.id}
              icon={<view.icon size={20} />}
              label={view.label}
              title={view.title}
              size="large"
              active={flags.viewMode === view.id}
              onClick={() => actions.onSetViewMode(view.id)}
              testId={`view-mode-${view.id}`}
            />
          ))}
        </RibbonLine>
      </RibbonGroup>

      <RibbonGroup label="Immersive">
        <RibbonButton
          icon={<Maximize2 size={20} />}
          label="Focus Mode"
          title="Hide everything but the page"
          size="large"
          active={flags.focusMode}
          onClick={actions.onToggleFocusMode}
          testId="view-focus-mode"
        />
      </RibbonGroup>

      <RibbonGroup label="Show">
        <RibbonStack>
          <RibbonButton
            icon={<Ruler size={14} />}
            label="Ruler"
            title="Show the rulers"
            active={flags.showRuler}
            onClick={actions.onToggleRuler}
            testId="view-ruler"
          />
          <RibbonButton
            icon={<Grid3x3 size={14} />}
            label="Gridlines"
            title="Show a layout grid on the page"
            active={flags.showGridlines}
            onClick={actions.onToggleGridlines}
            testId="view-gridlines"
          />
          <RibbonButton
            icon={<PanelLeft size={14} />}
            label="Navigation Pane"
            title="Browse the document by heading"
            active={flags.navigationOpen}
            onClick={actions.onToggleNavigation}
            testId="view-navigation"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Zoom">
        <RibbonStack>
          <RibbonMenuButton
            icon={<ZoomIn size={20} />}
            label="Zoom"
            title="Zoom"
            size="large"
            testId="view-zoom"
          >
            <RibbonMenuHeader label="Zoom to" />
            {ZOOM_LEVELS.map((level) => (
              <RibbonMenuItem
                key={level}
                label={`${level}%`}
                checked={flags.zoom === level}
                onClick={() => actions.onSetZoom(level)}
              />
            ))}
            <RibbonMenuSeparator />
            <RibbonMenuItem label="Custom…" onClick={actions.onOpenZoomDialog} />
          </RibbonMenuButton>
        </RibbonStack>
        <RibbonStack>
          <RibbonButton
            label="100%"
            title="Zoom to 100%"
            active={flags.zoom === 100}
            onClick={() => actions.onSetZoom(100)}
            testId="view-zoom-100"
          />
          <RibbonButton
            label="One Page"
            title="Fit a whole page on screen"
            onClick={() => actions.onZoomToFit('onePage')}
            testId="view-zoom-one-page"
          />
          <RibbonButton
            label="Page Width"
            title="Fit the page width to the window"
            onClick={() => actions.onZoomToFit('pageWidth')}
            testId="view-zoom-page-width"
          />
        </RibbonStack>
      </RibbonGroup>

      <RibbonGroup label="Window">
        <RibbonStack>
          <RibbonButton
            icon={<Search size={14} />}
            label="Find"
            title="Find (Ctrl+F)"
            onClick={() => actions.onToggleFindReplace('find')}
            testId="view-find"
          />
          <RibbonButton
            icon={<Printer size={14} />}
            label="Print"
            title="Print the document (Ctrl+P)"
            onClick={actions.onPrint}
            testId="view-print"
          />
          <RibbonButton
            icon={<Hash size={14} />}
            label="Word Count"
            title="Word count"
            onClick={actions.onOpenWordCount}
            testId="view-word-count"
          />
        </RibbonStack>
      </RibbonGroup>
    </>
  );
}
