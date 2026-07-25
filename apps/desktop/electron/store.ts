import { app } from 'electron';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
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
