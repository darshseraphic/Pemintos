# Changelog

Notable features and project changes are recorded here. The installed extension version is defined in `manifest.json`.

## [Unreleased] — Documentation update

- Reworked the README to introduce Pemintos, explain its features and save flow, document source retrieval and unpacked Chrome installation, and describe the project files.
- Added contribution guidance that reflects the permissions and restrictions in the supplied license.
- Added a security and privacy overview, including the declared Chrome permissions and local data handling.
- Added this changelog.
- Added the supplied `LICENSE.txt` verbatim.

## [1.1.0] — Current extension version

- Added automatic draft persistence using Chrome's local extension storage.
- Added a separate Saved notes library so saved notes are kept independently from the active draft.
- Added automatic `.txt` filenames based on the first word of a note.
- Added support for choosing a custom `.txt` filename.
- Added TXT export through Chrome's download manager. A saved note remains in the Pemintos library if a download cannot be started.
- Added a full-page editor for reopening and editing saved notes.
- Added explicit **Save changes** and **Download .txt** actions in the full-page editor. Closing the editor also attempts to save unsaved edits.
- Added System, Light, and Dark appearance modes, with the preference stored locally.
- Added a slim, theme-aware scrollbar and live word counts.
- Added `Ctrl+S` / `Cmd+S` keyboard behavior for the popup and full-page editor.
