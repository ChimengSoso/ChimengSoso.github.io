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

## Branching & deployment

- `master` is the default/production branch (**not** `main`) — only `master` triggers deployment. Do routine work on `develop` and merge into `master` when ready to publish; this is intentional, so pushes to `develop` don't go live.
- Pushing to `master` triggers `.github/workflows/deploy.yml`, which runs `withastro/action@v6` (installs deps, runs `astro build`) and deploys `dist/` to GitHub Pages via `actions/deploy-pages@v5`. There is no separate staging environment — every push to `master` goes live immediately.
- The repo's GitHub Pages source is set to **"GitHub Actions"** (not the legacy branch-based Pages source), so deployment only happens through this workflow. If the workflow's `on.push.branches` trigger is ever changed, remember `master` is the branch that matters here, not `main`.

## Adding a new article

Always touch two places:
1. Create the new `.astro` file in `src/pages/knowledge/`, using `<Layout>` the same way `claude-intro.astro` does. Pass `prev`/`next` (from `getAdjacentArticles(href)`, see below) and `updated="<date>"` as props instead of hand-writing a `<footer>`.
2. Add or update its entry in the `articles` array in `src/data/articles.js`, setting `soon: false` and `href` pointing at the new file in directory-style form (e.g. `my-article/`, not `my-article.html` — see the directory-style build note below). Order in the array determines prev/next link order and reading order on the listing page — insert it where it should sit in the sequence.

## Architecture notes

- **`astro.config.mjs`** sets `site` but no `base`, and relies on Astro's default `build.format: "directory"` output (e.g. `src/pages/knowledge/claude-intro.astro` → `/knowledge/claude-intro/index.html`). GitHub Pages serves directory indexes natively, so links use `href="claude-intro/"` style paths, not `.html` suffixes.
- **`src/middleware.ts`** redirects `/` → `/index.html` but only runs under `astro dev`; it has no effect on the static production build, where GitHub Pages serves `public/index.html` directly as `dist/index.html`. Don't rely on this middleware for any production routing behavior.
- **`src/layouts/Layout.astro`** is the shared shell for all Astro pages (blue color theme, Sarabun font with fluid `clamp()`-based sizing controlled by the single `--scale` CSS variable, card/tag/breadcrumb/callout/references styling, a sticky "on this page" TOC auto-built from each page's `h2`s). New Astro content pages should use this layout via `<Layout title=... description=...>` rather than duplicating markup — see `src/pages/knowledge/claude-intro.astro` for the pattern. Layout also renders the prev/next article nav and the "last updated" footer itself, driven by the `prev`/`next`/`updated` props — don't hand-write a `<footer>` in article pages.
- **`src/data/articles.js`** is the single source of truth for the knowledge article list (used by the listing page) and reading order (used by `getAdjacentArticles(href)` for prev/next links). `soon: true/false` marks placeholder ("เร็วๆ นี้") vs. published entries; only published entries count for prev/next.
- The legacy `public/` assets (`index.html`, `script.js`, `styles.css`) are the standalone profile page kept for backward-compat links; they are not part of the Astro build pipeline and won't pick up changes to `src/layouts/Layout.astro`. This separation is intentional — don't move these files into `src/pages/` to have Astro process them unless the actual goal is to migrate the whole site off the legacy static pages.
