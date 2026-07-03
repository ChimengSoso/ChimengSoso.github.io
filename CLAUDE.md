# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ChimengSoso.github.io` — a GitHub Pages user site (deploys from the repo root, no `base` path needed), built entirely with Astro. It has two page groups sharing one site-wide navigation experience via Astro's `<ClientRouter />` (View Transitions):
- The home page (`src/pages/index.astro`) — a personal profile/link-hub with an interactive canvas starfield background (`src/components/StarfieldBackground.astro`).
- A Thai-language "knowledge" article section under `/knowledge` (`src/layouts/Layout.astro` + `src/pages/knowledge/*.astro`).

`public/` still holds static assets copied verbatim into the build output (`img.jpg`, `favicon.svg`, `promptpay.jpg`, `robots.txt`, `knowledge/*` images) — but no longer any HTML/CSS of its own; there is no legacy static page bypassing the Astro build.

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

- **`astro.config.mjs`** sets `site` but no `base`, and relies on Astro's default `build.format: "directory"` output (e.g. `src/pages/knowledge/claude-intro.astro` → `/knowledge/claude-intro/index.html`; `src/pages/index.astro` still emits a flat `dist/index.html` at the root, same as before). GitHub Pages serves directory indexes natively, so links use `href="claude-intro/"` style paths, not `.html` suffixes.
- **`src/pages/index.astro`** is a standalone page — it does *not* wrap in `Layout.astro`, since the profile card's centered layout is fundamentally different from the two-column reading layout `Layout.astro` provides (no TOC, no donate button, no site footer). It renders its own `<ClientRouter />` and `<StarfieldBackground />` independently of `Layout.astro`, which does the same for every `/knowledge/*` page — both must keep doing so for View Transitions and the persisted canvas to work site-wide.
- **`src/components/StarfieldBackground.astro`** renders the `<canvas>` background shared by the home page and every knowledge page. It uses `transition:persist` so the same DOM node (and its running particle simulation) survives client-side navigation instead of being torn down and rebuilt: leaving `/` for a knowledge article scatters the stars outward and fades/pauses the canvas; returning reforms and fades it back in. All mutable animation state lives on the canvas node itself (`canvas.__starfield`), not in script closures, because closures aren't guaranteed to survive Astro's script re-execution on each swap — see the component for the `astro:page-load` + `data-bg` (`"interactive"` on `/`, `"plain"` on `Layout.astro`) lifecycle.
- **`src/layouts/Layout.astro`** is the shared shell for all `/knowledge/*` pages (blue color theme, Sarabun font with fluid `clamp()`-based sizing controlled by the single `--scale` CSS variable, card/tag/breadcrumb/callout/references styling, a sticky "on this page" TOC auto-built from each page's `h2`s). New Astro content pages should use this layout via `<Layout title=... description=...>` rather than duplicating markup — see `src/pages/knowledge/claude-intro.astro` for the pattern. Layout also renders the prev/next article nav and the "last updated" footer itself, driven by the `prev`/`next`/`updated` props — don't hand-write a `<footer>` in article pages.
- **`src/data/articles.js`** is the single source of truth for the knowledge article list (used by the listing page) and reading order (used by `getAdjacentArticles(href)` for prev/next links). `soon: true/false` marks placeholder ("เร็วๆ นี้") vs. published entries; only published entries count for prev/next.
