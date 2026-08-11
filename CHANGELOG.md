# Changelog

All notable changes to DansWord are recorded here. Help > What's New shows this
file inside the app.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
DansWord uses [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2]

Second Word-parity pass, taking the four remaining gaps where a command Word
has had no route in DansWord at all.

### Added

- **File > New and File > Open are real backstage panes.** New shows the
  template gallery; Open lists recent documents above Browse. Both existed
  only on the start screen, so once a document was open they were unreachable
  — the panes behind them were a single button each.
- **Layout > Arrange** appears when a shape or text box is selected, with Wrap
  Text and alignment. Only pictures had a contextual tab, so a shape could be
  inserted and then never wrapped or positioned. Shapes gained the alignment
  and wrap attributes text boxes already had.
- **The Navigation pane searches.** It has a search box and Headings / Results
  tabs, as Word's does; it was a flat heading list and nothing else.

### Changed

- **The ribbon no longer scrolls sideways.** It stepped groups off behind a
  horizontal scrollbar once they outgrew the window, and the window can be
  dragged to 900px. A compact density now steps in first — tighter padding,
  narrower large buttons, and the Styles tiles collapsing to their menu, which
  is the same trade Word makes when it collapses a group. Every tab holds down
  to 1100px.

### Known limitations

- Review, at eight groups, still overflows below about 1050px. Closing that
  needs true group collapse, which needs the ribbon tabs to declare their
  groups as data rather than JSX; TC-UI-002 bounds the overflow so it cannot
  quietly get worse.

## [0.2.1]

Word-parity pass over the ribbon: the audit compared every tab against Word
2024 and this release closes the gaps that left commands missing or misplaced.

### Added

- **Go To (Ctrl+G)** — jump to a page, line or bookmark. Word's primary
  long-document navigation had no equivalent here at all. It opens from the
  Find split button and from the status bar's page indicator, which is now a
  button rather than dead text.
- **A real Styles gallery** on Home. Applying Heading 1 was two clicks into an
  unlabelled `T` menu; it is now one click on a live preview tile, with the
  caret's style lit and the full list still behind More.
- **Select Column** and **Select Row** on the Table Layout tab.

### Fixed

- **"Select Table" selected the whole document.** It ran `selectAll()`, so
  choosing it and then typing destroyed everything outside the table. It now
  selects exactly the table.
- **Layout > Breaks > Column inserted a page break**, silently — it called the
  page-break command. Column breaks are now their own node and break the
  column, not the page.
- **Lock Aspect Ratio could not be unlocked.** The button read `imageActive`,
  so it was lit whenever the tab was visible and only ever wrote `true`.
- **Picture Height and Width were in screen pixels**, which mean nothing on a
  printed page. They are in inches, as Word's are.
- **Display for Review never showed the current setting** — the label was
  hardcoded, so the review state was invisible until the menu was opened.
- The **dialog launcher** used the same chevron as every dropdown. It is now a
  corner arrow parked in the group's corner, the way Word draws it.
- The command search offered a **"Review › Protect"** breadcrumb for a group
  that does not exist.

### Changed

- **Home follows Word's group order** — Clipboard, Font, Paragraph, Styles,
  Editing. The Undo group is gone; undo and redo remain in the Quick Access
  toolbar, where Word keeps them.
- **Insert drops from eleven groups to eight.** Bookmark moves into Links and
  Emoji into Symbols, both as Word places them, and the duplicate Table of
  Contents group is gone — References still has it.
- View's **"Window" group is now "Tools"**. It held Find, Print and Word Count,
  none of which are window commands.

## [Unreleased]

### Added

- **Table rows resize** by dragging a row's bottom border, alongside the column
  resizing that already existed. Row heights are written to DOCX.
- The **font list is the machine's own**. One measured list replaces three
  hardcoded ones that disagreed with each other, so every installed face is
  offered rather than fifteen names.
- **F12** opens Save As, as it does in Word.

### Fixed

- **The font and size boxes offered only the value already in them** — the font
  list showed just "Calibri" and "Calibri Light", the size list just "11". They
  were an `<input list>` with a `<datalist>`, which filters its options against
  the field's contents.
- **Typing a font size could delete the selected text.** The same boxes
  committed on every keystroke that completed an option, which handed focus back
  to the document mid-edit and let the next keypress overwrite the selection.
- **Column resizing did nothing.** The table had no `table-layout: fixed`, so
  the widths the resize plugin wrote were discarded, and none of the handle or
  cursor styling was present.
- **Clicking a page margin did nothing**; it now places the caret on the nearest
  line, as Word does.
- **What's New** printed raw `[text](url)` Markdown, kept the brackets around
  version numbers, and broke every wrapped line into its own paragraph. Both
  Help dialogs also gained the close button, Escape and a pinned action row.
- **Borders** clipped its glyph in the Home ribbon; icon buttons that open a
  menu now leave room for the chevron.
- **The ribbon changed height between tabs**, shunting the document down and
  back as you switched.
- DOCX export wrote every column as 100 twips (about 0.07in), discarding
  resized widths, and put a stray newline in every empty cell.
- Paragraph spacing in Layout was measured in `px`, a screen unit with no
  meaning in print; it is now points.

## [0.2.0]

### Added

- **Help tab** — Help, Contact Support and Feedback open the project on GitHub in
  your own browser; Keyboard Shortcuts and What's New open in the app.
- **Layout > Page Background** — watermark, page colour and page borders, moved
  here from the removed Design tab.
- **Insert > Illustrations > Drawing** — inserts a drawing canvas. The pen,
  highlighter, eraser and colour controls now appear on a contextual **Draw**
  tab whenever a canvas is selected, the way Picture Format and Table Layout do.
- **Home > Styles > More Styles** now lists the style sets, so a whole document
  can still be restyled in one click.

### Changed

- The ribbon is trimmed to eight tabs — File, Home, Insert, Layout, References,
  Review, View and Help — matching Word for the web.
- The spell and grammar checker is named **Spelling & Grammar** throughout,
  rather than "Editor". The checker itself is unchanged.
- Layout no longer carries an Arrange group; the Picture Format contextual tab
  already provides positioning, wrapping, alignment and rotation.
- Restrict Editing moved out of Review into the tab strip's **Viewing** mode,
  which sets the same flag; the Protect group is gone.

### Removed

- **Mailings** and the whole mail-merge feature.
- The **Design** tab. Theme fonts, theme colours, paragraph spacing presets and
  Set as Default are gone with it.

## [0.1.0]

First release.

### Added

- A Word-style ribbon with File, Home, Insert, Draw, Design, Layout, References,
  Mailings, Review and View, plus contextual Picture Format and Table Layout.
- Open and save `.dansword`, `.docx`, `.doc`, `.rtf`, `.html` and `.txt`; export
  to PDF; print through the system dialog.
- Track changes, comments, a reviewing pane and document compare.
- Hunspell spell check in English, German, Spanish and French, a grammar
  checker, an offline thesaurus and AutoCorrect.
- Footnotes, endnotes, citations, bibliography, captions, an index and an
  automatic table of contents.
- Pictures with seven wrap modes, shapes, text boxes, ink drawings and tables.
- Version history, up to 20 local snapshots per document.
- Light and dark themes, and Windows file associations.
