# Changelog

All notable changes to DansWord are recorded here. Help > What's New shows this
file inside the app.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
DansWord uses [semantic versioning](https://semver.org/spec/v2.0.0.html).

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
