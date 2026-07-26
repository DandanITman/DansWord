# DansWord features

What the app does today. Anything not listed here is not built — this file is
maintained by hand against the actual code, and nothing generates a coverage
percentage from it.

The ribbon follows Word's tab set: **File, Home, Insert, Draw, Design, Layout,
References, Mailings, Review, View**, plus the contextual **Picture Format** and
**Table Layout** tabs that appear when a picture or a table is selected. Groups
are labelled and open their dialogs from a corner launcher, as Word's do.

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

## Home

- **Clipboard** — Paste as a split button with Keep Source Formatting, Merge
  Formatting and Keep Text Only; Cut, Copy, Format Painter
- **Font** — family and size combo boxes, Grow/Shrink Font, Change Case
  (five modes), Clear All Formatting, bold, italic, underline with six underline
  styles, strikethrough, sub- and superscript, text effects (shadow, outline,
  glow, reflection), small caps and all caps, highlight colour, font colour, and
  a Font dialog with a live preview
- **Paragraph** — bullet library, numbering library, multilevel list schemes,
  increase and decrease indent (which demote and promote list items), Sort,
  Show/Hide formatting marks, the four alignments, line and paragraph spacing,
  shading, borders on any side, border colour, and a Paragraph dialog
- **Styles** — Word's gallery (Normal, No Spacing, the headings, Title,
  Subtitle, Quote, Intense Quote, List Paragraph and the character styles
  Emphasis, Strong, Subtle/Intense Emphasis, references and Book Title), plus a
  style editor for custom styles
- **Editing** — Find, Replace and Select

Everything above tracks the caret: the ribbon shows the formatting at the
cursor, not the formatting from the last edit. A mini toolbar appears above the
selection, and right-clicking opens a context menu with the clipboard commands,
the dialogs, comments and synonyms.

## Insert

- **Pages** — four cover pages, Blank Page, Page Break
- **Tables** — the hover-to-size grid picker, a quick 3 × 3, and Delete Table
- **Illustrations** — Pictures, and Shapes (rectangle, oval, triangle, line,
  arrow)
- **Links** — hyperlinks, bookmarks, cross-references
- **Comments** — New Comment
- **Header & Footer** — header, footer, page numbers
- **Text** — text boxes (simple, sidebar, pull quote), Drop Cap, Date & Time in
  three formats
- **Symbols** — inline equation runs, a symbol gallery with a full picker of
  eight Unicode subsets, horizontal lines

## Draw

- Pen, highlighter and stroke eraser on an ink canvas, with eight pen colours
  and five widths
- Ink is stored as vectors, so it scales with zoom and survives a save; drawings
  export to HTML and print as SVG

## Design

- **Document Formatting** — eight style sets (Default, No Spacing, Compact,
  Casual, Elegant, Formal, Lines, Shaded), eight theme font pairings, six theme
  colour sets, six paragraph spacing presets, and Set as Default. Picking one
  restyles the paragraphs already in the document, not just the gallery.
- **Page Background** — watermark, page colour, page borders

## Layout

- **Page Setup** — margins gallery (Normal, Narrow, Moderate, Wide, Mirrored),
  orientation, six page sizes (Letter, A4, Legal, A5, Executive, Tabloid),
  columns with an optional line between, breaks, line numbers (continuous or
  restarting each page), automatic hyphenation
- **Paragraph** — left and right indent, space before and after
- **Arrange** — nine-position placement, seven text-wrapping modes, alignment
  and rotation for the selected object
- Draggable margin markers on the ruler

## References

- **Table of Contents** — an automatic table that refreshes as headings change,
  Add Text to set a heading level, Update Table
- **Footnotes** — footnotes and endnotes, each with its own editable notes area,
  and Show Notes
- **Citations & Bibliography** — a source manager for books, articles, web
  sites, reports and conference papers; in-text citations and a bibliography in
  APA, MLA, Chicago or IEEE
- **Captions** — numbered Figure, Table and Equation captions, tables of figures
- **Index** — Mark Entry and a generated, alphabetised index

## Mailings

- Start Mail Merge for letters, envelopes, labels, a directory or email
- Recipients from a CSV or tab-separated file, with quoted fields handled and a
  tick-list for including or excluding people
- Address Block, Greeting Line and individual merge fields
- Preview Results, stepping recipient by recipient, and Highlight Merge Fields
- Finish & Merge writes one `.docx` per recipient

## Review

- **Proofing** — Hunspell spell check in English, German, Spanish and French; a
  grammar checker covering repeated words, article agreement, spacing,
  sentence capitalisation and common wrong phrases; the F7 Editor pane with
  Change, Change All, Ignore Once, Ignore All and Add to Dictionary; an offline
  thesaurus (Shift+F7); word count with readability
- AutoCorrect as you type: the replacement table, TWo INitial CApitals, a lone
  "i", sentence capitals, curly quotes, and the `--`, `...`, `(c)` shortcuts
- **Language** — proofing language per document, and switches for
  check-as-you-type spelling and grammar
- **Comments** — new, delete (one, all resolved, or all), previous, next, and the
  comments pane; comments anchor to a selection and can be resolved
- **Tracking** — track changes recording insertions **and** deletions, Display
  for Review (Simple, All, No Markup, Original), Show Markup filters, and a
  reviewing pane listing every revision with its author
- **Changes** — accept and reject one, all, or accept-and-move-to-next, with
  Previous and Next, and a live count of what is pending
- **Compare** — compare against another document; the differences arrive as
  tracked changes
- **Protect** — Restrict Editing makes the document read-only

## View

- Five views: Read Mode, Print Layout, Web Layout, Outline and Draft, plus
  Focus Mode
- Ruler, gridlines and navigation pane toggles
- Zoom from 10% to 500%, with 100%, One Page, Page Width and a Zoom dialog
- Collapsible ribbon (Ctrl+F1)
- Light and dark theme, configurable accent colour
- Status bar: word count, language, a proofing indicator that opens the Editor
  pane, tracked-change state, read-only state, the caret's page, the five view
  buttons and the zoom slider

## Keyboard

Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+P, Ctrl+Z/Y, Ctrl+B/I/U,
Ctrl+L/E/R/J, Ctrl+1/2/5 (line spacing), Ctrl+0 (space before), Ctrl+M and
Ctrl+Shift+M (indent), Ctrl+[ and Ctrl+] (font size), Ctrl+Shift+D (double
underline), Ctrl+Shift+K (small caps), Ctrl+K (hyperlink), Ctrl+F, Ctrl+H,
Ctrl+Enter (page break), Ctrl+Shift+8 (formatting marks), Ctrl+F1 (collapse the
ribbon), Ctrl+Shift+E (track changes), Ctrl+Alt+M (comment), Ctrl+Alt+F
(footnote), Ctrl+Alt+D (endnote), Alt+Shift+X (index entry), F7 (spelling),
Shift+F7 (thesaurus).

## Pictures

- Eight resize handles; the corners keep the aspect ratio, and Shift releases it
- A rotation handle, with Shift constraining to 15° steps
- Dragging an inline picture moves it through the text; dragging a floating one
  positions it freely, snapping to the left margin, the page centre, the right
  margin and the baseline grid, with the alignment guides Word draws
- Arrow keys nudge a floating picture
- Seven wrap modes: In Line, Square, Tight, Through, Top and Bottom, Behind Text
  and In Front of Text
- Picture styles (frames, rounded, oval, shadow), border colour, brightness,
  contrast and saturation, Reset Picture, a size and position dialog, and Alt
  Text
- Pictures can be dropped in from Explorer or pasted from the clipboard

## Document formats

DOCX import and export cover paragraphs, headings, character formatting
(bold, italic, underline, strike, colour, font, size, highlight, super- and
subscript), tables including header rows and cell shading, hyperlinks,
bulleted and numbered lists with nesting, images at their real dimensions,
page breaks, footnotes, page setup, headers and footers, review comments,
tracked insertions and deletions, and shapes.

RTF import reads character and paragraph formatting; RTF export covers marks,
paragraphs, headings, lists and page breaks. HTML import and export cover
marks, links, tables, lists and images.

### Known limitations

- The editor scrolls continuously; pagination is applied to print and PDF
  output rather than being reflowed live on screen
- `.doc` (the pre-2007 binary format) is imported by shelling out to
  LibreOffice when it is installed, with a plain-text fallback when it is not
- Ink drawings, text boxes, endnotes, bookmarks, index entries and the generated
  bibliography/index blocks round-trip through `.dansword` and HTML, but DOCX
  export writes them as ordinary paragraphs
- Compare works at paragraph level, not word level
- The thesaurus is a built-in offline word list, not a licensed data set
- Equations are typed as inline runs in Word's linear format rather than being
  laid out as a formula
- Section breaks, macros and password protection are not built

## Not in scope

DansWord is local-first and makes no network requests. There are no accounts,
no cloud sync, no collaboration, no AI features and no telemetry.
