# DansWord

**A non-profit educational project — a free Word alternative for everyone, open source for anyone to edit.**

DansWord is built so students, teachers, families, and anyone who needs to write documents can do it **without paying for office software**. The full source code is on GitHub: **anyone can read it, fork it, learn from it, and contribute improvements.**

🌐 **Project site:** [dansword.github.io](https://dandanitman.github.io/DansWord/) (GitHub Pages)  
📥 **Downloads:** [Latest Windows release](https://github.com/DandanITman/DansWord/releases/latest)

## Why DansWord?

| | DansWord | Typical commercial office suite |
|---|----------|----------------------------------|
| Cost | **Free** | Subscription or license |
| Mission | **Non-profit education** | Commercial product |
| Source code | **Open — fork & edit** | Closed |
| Privacy | **Local-first, offline** | Often cloud-dependent |

## Features

- Home screen with recent files, pinned documents, and templates
- Ribbon UI: File, Edit, Insert, Design, Page Layout, Review, View
- Rich text: fonts, colors, lists, tables, images, links, styles
- Native `.dansword` format plus `.docx`, `.rtf`, `.html`, `.txt`
- Hunspell spell check, find/replace, word count, zoom, light/dark theme
- Auto-save, print, PDF export
- Windows installer (NSIS)

## Quick start (users)

1. Download the latest **Windows installer** from [Releases](https://github.com/DandanITman/DansWord/releases/latest)
2. Install and open DansWord
3. Create a blank document or pick a template

## Quick start (developers)

```bash
git clone https://github.com/DandanITman/DansWord.git
cd DansWord
npm install
npm run dev
```

### Testing

```bash
npm run regression   # full suite
npm test             # unit tests only
```

See [docs/testing.md](docs/testing.md) for the complete testing guide.

### Build installer

```bash
npm run package
```

Output: `apps/desktop/release/`

## Project structure

```
apps/desktop/     Electron + React app
packages/core/    Shared types, defaults, templates
packages/openxml/ DOCX import/export
docs/             Project site + documentation
tests/            Playwright e2e, visual, fixtures
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — free to use, modify, and share.

---

*DansWord is an independent open-source project. Not affiliated with Microsoft or Microsoft Word.*
