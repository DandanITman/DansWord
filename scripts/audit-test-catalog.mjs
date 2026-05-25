#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const catalogPath = join(root, 'tests', 'catalog', 'test-catalog.json');
const validStatuses = new Set(['automated', 'pending', 'electron-manual', 'out-of-scope']);
const validTypes = new Set(['unit', 'e2e', 'visual', 'electron-manual']);
const sourceRoots = [
  'tests/e2e',
  'tests/visual',
  'tests/electron',
  'apps/desktop/src',
  'packages/core/src',
  'packages/openxml/src',
];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.endsWith('-snapshots')) continue;
      walk(path, files);
    } else if (/\.(spec|test)\.[tj]sx?$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function normalizePath(path) {
  return relative(root, path).split(sep).join('/');
}

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const cases = catalog.cases ?? [];
const ids = new Map();
const failures = [];

for (const item of cases) {
  if (!item.id || !/^TC-[A-Z]+-\d{3}$/.test(item.id)) {
    failures.push(`Invalid or missing id: ${JSON.stringify(item)}`);
    continue;
  }
  if (ids.has(item.id)) failures.push(`Duplicate catalog id: ${item.id}`);
  ids.set(item.id, item);
  if (!validStatuses.has(item.status)) failures.push(`${item.id}: invalid status "${item.status}"`);
  if (!validTypes.has(item.type)) failures.push(`${item.id}: invalid type "${item.type}"`);
}

const sources = sourceRoots.flatMap((dir) => walk(join(root, dir))).map((path) => ({
  path: normalizePath(path),
  text: readFileSync(path, 'utf8'),
}));

const references = new Map();
for (const source of sources) {
  for (const match of source.text.matchAll(/TC-[A-Z]+-\d{3}/g)) {
    const id = match[0];
    const list = references.get(id) ?? [];
    list.push(source.path);
    references.set(id, list);
  }
}

for (const id of references.keys()) {
  if (!ids.has(id)) failures.push(`Test source references unknown catalog id: ${id}`);
}

for (const item of cases) {
  if (item.status !== 'automated') continue;
  const refs = references.get(item.id) ?? [];
  if (refs.length === 0) {
    failures.push(`${item.id}: automated but not referenced by any test source`);
    continue;
  }

  const hasExpectedType = refs.some((path) => {
    if (item.type === 'visual') return path.startsWith('tests/visual/');
    if (item.type === 'e2e') return path.startsWith('tests/e2e/') || path.startsWith('tests/electron/');
    if (item.type === 'unit') return path.endsWith('.test.ts') || path.endsWith('.test.tsx');
    return true;
  });

  if (!hasExpectedType) {
    failures.push(`${item.id}: automated ${item.type} case is only referenced from unexpected source(s): ${refs.join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error('Test catalog audit failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Test catalog audit passed: ${cases.length} cases, ${references.size} referenced ids.`);
