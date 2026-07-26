import type { DansWordAPI } from './api';

export type { DansWordAPI, ListedDocument, ImportDocResult } from './api';

/**
 * DansWord's file, print and spell-check features are provided by the Electron
 * host process. Opened as a plain web page there is no bridge, and every one of
 * those calls would throw — previously as an unguarded `TypeError` during the
 * first mount effect, which blanked the screen. Resolve it once, here, and let
 * callers ask before reaching.
 */
export function isPlatformAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.dansword === 'object' && window.dansword !== null;
}

export function getPlatform(): DansWordAPI {
  if (!isPlatformAvailable()) {
    throw new Error(
      'DansWord desktop features are unavailable: the Electron bridge is not present. ' +
        'Run the packaged app or `npm run dev` rather than opening the page directly.',
    );
  }
  return window.dansword;
}

/**
 * Join a directory and a file name using whichever separator the host already
 * uses. Paths come back from the main process in native form, so inspecting the
 * directory is more reliable than guessing from `navigator.platform`.
 */
export function joinPath(dir: string, name: string): string {
  if (!dir) return name;
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/';
  const trimmed = dir.replace(/[\\/]+$/, '');
  return `${trimmed}${sep}${name}`;
}

/** Final path segment, separator-agnostic. */
export function baseName(path: string | null, fallback = 'Untitled'): string {
  if (!path) return fallback;
  return path.split(/[\\/]/).pop() || fallback;
}

/** Lower-cased extension without the dot, or '' when there is none. */
export function extensionOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? '';
  const idx = base.lastIndexOf('.');
  return idx > 0 ? base.slice(idx + 1).toLowerCase() : '';
}
