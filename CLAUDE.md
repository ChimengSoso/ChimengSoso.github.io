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

## Commit messages

This repo's history is strictly single-line, imperative-mood, no body (e.g. `Add interactive starfield background and handle scramble effect`, `Fix profile page bugs and accessibility issues`). Don't add a bullet-point body or a `Why:` explanation paragraph — match the existing terse style. Only commit when the user explicitly asks (`commit ได้เลย` or similar); don't commit proactively after finishing a task.

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

## Conventions

- **Reduced motion**: any new CSS/JS animation needs a `@media (prefers-reduced-motion: reduce)` fallback (instant state change, no transition) — see `profile.css` and `StarfieldBackground.astro`.
- **Hover vs. touch branching**: use `@media (hover: hover)` / `@media (hover: none)` to detect whether the primary input can hover, not touch-event feature detection (`ontouchstart` etc.) — handles hybrid touchscreen laptops correctly. Existing usages: `DonateButton.astro`, `profile.css`.
- **Accessible show/hide**: elements that must stay reachable by keyboard/tab order and screen readers (e.g. `.featured-link`) are hidden via `opacity`/`max-height`/`pointer-events`, never `display: none` or `visibility: hidden`. `display: none` is still fine for purely decorative icon-swap toggles (e.g. copy/check icon states in `CodeBlock.astro`/`DonateButton.astro`/`ShareButtons.astro`) where nothing needs to stay perceivable either way.
- **No `any` in `<script>` blocks.** When a value needs a custom property that doesn't exist on its DOM/global type (`window.__flag`, `canvas.__starfield`), define a named intersection type (`type Foo = Window & { __flag?: boolean }`) and cast once into a local variable, instead of scattering `(x as any).prop`. See `StarfieldBackground.astro`'s `StarfieldCanvas` type and `SelfXssWarning.astro`'s `WindowWithSelfXssFlag`.
- **Don't add new npm dependencies without asking first**, even for tooling (e.g. `astro check` wants to install `@astrojs/check`/`typescript`) — confirm with the user before changing the dependency footprint.
- **UI changes get verified in a live browser** (via the preview tooling), not just `npm run build` — a clean build only proves the code compiles, not that the feature behaves correctly across navigations/interactions.

## Gotchas learned the hard way

- **`<script>` tags stop running after client-side navigation unless wired to `astro:page-load`.** With `<ClientRouter />` site-wide, top-level script code only ever executes once (ES module semantics) — after the router swaps in new DOM, any code that ran at the top level is now bound to detached elements. Wrap all init logic (querySelector, addEventListener, `new IntersectionObserver`, etc.) in `document.addEventListener('astro:page-load', () => { ... })` instead of running it bare, in *every* component/page with a script, not just ones that feel "SPA-relevant." This bit `Layout.astro`'s TOC builder, `DonateButton`, `ShareButtons`, `CodeBlock`, and even `index.astro`'s own tilt/reveal/handle-scramble scripts — missed on the first pass and only caught by manually navigating back and forth in a live browser, not by `astro build`.
  - Corollary: if you create a new `IntersectionObserver` (or similar) inside an `astro:page-load` handler, `.disconnect()` the previous one first — otherwise every navigation back to that page leaks another observer watching stale/detached nodes.
- **State for a `transition:persist`-ed element must live on the DOM node itself, not in script closures.** Even though the node survives navigation, the inline `<script>`'s module-level variables are not guaranteed to. Pattern used here: `canvas.__starfield = {...}` holds all mutable animation state, and `astro:page-load` checks `canvas.__starfield` to decide "fresh boot" vs. "resume."
- **When refactoring a function that ends in `return { ... }` into one that needs to derive extra properties (e.g. via `Object.assign`), actually convert the `return` into a `const x = { ... }` assignment.** Once, mid-refactor, the original `return { ... };` was left in place after adding an `Object.assign(...)` line after it — the new code became unreachable dead code with zero console errors (nothing threw, it just silently never ran). `astro build` and TypeScript didn't catch it either, since it's valid-but-dead code. Caught only via live browser testing that asserted on actual runtime state (e.g. checking a property existed on the object) rather than just "no errors in the console." Lesson: after any non-trivial refactor of stateful init code, verify the *new* behavior actually executes — absence of errors is not evidence of correctness for dead code.
