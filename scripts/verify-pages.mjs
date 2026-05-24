#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = ['docs/index.html', 'docs/site.css', 'docs/site.js', 'docs/logo.png'];
let failed = false;

console.log('Checking GitHub Pages site files...\n');

for (const file of required) {
  const path = join(root, file);
  if (existsSync(path)) {
    console.log(`  ok  ${file}`);
  } else {
    console.error(`  missing  ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('\nLocal Pages files look good.');
console.log('\nBefore the first GitHub Pages deploy succeeds, enable Pages once:');
console.log('  1. Open https://github.com/DandanITman/DansWord/settings/pages');
console.log('  2. Build and deployment → Source → GitHub Actions');
console.log('  3. Re-run the "Deploy GitHub Pages" workflow if a prior run failed');
console.log('\nLive site (after deploy): https://dandanitman.github.io/DansWord/\n');
