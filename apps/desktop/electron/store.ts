import { app } from 'electron';
import fs from 'node:fs/promises';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const dataDir = path.join(app.getPath('userData'), 'data');
export const settingsPath = path.join(dataDir, 'settings.json');
export const recentsPath = path.join(dataDir, 'recents.json');
export const revisionsDir = path.join(dataDir, 'revisions');
export const windowStatePath = path.join(dataDir, 'window.json');

export function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function ensureDataDir() {
  ensureDir(dataDir);
}

/** Where the app kept its data before the DansWord → Officewrite rename. */
const LEGACY_APP_DIR = 'DansWord';

/**
 * Carry settings, recents and version history across the rename.
 *
 * Electron derives userData from the product name, so renaming the app moved
 * the whole folder from %APPDATA%\DansWord to %APPDATA%\Officewrite. Without
 * this, anyone who had used the app would have been returned to a first-run
 * state — no recents, no pinned files, and no revision history for documents
 * they had been keeping versions of.
 *
 * The guard is simply whether this install already has a data folder. If it
 * does, it owns its own state and nothing is copied over the top; if it does
 * not, there is nothing to lose by importing. That makes the migration safe to
 * attempt on every launch without a marker file to keep in sync.
 */
export function migrateLegacyUserData() {
  if (existsSync(dataDir)) return;

  const legacyDir = path.join(path.dirname(app.getPath('userData')), LEGACY_APP_DIR, 'data');
  if (!existsSync(legacyDir)) return;

  try {
    cpSync(legacyDir, dataDir, { recursive: true });
    console.log(`Migrated user data from ${legacyDir}`);
  } catch (error) {
    // A failed migration must never stop the app starting. The user begins
    // with defaults, and their documents on disk are untouched either way.
    console.warn('Could not migrate legacy user data:', error);
  }
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath: string, data: unknown) {
  ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
