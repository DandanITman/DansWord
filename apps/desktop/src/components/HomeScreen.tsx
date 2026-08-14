import { useMemo, useState } from 'react';
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
  LayoutGrid,
  Search,
  ArrowRight,
} from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@officewrite/core';
import type { RecentFile, AppSettings, Template } from '@officewrite/core';
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
  onRemoveRecent: (path: string) => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onGoToEditor: () => void;
}

/**
 * Thumbnails are drawn from the template's own content, so the only thing left
 * to choose is an accent. Colouring by category rather than by id means a new
 * template arrives already styled instead of silently falling back to blue.
 */
const CATEGORY_COLOR: Record<string, string> = {
  Basic: '#2563eb',
  Business: '#0891b2',
  'Resumes and Cover Letters': '#059669',
  Letters: '#7c3aed',
  Education: '#d97706',
  Flyers: '#db2777',
  Cards: '#e11d48',
  Holiday: '#c026d3',
  Personal: '#0d9488',
};

/**
 * The home rail is a shelf, not the catalogue: it holds the handful people
 * reach for most and sends everyone else to the gallery. Ordered deliberately,
 * because the rail scrolls horizontally and the tail rarely gets seen.
 */
const FEATURED_TEMPLATE_IDS = [
  'letter',
  'resume',
  'coverletter',
  'report',
  'invoice',
  'agenda',
  'essay',
  'todolist',
];

function colorFor(template: Template) {
  return CATEGORY_COLOR[template.category] ?? CATEGORY_COLOR.Basic;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * The shape of a TipTap node the thumbnail needs. TEMPLATES is declared `as
 * const`, so its real types are wide literal unions that differ per node —
 * some carry attrs, some carry content, some carry neither. Reading
 * defensively is simpler than threading those through, and it cannot break
 * when a template is edited.
 */
type PreviewBlock = {
  type?: string;
  attrs?: { level?: number; textAlign?: string };
  content?: readonly unknown[];
};

/**
 * Centred text is most of what distinguishes a flyer or an invitation from a
 * letter, so the thumbnail has to show it or half the catalogue looks alike.
 */
function alignmentOf(node: unknown): React.CSSProperties {
  const align = (node as PreviewBlock | null)?.attrs?.textAlign;
  if (align === 'center') return { alignSelf: 'center' };
  if (align === 'right') return { alignSelf: 'flex-end' };
  return {};
}

/** Total characters under a node, so a bar's width reflects its real text. */
function textLengthOf(node: unknown): number {
  const block = node as (PreviewBlock & { text?: string }) | null;
  if (typeof block?.text === 'string') return block.text.length;
  if (!Array.isArray(block?.content)) return 0;
  return block.content.reduce<number>((sum, child) => sum + textLengthOf(child), 0);
}

/**
 * Bar width from text length. The base offset matters: a purely proportional
 * scale pinned every short line in the letter template to the same minimum,
 * so four different lines drew as four identical stubs. Starting at 18% and
 * rising steeply spreads short and medium lines apart, which is where the
 * differences between these templates actually are.
 */
function widthFor(node: unknown): string {
  return `${Math.min(94, 18 + textLengthOf(node) * 2.2)}%`;
}

/** How many blocks fit in the thumbnail before it stops looking like a page. */
const PREVIEW_BLOCK_LIMIT = 9;

/**
 * A miniature of the template's first page, built from the template's own
 * content rather than hand-drawn lines. Previously every thumbnail was four
 * fixed bars that resembled nothing in particular and silently stopped
 * matching whenever a template changed.
 */
function TemplatePreview({ blocks }: { blocks: readonly unknown[] }) {
  const rendered: React.ReactNode[] = [];

  for (const node of blocks) {
    if (rendered.length >= PREVIEW_BLOCK_LIMIT) break;
    const block = node as PreviewBlock;
    const key = rendered.length;

    if (block?.type === 'heading') {
      const level = block.attrs?.level ?? 1;
      rendered.push(
        <div
          key={key}
          className={level === 1 ? 'tpl-line tpl-title' : 'tpl-line tpl-head'}
          style={{ width: widthFor(node), ...alignmentOf(node) }}
        />,
      );
      continue;
    }

    if (block?.type === 'bulletList' || block?.type === 'orderedList' || block?.type === 'taskList') {
      const marker = block.type === 'taskList' ? 'tpl-bullet-box' : 'tpl-bullet-dot';
      for (const item of block.content ?? []) {
        if (rendered.length >= PREVIEW_BLOCK_LIMIT) break;
        rendered.push(
          <div key={`b${rendered.length}`} className="tpl-bullet-row">
            <span className={marker} />
            <span className="tpl-line" style={{ width: widthFor(item) }} />
          </div>,
        );
      }
      continue;
    }

    /* A table is the whole point of the invoice and planner templates, so it
       draws as a grid rather than collapsing into one very long bar. */
    if (block?.type === 'table') {
      const rows = (block.content ?? []).slice(0, 4);
      const columns = Math.min(4, (rows[0] as PreviewBlock | undefined)?.content?.length ?? 2);
      rendered.push(
        <div key={key} className="tpl-table">
          {rows.map((_, rowIndex) => (
            <div key={rowIndex} className={rowIndex === 0 ? 'tpl-table-row head' : 'tpl-table-row'}>
              {Array.from({ length: columns }, (_, cell) => (
                <span key={cell} className="tpl-table-cell" />
              ))}
            </div>
          ))}
        </div>,
      );
      continue;
    }

    if (block?.type === 'horizontalRule') {
      rendered.push(<div key={key} className="tpl-rule" />);
      continue;
    }

    if (block?.type === 'pageBreak') {
      rendered.push(<div key={key} className="tpl-rule dashed" />);
      continue;
    }

    // An empty paragraph is spacing in the document, so it is spacing here.
    if (textLengthOf(node) === 0) {
      rendered.push(<div key={key} className="tpl-gap" />);
      continue;
    }

    rendered.push(
      <div key={key} className="tpl-line" style={{ width: widthFor(node), ...alignmentOf(node) }} />,
    );
  }

  if (rendered.length === 0) {
    return (
      <div className="tpl-preview tpl-preview-blank">
        <FilePlus size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return <div className="tpl-preview tpl-preview-doc">{rendered}</div>;
}

function TemplateCard({
  template,
  onPick,
  showDescription = false,
}: {
  template: Template;
  onPick: () => void;
  showDescription?: boolean;
}) {
  return (
    <button
      className="home-tpl-card"
      data-testid={`home-template-${template.id}`}
      onClick={onPick}
      title={template.description}
    >
      <div className="home-tpl-thumb" style={{ borderColor: colorFor(template) }}>
        <TemplatePreview blocks={template.content.content} />
      </div>
      <span>{template.name}</span>
      {showDescription && <small className="home-tpl-desc">{template.description}</small>}
    </button>
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
  onRemoveRecent,
  onOpenSettings,
  onToggleTheme,
  onGoToEditor,
}: HomeScreenProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sidebarItem, setSidebarItem] = useState<SidebarItem>('home');
  const [tab, setTab] = useState<HomeTab>('recent');
  const [newExpanded, setNewExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const favorites = recents.filter((r) => r.pinned);
  const recentDocs = recents.filter((r) => !r.pinned);
  const displayed = tab === 'favorites' ? favorites : recentDocs;

  const featured = FEATURED_TEMPLATE_IDS.map((id) => TEMPLATES.find((t) => t.id === id)).filter(
    (t): t is Template => t !== undefined,
  );

  /**
   * One pass over name, description, category and keywords. Keywords exist for
   * the words people actually type — "CV" finds the resumes, "christmas" finds
   * the holiday templates — none of which appear in any template's name.
   */
  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return TEMPLATES.filter((template) => {
      if (template.id === 'blank') return false;
      if (category && template.category !== category) return false;
      if (terms.length === 0) return true;
      const haystack = [
        template.name,
        template.description,
        template.category,
        ...template.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [query, category]);

  const handleSidebar = (item: SidebarItem) => {
    setSidebarItem(item);
    if (item === 'open') onOpenFile();
  };

  /** Opening the gallery from the rail should not inherit a stale filter. */
  const showGallery = (preset: string | null = null) => {
    setSidebarItem('new');
    setCategory(preset);
    setQuery('');
  };

  return (
    <div className="home-backstage" data-testid="home-screen">
      {aboutOpen && (
        <div className="backdrop" onClick={() => setAboutOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()} data-testid="about-dialog">
            <h2>About Officewrite</h2>
            <p className="muted">
              A free, open-source word processor. Local-first: documents stay on this
              machine and the app makes no network requests.
            </p>
            <p className="muted">Licensed under MIT.</p>
            <div className="dialog-actions">
              <button className="btn-primary" onClick={() => setAboutOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
            onClick={() => showGallery()}
            data-testid="home-nav-new"
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
          <button onClick={() => setAboutOpen(true)} data-testid="home-about">
            <Info size={18} /> About
          </button>
        </nav>

        <div className="home-sidebar-brand">
          <img src={appIconUrl} alt="" width={20} height={20} />
          <span>Officewrite</span>
        </div>
      </aside>

      {sidebarItem === 'new' ? (
        <main className="home-main" data-testid="template-gallery">
          <header className="home-main-header">
            <div>
              <h1>New</h1>
              <p className="home-greeting">
                {TEMPLATES.length} templates, all editable — nothing here is locked or paid for.
              </p>
            </div>
            <div className="home-header-actions">
              <button className="home-header-chip" onClick={() => setSidebarItem('home')}>
                <ChevronLeft size={14} /> Back to Home
              </button>
            </div>
          </header>

          <div className="home-template-rail-scroll">
            <div className="home-template-rail">
              <button
                className="home-tpl-card home-tpl-blank"
                onClick={() => onNewFromTemplate('blank')}
                data-testid="gallery-blank-template"
              >
                <div className="home-tpl-thumb blank">
                  <FilePlus size={32} strokeWidth={1.5} />
                </div>
                <span>Blank Document</span>
              </button>
            </div>
          </div>

          <div className="home-template-search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              placeholder="Search templates"
              aria-label="Search templates"
              data-testid="template-search"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="home-template-filters">
            <span className="home-filter-label">Categories:</span>
            <button
              className={category === null ? 'home-filter-chip active' : 'home-filter-chip'}
              onClick={() => setCategory(null)}
            >
              All
            </button>
            {TEMPLATE_CATEGORIES.filter((name) => name !== 'Basic').map((name) => (
              <button
                key={name}
                className={category === name ? 'home-filter-chip active' : 'home-filter-chip'}
                onClick={() => setCategory(category === name ? null : name)}
              >
                {name}
              </button>
            ))}
          </div>

          {results.length === 0 ? (
            <div className="home-empty-table">
              <FileText size={32} strokeWidth={1.25} />
              <p>
                Nothing matches “{query}”. Try a broader word, or start from a blank
                document and build what you need.
              </p>
              <button className="icon-btn primary" onClick={() => onNewFromTemplate('blank')}>
                New Document
              </button>
            </div>
          ) : (
            <div className="home-template-grid" data-testid="template-grid">
              {results.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  showDescription
                  onPick={() => onNewFromTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
      <main className="home-main">
        <header className="home-main-header">
          <div>
            <h1>Get Started</h1>
            <p className="home-greeting">
              Free Word alternative for everyone — a non-profit educational project, open source for anyone to edit.
            </p>
          </div>
          <div className="home-header-actions">
            <button className="home-header-chip" onClick={onBrowseFolder}>
              <LayoutGrid size={14} /> Browse folder
            </button>
          </div>
        </header>

        <section className="home-new-panel">
          <div className="home-panel-head">
            <button className="home-panel-toggle" onClick={() => setNewExpanded((v) => !v)}>
              {newExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span>New</span>
            </button>
            <button
              className="home-more-templates"
              onClick={() => showGallery()}
              data-testid="home-more-templates"
            >
              More templates <ArrowRight size={15} />
            </button>
          </div>
          {newExpanded && (
            <div className="home-template-rail-scroll">
              <div className="home-template-rail">
              <button className="home-tpl-card home-tpl-blank" onClick={() => onNewFromTemplate('blank')} data-testid="home-blank-template">
                <div className="home-tpl-thumb blank">
                  <FilePlus size={32} strokeWidth={1.5} />
                </div>
                <span>Blank Document</span>
              </button>
              {featured.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPick={() => onNewFromTemplate(template.id)}
                />
              ))}
              </div>
            </div>
          )}
        </section>

        <section className="home-docs-panel">
          <div className="home-tabs">
            <button className={tab === 'recent' ? 'active' : ''} onClick={() => setTab('recent')} data-testid="home-tab-recent">
              <Clock size={14} /> Recent
            </button>
            <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')} data-testid="home-tab-favorites">
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
                    <tr key={file.path} className="home-doc-row" data-testid="home-recent-row">
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
                        <button
                          className="icon-btn ghost-muted"
                          onClick={() => onRemoveRecent(file.path)}
                          title="Remove from recent"
                          data-testid={`home-remove-recent-${file.name}`}
                        >
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
      )}
    </div>
  );
}
