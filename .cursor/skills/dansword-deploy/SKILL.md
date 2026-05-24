# Deploy DansWord (GitHub Pages + Releases)

Use when pushing site changes, fixing GitHub Actions deploy failures, or preparing a Windows release.

## GitHub Pages (docs site)

**Live URL:** https://dandanitman.github.io/DansWord/

### Before first deploy (one-time)

1. Open https://github.com/DandanITman/DansWord/settings/pages
2. **Build and deployment → Source → GitHub Actions**
3. Save (no branch picker needed when using Actions)

If this step is skipped, `Deploy GitHub Pages` fails at **Verify GitHub Pages is enabled** with `Get Pages site failed / Not Found`.

### Before pushing site changes

```bash
npm run verify:pages
```

Checks `docs/index.html`, CSS/JS, and logo exist. Prints the settings URL if Pages is not enabled yet.

### After push to `main`

- Workflow: `.github/workflows/pages.yml`
- Runs when `docs/**` or the workflow file changes
- Steps: verify files → verify Pages enabled → configure → upload `docs/` → deploy → curl live URL

If deploy failed, enable Pages (above), then **Re-run all jobs** on the failed workflow.

## Windows release

- Tag `v*` (e.g. `v0.1.0`) or run **Release Windows build** manually
- Workflow uploads `.exe` from `apps/desktop/release/` to GitHub Releases
- Download buttons on the site use the latest release API

## Do not

- Commit PATs or tokens into the repo
- Use `enablement: true` on configure-pages without a dedicated PAT secret (GITHUB_TOKEN cannot auto-enable Pages)
