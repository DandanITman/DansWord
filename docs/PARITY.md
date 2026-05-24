# Feature Parity (Word / LibreOffice)

Automated catalog: `packages/core/src/featureParity.ts`
Run tests: `npm test`

## Summary

DansWord targets **local-first** parity with Microsoft Word and LibreOffice Writer. Cloud sync and AI are intentionally out of scope for now; LAN collaboration is partial.

| Status | Meaning |
|--------|---------|
| **implemented** | Shipped and usable |
| **partial** | Works with limitations |
| **missing** | Not yet built |

Run `npm run test:parity` to validate the catalog and coverage thresholds.

## High-priority gaps (vs Word/OO)

- True print pagination with repeated per-page editable headers/footers
- Full DOCX round-trip fidelity for complex Word documents
- Section breaks, endnotes, equations
- Macros, compare/combine documents, thesaurus
- Password protection
- Cloud sync and AI writing assistant if those become in-scope later

## Shipped core (implemented)

File: new/open/save, DOCX/RTF/HTML/TXT, legacy `.doc` import, dedicated PDF export, auto-save, revision history, print
Edit: undo/redo, find/replace, cut/copy/paste (OS clipboard)
Format: bold/italic/underline/strike/highlight, font color, subscript/superscript, paragraph indent/spacing/borders, fonts, styles, format painter
Layout: page size, margins, columns, headers/footers, watermarks, page breaks, multi-page visual guides
Insert: images (wrap + drag-to-move), shapes, tables, links, TOC, dates, footnotes, merge fields
Review: Hunspell spell check with suggestions, comments, track changes
Advanced: mail merge (CSV to batch DOCX), LAN collaboration (WebSocket sync)
View: zoom, rulers, navigation pane, word count

See `docs/FEATURES.md` for the full shipped changelog.
