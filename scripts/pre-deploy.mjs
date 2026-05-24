#!/usr/bin/env node
/**
 * Pre-deploy QA gate. Blocks deploy unless all checks pass or DEPLOY_OVERRIDE=true.
 *
 * Usage:
 *   npm run pre-deploy
 *   DEPLOY_OVERRIDE=true npm run pre-deploy   # emergency only — user must explicitly request
 */
import { spawnSync } from 'node:child_process';

const override =
  process.env.DEPLOY_OVERRIDE === 'true' ||
  process.env.DEPLOY_OVERRIDE === '1' ||
  process.argv.includes('--override');

const steps = [
  { id: 'verify-pages', label: 'Pages site files', command: 'npm', args: ['run', 'verify:pages'] },
  { id: 'regression', label: 'Full regression suite', command: 'npm', args: ['run', 'regression'] },
];

console.log('DansWord pre-deploy QA gate\n');

if (override) {
  console.warn('⚠️  DEPLOY_OVERRIDE is set — skipping QA checks (user explicitly accepted risk).\n');
  process.exit(0);
}

const failures = [];

for (const step of steps) {
  console.log(`\n=== ${step.label} ===\n`);
  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    failures.push({
      id: step.id,
      label: step.label,
      exitCode: result.status ?? 1,
    });
  }
}

if (failures.length === 0) {
  console.log('\n✅ Pre-deploy QA passed. Safe to deploy.\n');
  process.exit(0);
}

console.error('\n❌ Pre-deploy QA FAILED — deploy is BLOCKED.\n');
console.error('Failed checks:\n');
for (const failure of failures) {
  console.error(`  • ${failure.label} (${failure.id}) — exit code ${failure.exitCode}`);
}
console.error('\nWhat to do:\n');
console.error('  1. Fix the failing tests or build errors listed above.');
console.error('  2. Re-run: npm run pre-deploy');
console.error('  3. Only deploy after all checks pass.\n');
console.error('Agent rule: Do NOT push, tag, release, or publish until QA passes.');
console.error('Exception: deploy only if the user explicitly says OVERRIDE (e.g. "deploy OVERRIDE").\n');
console.error('Helpful commands:\n');
console.error('  npm run regression          # full local suite');
console.error('  npm run test:unit           # unit tests only');
console.error('  npm run test:e2e            # Playwright e2e');
console.error('  npm run test:visual         # visual snapshots (Windows)');
console.error('  npm run verify:pages        # GitHub Pages file check\n');

process.exit(1);
