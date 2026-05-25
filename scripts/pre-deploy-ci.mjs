#!/usr/bin/env node
/**
 * CI pre-deploy gate (Linux-friendly): skips visual snapshots.
 * Full local gate including visual: npm run pre-deploy
 */
import { spawnSync } from 'node:child_process';

function run(label, command, args) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('Pages site files', 'npm', ['run', 'verify:pages']);
run('Test catalog audit', 'npm', ['run', 'test:catalog']);
run('Typecheck', 'npm', ['run', 'typecheck']);
run('Build', 'npm', ['run', 'build']);
run('Unit tests', 'npm', ['run', 'test:unit']);
run('End-to-end tests', 'npm', ['run', 'test:e2e']);

console.log('\n✅ CI pre-deploy QA passed (visual tests run separately on Windows).\n');
