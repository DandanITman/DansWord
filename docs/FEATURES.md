# DansWord features

What the app does today. Anything not listed here is not built — this file is
maintained by hand against the actual code, and nothing generates a coverage
percentage from it.

## File

- New document from a blank page or the letter, report and resume templates
- Open `.dansword`, `.docx`, `.doc`, `.rtf`, `.html`, `.txt`
- Save and Save As; the format follows the file extension
- Export a copy as DOCX, `.dansword`, RTF, HTML, PDF or TXT without changing
  which document is open
- Print via the system dialog
- Recent files with pinning, and remove-from-recent
- Auto-save on an interval once the document has a path
- Version history — up to 20 snapshots per document, for every save format
- Windows file associations: double-clicking a `.docx` or `.dansword` opens it
- Prompts to save when closing with unsaved changes
- Document properties: title, author, subject, keywords, company

## Edit

- Undo and redo, from the ribbon, the title bar and the keyboard
- Cut, copy and paste via the system clipboard, preserving formatting
- Find and replace, with a live match count and n-of-m position
  (Ctrl+F finds, Ctrl+H replaces)
- Select all, clear formatting, change case
- Format painter

## Formatting

- Bold, italic, underline, strikethrough, superscript, subscript
- Font family, size and colour; text highlight colour
- Alignment: left, centre, right, justify
- Bulleted and numbered lists, including nesting
- Increase and decrease indent; line spacing; space before and after
- Paragraph borders and shading
- Style gallery and a style editor for built-in and custom styles

All of the above track the caret: the ribbon shows the formatting at the
cursor, not the formatting from the last edit.

## Insert

- Pictures, with resize, five text-wrapping modes and alignment
- Shapes: rectangle, oval, line, arrow
- Tables, with full structure editing — insert and delete rows and columns,
  merge and split cells, toggle a header row, delete the table
- Hyperlinks
- Table of contents that refreshes as headings change
- Page breaks, footnotes, the current date, horizontal rules

## Page layout

- Page size (Letter, A4, Legal) and orientation
- Margins, as presets or custom values
- Multi-column layout
- Headers and footers, with optional page numbers
- Watermarks

## Review

- Spell check via Hunspell in English, German, Spanish and French, with
  right-click suggestions and "Add to dictionary"
- Comments anchored to a text selection, with resolve and delete
- Track changes recording both insertions **and** deletions, so rejecting a
  change restores deleted text
- Accept and reject, individually or all at once
- Word count

## View

- Print layout, web layout and focus mode
- Zoom, rulers, navigation pane
- Light and dark theme, configurable accent colour
- Page indicator that follows the caret

## Document formats

DOCX import and export cover paragraphs, headings, character formatting
(bold, italic, underline, strike, colour, font, size, highlight, super- and
subscript), tables including header rows and cell shading, hyperlinks,
bulleted and numbered lists with nesting, images at their real dimensions,
page breaks, footnotes, page setup, and headers and footers.

RTF import reads character and paragraph formatting; RTF export covers marks,
paragraphs, headings, lists and page breaks. HTML import and export cover
marks, links, tables, lists and images.

### Known limitations

- Comments and track changes are stored in `.dansword` and are not written to
  DOCX
- The editor scrolls continuously; pagination is applied to print and PDF
  output rather than being reflowed live on screen
- `.doc` (the pre-2007 binary format) is imported by shelling out to
  LibreOffice when it is installed, with a plain-text fallback when it is not
- Endnotes, section breaks, equations, macros, document compare, a thesaurus
  and password protection are not built

## Not in scope

DansWord is local-first and makes no network requests. There are no accounts,
no cloud sync, no collaboration and no telemetry.
