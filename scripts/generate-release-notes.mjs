#!/usr/bin/env node
/**
 * Build detailed GitHub Release notes from git history.
 * Usage: node scripts/generate-release-notes.mjs [version] [--output path]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', shell: false });
  if (result.status !== 0) {
    return '';
  }
  return (result.stdout ?? '').trim();
}

const version = process.argv[2] ?? run('git', ['describe', '--tags', '--abbrev=0']) ?? 'v0.0.0';
const outputFlag = process.argv.indexOf('--output');
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : null;

const previousTag = run('git', ['describe', '--tags', '--abbrev=0', `${version}^`]);
const range = previousTag ? `${previousTag}..HEAD` : 'HEAD';

const rawLog = run('git', [
  'log',
  range,
  '--pretty=format:%h|%ad|%an|%s',
  '--date=short',
  '--no-merges',
]);

const commits = rawLog
  ? rawLog.split('\n').map((line) => {
      const [hash, date, author, ...rest] = line.split('|');
      return { hash, date, author, subject: rest.join('|') };
    })
  : [];

function categorize(subject) {
  const s = subject.toLowerCase();
  if (s.startsWith('fix') || s.includes('bug')) return 'fixes';
  if (s.startsWith('test') || s.includes('regression') || s.includes('e2e')) return 'tests';
  if (s.startsWith('docs') || s.includes('readme') || s.includes('pages')) return 'docs';
  if (s.startsWith('feat') || s.startsWith('add') || s.includes('feature')) return 'features';
  if (s.includes('deploy') || s.includes('release') || s.includes('workflow') || s.includes('ci'))
    return 'infra';
  return 'other';
}

const groups = {
  features: [],
  fixes: [],
  tests: [],
  docs: [],
  infra: [],
  other: [],
};

for (const commit of commits) {
  groups[categorize(commit.subject)].push(commit);
}

function section(title, items) {
  if (!items.length) return '';
  const lines = items.map(
    (c) => `- **${c.subject}** (\`${c.hash}\`, ${c.date}, ${c.author})`,
  );
  return `## ${title}\n\n${lines.join('\n')}\n`;
}

const compareUrl = previousTag
  ? `https://github.com/DandanITman/DansWord/compare/${previousTag}...${version}`
  : `https://github.com/DandanITman/DansWord/commits/main`;

const body = [
  `# DansWord ${version}`,
  '',
  'Non-profit educational word processor — free Word alternative for everyone.',
  '',
  previousTag
    ? `Changes since [${previousTag}](https://github.com/DandanITman/DansWord/releases/tag/${previousTag}).`
    : 'Initial tracked release notes for this version.',
  '',
  `[Full commit compare](${compareUrl})`,
  '',
  section('Features', groups.features),
  section('Bug fixes', groups.fixes),
  section('Tests & QA', groups.tests),
  section('Documentation & site', groups.docs),
  section('CI / deploy / infra', groups.infra),
  section('Other changes', groups.other),
  commits.length
    ? ''
    : '_No commits found in range — tag may point at the same commit as the previous release._\n',
  '---',
  '',
  '## QA status',
  '',
  '- Regression workflow must pass on this commit before the release job publishes assets.',
  '- Local pre-deploy gate: `npm run pre-deploy`',
  '',
  '## Downloads',
  '',
  '- Windows installer (`.exe`) attached to this release',
  '- Project site: https://dandanitman.github.io/DansWord/',
].join('\n');

if (outputPath) {
  writeFileSync(outputPath, body, 'utf8');
  console.log(`Wrote release notes to ${outputPath}`);
} else {
  console.log(body);
}
