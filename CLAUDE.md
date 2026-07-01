# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ChimengSoso.github.io` — a GitHub Pages user site (deploys from the repo root, no `base` path needed). It is a hybrid of:
- A legacy static profile page (`public/index.html`, `styles.css`, `script.js`, `img.jpg`) — a jQuery-based personal profile/link page, served as-is.
- A small Astro site (`src/`) for new content, currently a Thai-language "knowledge" article section under `/knowledge`.

Astro's `public/` files are copied verbatim into the build output, so the legacy profile page and the Astro-rendered pages coexist in the same deployed site without conflict.

## Commands

- `npm run dev` — start Astro dev server (default port 4321)
- `npm run build` — build static site to `dist/`
- `npm run preview` — preview the production build locally

There is no test suite or linter configured.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which runs `withastro/action@v3` (installs deps, runs `astro build`) and deploys `dist/` to GitHub Pages via `actions/deploy-pages@v4`. There is no separate staging environment — every push to `master` goes live.

## Architecture notes

- **`astro.config.mjs`** sets `site` but no `base`, and relies on Astro's default `build.format: "directory"` output (e.g. `src/pages/knowledge/claude-intro.astro` → `/knowledge/claude-intro/index.html`). GitHub Pages serves directory indexes natively, so links use `href="claude-intro/"` style paths, not `.html` suffixes.
- **`src/middleware.ts`** redirects `/` → `/index.html` but only runs under `astro dev`; it has no effect on the static production build, where GitHub Pages serves `public/index.html` directly as `dist/index.html`. Don't rely on this middleware for any production routing behavior.
- **`src/layouts/Layout.astro`** is the shared shell for all Astro pages (blue color theme, Fira Mono font, card/tag/breadcrumb styling). New Astro content pages should use this layout via `<Layout title=... description=...>` rather than duplicating markup — see `src/pages/knowledge/claude-intro.astro` for the pattern (breadcrumb, `.tag`, `.card`, footer with a manually-written last-updated date).
- Content in `src/pages/knowledge/` is Thai-language and hand-authored per article (no CMS/content collections). `index.astro` maintains a hardcoded `articles` array with `soon: true/false` to mark placeholder ("เร็วๆ นี้") vs. published entries — update that array when adding a new article page.
- The legacy `public/` assets (`index.html`, `web.html`, `script.js`, `styles.css`) are unrelated standalone pages (profile page, an old NodeMCU/Google Sheets note page) kept for backward-compat links; they are not part of the Astro build pipeline and won't pick up changes to `src/layouts/Layout.astro`.
