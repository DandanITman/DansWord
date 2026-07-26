import type { Editor } from '@tiptap/react';
import type { DocumentStyle } from '@dansword/core';
import type { ShapeType } from '../extensions/DocShape';
import type { RibbonState } from './useRibbonState';

/** Every command the ribbon can invoke on the surrounding app. */
export interface RibbonActions {
  onPrint: () => void;
  onExportPdf: () => void;
  onInsertImage: () => void;
  onOpenPageSetup: () => void;
  onApplyMarginPreset: (preset: 'Normal' | 'Narrow' | 'Wide') => void;
  onOpenHeaderFooter: () => void;
  onToggleNavigation: () => void;
  onToggleComments: () => void;
  onToggleFindReplace: () => void;
  onToggleFocusMode: () => void;
  onToggleTrackChanges: () => void;
  onFormatPainterCopy: () => void;
  onFormatPainterApply: () => void;
  onOpenStyleEditor: () => void;
  onOpenWatermark: () => void;
  onOpenWordCount: () => void;
  onNew: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onOpenBackstage: () => void;
  onInsertShape: (type: ShapeType) => void;
  onInsertFootnote: () => void;
}

export interface RibbonTabProps {
  editor: Editor | null;
  state: RibbonState;
  actions: RibbonActions;
  /** Flags owned by the app rather than by the editor. */
  flags: {
    trackChangesEnabled: boolean;
    formatPainterActive: boolean;
    focusMode: boolean;
    customStyles: DocumentStyle[];
    /** Tracked changes awaiting a decision, shown on the Review tab. */
    pendingInsertions: number;
    pendingDeletions: number;
  };
}
