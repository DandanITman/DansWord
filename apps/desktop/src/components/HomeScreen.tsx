import { useState } from 'react';
import {
  Home,
  FilePlus,
  FolderOpen,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Settings,
  Info,
  Moon,
  Sun,
  FileText,
  MoreHorizontal,
  Pin,
  PinOff,
  Mail,
  BookOpen,
  User,
  LayoutGrid,
} from 'lucide-react';
import { TEMPLATES } from '@dansword/core';
import type { RecentFile, AppSettings } from '@dansword/core';
import { appIconUrl } from '../utils/assets';

type HomeTab = 'recent' | 'favorites';
type SidebarItem = 'home' | 'new' | 'open';

interface HomeScreenProps {
  recents: RecentFile[];
  settings: AppSettings;
  onNewFromTemplate: (templateId: string) => void;
  onOpenFile: () => void;
  onOpenRecent: (path: string) => void;
  onBrowseFolder: () => void;
  onTogglePin: (path: string) => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onGoToEditor: () => void;
}

const TEMPLATE_META: Record<
  string,
  { icon: typeof FileText; color: string; preview: string }
> = {
  blank: { icon: FilePlus, color: '#2563eb', preview: 'blank' },
  letter: { icon: Mail, color: '#7c3aed', preview: 'letter' },
  report: { icon: BookOpen, color: '#0891b2', preview: 'report' },
  resume: { icon: User, color: '#059669', preview: 'resume' },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TemplatePreview({ type }: { type: string }) {
  if (type === 'blank') {
    return (
      <div className="tpl-preview tpl-preview-blank">
        <FilePlus size={28} strokeWidth={1.5} />
      </div>
    );
  }
  if (type === 'letter') {
    return (
      <div className="tpl-preview tpl-preview-doc">
        <div className="tpl-line w60" />
        <div className="tpl-line w40" />
        <div className="tpl-line w80" />
        <div className="tpl-line w70" />
      </div>
    );
  }
  if (type === 'report') {
    return (
      <div className="tpl-preview tpl-preview-doc">
        <div className="tpl-line w70 bold" />
        <div className="tpl-line w50 bold" />
        <div className="tpl-line w90" />
        <div className="tpl-line w85" />
      </div>
    );
  }
  return (
    <div className="tpl-preview tpl-preview-doc">
      <div className="tpl-line w55 bold" />
      <div className="tpl-line w45" />
      <div className="tpl-line w50 bold" />
      <div className="tpl-line w75" />
    </div>
  );
}

export function HomeScreen({
  recents,
  settings,
  onNewFromTemplate,
  onOpenFile,
  onOpenRecent,
  onBrowseFolder,
  onTogglePin,
  onOpenSettings,
  onToggleTheme,
  onGoToEditor,
}: HomeScreenProps) {
  const [sidebarItem, setSidebarItem] = useState<SidebarItem>('home');
  const [tab, setTab] = useState<HomeTab>('recent');
  const [newExpanded, setNewExpanded] = useState(true);

  const favorites = recents.filter((r) => r.pinned);
  const recentDocs = recents.filter((r) => !r.pinned);
  const displayed = tab === 'favorites' ? favorites : recentDocs;

  const handleSidebar = (item: SidebarItem) => {
    setSidebarItem(item);
    if (item === 'new') onNewFromTemplate('blank');
    if (item === 'open') onOpenFile();
  };

  return (
    <div className="home-backstage" data-testid="home-screen">
      <aside className="home-sidebar">
        <button className="home-sidebar-back" onClick={onGoToEditor} title="Back to editor">
          <ChevronLeft size={20} />
        </button>

        <nav className="home-sidebar-nav">
          <button
            className={sidebarItem === 'home' ? 'active' : ''}
            onClick={() => { setSidebarItem('home'); }}
          >
            <Home size={18} /> Home
          </button>
          <button
            className={sidebarItem === 'new' ? 'active' : ''}
            onClick={() => handleSidebar('new')}
          >
            <FilePlus size={18} /> New
          </button>
          <button
            className={sidebarItem === 'open' ? 'active' : ''}
            onClick={() => handleSidebar('open')}
          >
            <FolderOpen size={18} /> Open
          </button>
        </nav>

        <div className="home-sidebar-divider" />

        <nav className="home-sidebar-nav secondary">
          <button onClick={onOpenSettings}>
            <Settings size={18} /> Settings
          </button>
          <button onClick={onToggleTheme}>
            {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {settings.theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button disabled className="muted-item">
            <Info size={18} /> About
          </button>
        </nav>

        <div className="home-sidebar-brand">
          <img src={appIconUrl} alt="" width={20} height={20} />
          <span>DansWord</span>
        </div>
      </aside>

      <main className="home-main">
        <header className="home-main-header">
          <div>
            <h1>Get Started</h1>
            <p className="home-greeting">Create, open, and manage your documents locally.</p>
          </div>
          <div className="home-header-actions">
            <button className="home-header-chip" onClick={onBrowseFolder}>
              <LayoutGrid size={14} /> Browse folder
            </button>
            <div className="home-user-chip">
              <span className="home-user-avatar">DW</span>
              <span>Local</span>
            </div>
          </div>
        </header>

        <section className="home-new-panel">
          <button className="home-panel-toggle" onClick={() => setNewExpanded((v) => !v)}>
            {newExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>New</span>
          </button>
          {newExpanded && (
            <div className="home-template-rail">
              <button className="home-tpl-card home-tpl-blank" onClick={() => onNewFromTemplate('blank')} data-testid="home-blank-template">
                <div className="home-tpl-thumb blank">
                  <FilePlus size={32} strokeWidth={1.5} />
                </div>
                <span>Blank Document</span>
              </button>
              {TEMPLATES.filter((t) => t.id !== 'blank').map((template) => {
                const meta = TEMPLATE_META[template.id] ?? TEMPLATE_META.blank;
                return (
                  <button
                    key={template.id}
                    className="home-tpl-card"
                    onClick={() => onNewFromTemplate(template.id)}
                  >
                    <div className="home-tpl-thumb" style={{ borderColor: meta.color }}>
                      <TemplatePreview type={meta.preview} />
                    </div>
                    <span>{template.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="home-docs-panel">
          <div className="home-tabs">
            <button className={tab === 'recent' ? 'active' : ''} onClick={() => setTab('recent')}>
              <Clock size={14} /> Recent
            </button>
            <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>
              <Star size={14} /> Favorites
            </button>
          </div>

          {displayed.length === 0 ? (
            <div className="home-empty-table">
              <FileText size={32} strokeWidth={1.25} />
              <p>
                {tab === 'favorites'
                  ? 'Pin documents from Recent to see them here.'
                  : 'No recent documents yet. Create a new document or open a file.'}
              </p>
              <button className="icon-btn primary" onClick={() => onNewFromTemplate('blank')}>
                New Document
              </button>
            </div>
          ) : (
            <div className="home-doc-table-wrap">
              <table className="home-doc-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date modified</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((file) => (
                    <tr key={file.path} className="home-doc-row">
                      <td>
                        <button className="home-doc-link" onClick={() => onOpenRecent(file.path)}>
                          <span className="home-doc-icon">
                            <FileText size={16} />
                          </span>
                          <span className="home-doc-text">
                            <strong>{file.name}</strong>
                            <small>{file.path}</small>
                          </span>
                        </button>
                      </td>
                      <td className="home-doc-date">{formatDate(file.lastOpened)}</td>
                      <td className="home-doc-actions">
                        <button
                          className="icon-btn ghost-muted"
                          onClick={() => onTogglePin(file.path)}
                          title={file.pinned ? 'Unpin' : 'Pin to favorites'}
                        >
                          {file.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button className="icon-btn ghost-muted" title="More">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
