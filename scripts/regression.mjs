#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(label, command, args) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('Test catalog audit', 'npm', ['run', 'test:catalog']);
run('Typecheck', 'npm', ['run', 'typecheck']);
run('Build', 'npm', ['run', 'build']);
run('Unit tests', 'npm', ['run', 'test:unit']);
run('End-to-end tests', 'npm', ['run', 'test:e2e']);
run('Visual regression tests', 'npm', ['run', 'test:visual']);

console.log('\nRegression suite completed successfully.\n');
