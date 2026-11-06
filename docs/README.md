# Pemintos website

A minimal, responsive, static website for the Pemintos Chrome extension. The visual direction takes cues from the supplied website reference: an editorial hero, restrained monochrome surfaces, thin rules, generous spacing, clear section hierarchy, subtle motion, and a dark closing call-to-action.

## Files

| Path | Purpose |
|---|---|
| `index.html` | The single-page Pemintos website: product overview, feature descriptions, workflow, filename example, privacy notes, installation guide, FAQ, and footer. |
| `styles.css` | Responsive layout, the `#242424` / `#101010` / `#F4F4F4` palette, light/dark/system themes, component styles, and reduced-motion behavior. |
| `script.js` | Theme cycling and persistence, clone-command copy action, reveal-on-scroll behavior, and current-year text. |
| `assets/logo.png` | The exact 128×128 PNG extension icon copied from `../icons/icon128.png`; it is used as the website mark and favicon. |

The project-level `assets/logo.png` is also an exact copy of `icons/icon128.png` for reuse outside the website folder.

## Preview locally

Open `index.html` in a browser, or serve the `docs/` directory with any static web server. The page has no build step and no third-party runtime dependencies.

## Publish

The website files are contained in `docs/`, so the repository can be configured to publish its `docs/` folder through GitHub Pages. It can also be deployed to any static hosting provider.

## Repository link placeholder

The install section intentionally displays:

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the real repository URL once it is public. The website does not link to a Chrome Web Store listing.

## Content accuracy

Product behavior and permission descriptions are based on the current Pemintos extension README and manifest. The site states that drafts and saved notes use `chrome.storage.local`, TXT exports use Chrome's downloads API, and the current extension does not add application-level encryption.
