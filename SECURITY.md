# Security and privacy

This document describes the security-relevant behavior of the current Pemintos codebase. It is not a guarantee that software or local data is completely secure.

## Current security model

Pemintos is a local-first Chrome extension. In the current `1.1.0` manifest:

- The extension uses **Manifest V3**.
- It declares the `storage` and `downloads` permissions.
- It does not declare website `host_permissions` or content scripts.
- It does not register a background service worker.
- The current JavaScript files do not make network requests or load remote scripts.

The `storage` permission is used with `chrome.storage.local` to keep the draft, saved notes, and theme preference in the user's Chrome profile. The `downloads` permission is used to export note contents as plain-text `.txt` files through Chrome's download manager.

Pemintos does not require a Pemintos account or send note contents to a Pemintos server. This describes the current source code and may change in a future release; review the manifest and source again after updates.

## Data handling

| Data | Where it is kept | Notes |
|---|---|---|
| Unfinished draft | Chrome extension local storage | Restored when the popup is opened again. |
| Saved notes | Chrome extension local storage | Kept separately from the draft and opened in the full-page editor. |
| Theme preference | Chrome extension local storage | Stores System, Light, or Dark. |
| Downloaded note | A `.txt` file managed by Chrome | Saved according to the browser's download settings. |

The Saved notes library is not a normal folder on disk. It lives in Chrome's extension storage. A downloaded `.txt` file is a separate export and may be accessible to other applications or included in backups or folder-sync services according to the user's device and browser configuration.

Pemintos does **not** add application-level encryption to drafts or saved notes. Treat the contents as ordinary local browser-profile data. Anyone who can access your operating-system account or Chrome profile may be able to access them. Do not store passwords, recovery codes, financial credentials, or other information that requires stronger protection in Pemintos.

Before removing the extension or resetting your Chrome profile, download copies of notes you need to keep. Uninstalling an extension or clearing its stored data can make locally stored notes unavailable.

## User security recommendations

- Install Pemintos only from a source you trust.
- Keep Chrome and your operating system up to date.
- Review the extension's requested permissions on `chrome://extensions`.
- Protect your operating-system account and Chrome profile with appropriate device security.
- Remember that exported `.txt` files are plain text. Store and share them accordingly.
- Export important notes separately; local extension storage is not a backup service.

## Reporting a security issue

Please report suspected vulnerabilities privately to **Darshseraphic** at [Darsh.seraphic@gmail.com](mailto:Darsh.seraphic@gmail.com).

Include the affected Pemintos version, Chrome version, operating system, a clear description of the potential impact, and steps to reproduce the issue. Use a harmless demonstration and do not include real note contents, credentials, tokens, cookies, or other sensitive data.

Please avoid publicly posting exploit details while a report is being reviewed. There is currently no published response-time commitment. The project maintainer can follow up by email if more information is needed.
