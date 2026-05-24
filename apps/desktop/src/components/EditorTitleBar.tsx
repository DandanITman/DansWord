import {
  Save,
  Undo2,
  Redo2,
  FilePlus,
  Printer,
  Home,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { appIconUrl } from '../utils/assets';

interface EditorTitleBarProps {
  fileName: string;
  isDirty: boolean;
  theme: 'light' | 'dark';
  onSave: () => void;
  onNew: () => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onHome: () => void;
  onToggleTheme: () => void;
}

export function EditorTitleBar({
  fileName,
  isDirty,
  theme,
  onSave,
  onNew,
  onPrint,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onHome,
  onToggleTheme,
}: EditorTitleBarProps) {
  return (
    <div className="editor-titlebar" data-testid="editor-titlebar">
      <div className="editor-titlebar-qat">
        <button className="qat-btn qat-menu" onClick={onHome} title="Home screen">
          <Menu size={19} />
        </button>
        <button className="qat-btn" onClick={onSave} title="Save (Ctrl+S)" data-testid="titlebar-save">
          <Save size={16} />
        </button>
        <button className="qat-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 size={16} />
        </button>
        <button className="qat-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 size={16} />
        </button>
        <button className="qat-btn" onClick={onNew} title="New document" data-testid="titlebar-new">
          <FilePlus size={16} />
        </button>
        <button className="qat-btn" onClick={onPrint} title="Print">
          <Printer size={16} />
        </button>
        <span className="editor-titlebar-product">DansWord</span>
      </div>
      <div className="editor-titlebar-doc">
        <span className="editor-titlebar-name" data-testid="editor-filename">
          {fileName}{isDirty ? ' *' : ''}
        </span>
      </div>
      <div className="editor-titlebar-right">
        <button className="qat-btn" onClick={onHome} title="Home screen">
          <Home size={16} />
        </button>
        <button className="qat-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <div className="editor-user-badge">
          <span>Local</span>
          <img src={appIconUrl} alt="" width={22} height={22} />
        </div>
      </div>
    </div>
  );
}
