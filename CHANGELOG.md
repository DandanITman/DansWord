# Changelog

All notable changes to DansWord are recorded here. Help > What's New shows this
file inside the app.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
DansWord uses [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6]

Two of the four remaining structural gaps: the ribbon is operable from the
keyboard, and Print shows what will actually print.

### Added

- **The ribbon works from the keyboard.** It claimed `role="tablist"` and
  `role="menu"` while honouring neither contract: arrow keys did nothing on
  the tab strip, and opening a menu left focus on the button, so a keyboard
  user could Tab straight past every item into the next control. That made the
  whole menu layer — bullets, numbering, styles, margins, breaks, wrap text,
  Display for Review — reachable only with a mouse. Now Left/Right/Home/End
  move along the tabs with a single roving tab stop, opening a menu focuses
  its first item, Up/Down/Home/End walk the items, Tab is trapped inside the
  open surface, and Escape closes and returns focus to the button.
- **A print preview**, with copies and a page range. The Print pane was a
  heading and one button that went straight to the OS dialog. This matters
  more here than it would in Word: the editor scrolls continuously and never
  reflows pages on screen, so this was the only place a user could ever see
  where the pages break — and it did not show them. The preview is the same
  PDF the exporter produces, so it cannot disagree with what prints.

### Known limitations

- Alt KeyTips are not implemented; the focus and arrow-key handling is the
  part that makes the ribbon usable without a mouse.
- Section breaks and rich header/footer regions remain the two large gaps.
  Both need data-model work rather than UI, and are still recorded under the
  limitations in `docs/FEATURES.md`.

## [0.2.5]

A re-audit checked 0.2.4's claims and found four of them incomplete, one of
them a crash. Fixing my own work came first.

### Fixed

- **Clicking out of a table blanked the entire app.** The Cell Size group
  added in 0.2.4 measures the caret's cell on every render, and
  prosemirror-tables' `selectedRect` *throws* outside a table rather than
  returning null. The Table Layout panel renders for a frame after the caret
  leaves, so the exception unmounted the whole React tree — a white window,
  with the document still unsaved. Every call now goes through a guard.
- **Distribute Rows and Columns sized the wrong table.** Both measured the
  first table in the document instead of the caret's, so in a two-table
  document the second was sized from the first one's width and got columns it
  could not hold. The widths are real attributes, so the damage survived a
  save.
- **Bring Forward and Send Backward did nothing to a text box.** 0.2.4 added
  the `z` attribute and the buttons but never taught `TextBoxView` to read it,
  so the buttons were enabled and silently inert. Text boxes also now keep `z`
  through HTML export.
- **Leaving a table still dumped you on Home.** 0.2.4 fixed this for pictures
  and drawings, but Table Layout is reached by clicking the tab, and that path
  recorded no return tab. Leaving a contextual tab is now keyed on the tab's
  own visibility, which also closes a case where the panel could be left
  showing with no tab selected and no way back.
- **None of 0.2.4's commands were searchable.** Alt+Q found nothing for "row
  height", "distribute", "autofit", "bring forward" or "send backward". The
  Cell Size logic moved to `utils/tableSizing.ts` so the palette can run it,
  and eight commands are registered.

### Added

- **Multiple Pages** in View ▸ Zoom. The capability was built and already in
  the Zoom dialog; only the button was missing.
- **Restrict Editing** in the Track Changes menu, which previously held one
  item that ran the same command as the button beside it.

### Changed

- Shapes and text boxes get **Behind Text** and **In Front of Text**, the two
  wraps that were missing. Without them the new stacking order could only
  reorder objects against each other, never against the text.
- **Compare** is a plain button. Its chevron opened a menu holding a single
  item that ran the same command.

## [0.2.4]

Fourth Word-parity pass: the contextual tabs stop fighting the user, tables
get real sizing, and floating objects get a stacking order.

### Added

- **Cell Size on the Table Layout tab** — Row Height and Column Width in
  inches, Distribute Rows, Distribute Columns, and AutoFit (Contents, Window,
  Fixed). There was no way to give a column a specific width at all; the one
  width control reset them. The boxes write the same attributes the drag
  resizers do, so dragging and typing a number agree.
- **Bring Forward and Send Backward** for pictures, shapes and text boxes.
  Pictures already supported "Behind Text", so two overlapping floats could be
  created and then never reordered.

### Fixed

- **Clicking into a table hijacked the ribbon.** Putting the caret in a table
  forced the tab to Table Layout, pulling Bold and the font boxes away
  mid-sentence. Word reveals the contextual tab and leaves the active one
  alone, which is what happens now.
- **Leaving an object dumped you on Home.** Deselecting a picture or drawing
  hardcoded a jump to Home, so editing from Insert or Review and clicking away
  landed you somewhere you had never been. It returns to the tab you came
  from.
- **The Crop icon was on a button that does not crop.** "Fit to Column" — a
  resize — wore the crop glyph, so a Word user scanning for crop found it and
  got something else. It is "Reset Size" with a resize icon now. The size and
  position dialog was likewise labelled with a brightness icon.
- **Go To ▸ Line assumed every line was 24px tall.** Any document using the
  line-spacing menu or a different font size landed the caret on the wrong
  line, drifting further with every line down the page. It walks the real line
  boxes now.

### Known limitations

- There is still no Crop. The icon no longer claims otherwise.

## [0.2.3]

A re-audit against Word 2024 found that three of the previous two releases'
fixes were incomplete. This closes them.

### Fixed

- **Column breaks were dropped on save.** 0.2.1 gave Layout > Breaks > Column
  a real node, but no exporter knew about it: `columnBreak` is an atom with no
  content, so the DOCX, RTF and HTML writers fell through to a branch that
  recurses into children and it vanished. DOCX is the default save format, so
  the normal save path lost it — the bug had moved from insert-time to
  save-time, which is the worse of the two. All three formats now write it,
  DOCX and HTML read it back, and a round-trip test covers it.
- **The Styles gallery vanished below 1100px** instead of collapsing. 0.2.2's
  compact density hid the tiles outright, and what remained was an unlabelled
  `T` — exactly what the gallery replaced. The menu is labelled "Styles" now,
  and Home shows four tiles at full density so the gallery survives at 1280px
  rather than compacting away.
- **The ribbon latched into compact density** and stayed there at 1280px with
  400px to spare. It decided by measuring `scrollWidth` — but compacting
  changes what `scrollWidth` reports, so the measurement fed back into itself.
  It is a width threshold now.
- **Five command-search breadcrumbs pointed at groups deleted in 0.2.1 and
  0.2.2** — Alt+Q still offered "Home > Undo", "Insert > Bookmarks", "Insert >
  Table of Contents", "Insert > Emojis" and "View > Window". 0.2.1 fixed only
  the sixth. They rotted unnoticed because the test beside the registry
  checked `tab` and never `group`; `RIBBON_GROUPS` now lists what each tab
  renders and the test enforces it.

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
