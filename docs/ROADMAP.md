# ROADMAP — planned features (agent handoff plan)

Plan written 2026-07-09. Each item is self-contained: an agent should be able to implement it from this file + CLAUDE.md alone. Work top-to-bottom unless the owner says otherwise — item 1 unblocks 2 and 3.

**Rules that apply to every item** (see CLAUDE.md for details):
- Work on `develop`; never push `master` without being asked (master deploys straight to production).
- **Ask before adding any npm dependency** — items 3 and 4 need one; get explicit approval first.
- Gate: `npm run check` + `npm run lint` + `npm run build` all clean, **and** verify behavior in the live preview (`.claude/launch.json` → `astro-dev`, port 4322), including client-side navigations (`/` ↔ `/knowledge/*`) because of the `astro:page-load` gotchas.
- Commits: single-line, imperative, no body. Commit only when the user asks.
- Any change to client-side storage or third-party requests ⇒ update `src/pages/privacy.astro` (both TH and EN blocks) and bump its last-updated date (CE year, e.g. 2026).
- When an item is done, tick its checkbox here and note the commit hash.

---

## 1. [ ] Centralize article dates in `articles.ts` (do this first)

**Why:** Publish/updated dates are currently hand-written Thai strings duplicated across `articles.ts` (`date`), each article page (`<ArticleByline published=... updated=...>` **and** the `updated` Layout prop), plus an ad-hoc `MONTH_ABBR` map in `src/pages/knowledge/index.astro`. Every new article multiplies the drift risk, and nothing machine-readable exists for JSON-LD/RSS (items 2–3).

**Steps:**
1. In `src/data/articles.ts`: replace `date`/add fields — `dateISO: string` (YYYY-MM-DD) and optional `updatedISO?: string`. Existing values: claude-intro 2026-07-01 (updated 2026-07-09), claude-code-workflow 2026-07-01 (updated 2026-07-02), handoff 2026-07-05, grill-and-loop 2026-07-05, context-pollution 2026-07-06, ai-taste 2026-07-07.
2. New `src/lib/dates.ts`: `formatThaiDate(iso)` → "1 กรกฎาคม 2026" and `formatThaiDateShort(iso)` → "1 ก.ค. 2026" (move the month maps out of the listing page). CE years, not พ.ศ.
3. Article pages: look the entry up (add a `getArticle(href)` helper next to `getAdjacentArticles`) and pass derived strings to `ArticleByline`/Layout instead of hand-written literals. Acceptance: no hand-typed Thai date literals left in `src/pages/knowledge/*.astro`.
4. Update the "Adding a new article" section of CLAUDE.md to describe the new fields.

**Verify:** listing meta rows and article bylines render the exact same strings as before (compare against git HEAD in the preview).

## 2. [ ] Article structured data + OG article metadata (needs #1)

**Why:** Knowledge pages have OG tags but no JSON-LD; the home page already ships a `Person` JSON-LD, articles deserve `BlogPosting` for rich results.

**Steps:** In `Layout.astro`, when `type === "article"` and ISO dates are passed (extend Props): emit a `BlogPosting` JSON-LD (`headline`, `datePublished`, `dateModified`, `inLanguage: "th"`, `image` = the derived OG url, `author` = Person "Worakun Ata" with url `https://chimengsoso.github.io/`) via the same `<script is:inline type="application/ld+json" set:html={JSON.stringify(...)}>` pattern as `index.astro`. Also add `<meta property="article:published_time">` / `article:modified_time` (ISO).

**Verify:** build, then run one built article HTML through Google's Rich Results test (or schema.org validator) after deploy; confirm no double-JSON-LD on non-article pages.

## 3. [ ] RSS feed (`@astrojs/rss`) — DEPENDENCY, ask first (needs #1)

**Steps:** add `@astrojs/rss`; new `src/pages/rss.xml.ts` reading published entries from `articles.ts` (title, `desc` as description, `pubDate` from `dateISO`, link = `/knowledge/<href>`); `<link rel="alternate" type="application/rss+xml">` in `Layout.astro` head (and `index.astro` for symmetry); optionally a footer link. Site URL comes from `astro.config.mjs` `site`.

**Verify:** `dist/rss.xml` validates (W3C feed validator), item count = published articles, URLs directory-style with trailing slash.

## 4. [ ] Self-host fonts — DEPENDENCY, ask first

**Why:** Removes the render-blocking Google Fonts CSS *and* the only remaining third-party data flow (would let the Google Fonts paragraph in the privacy policy be deleted).

**Steps:** add `@fontsource` packages matching current usage exactly — Sarabun 400/500/600/700, JetBrains Mono 400/500/700, Fira Code 400/500, Chakra Petch 500/600/700. Import them from **one shared module/CSS entry used by both** `index.astro` and `Layout.astro` — the two pages deliberately share one stylesheet URL so ClientRouter doesn't block the `/` ↔ `/knowledge/` swap on a new stylesheet (see the comment above the Google Fonts `<link>` in `index.astro`); keep that property. Remove both Google Fonts `<link>`s + `preconnect`s. `src/og/*.ttf` (build-time OG rendering) is unaffected — don't touch it. Then update `privacy.astro` (TH+EN): drop the Google Fonts disclosure, state that no third-party requests are made, bump date.

**Verify:** in preview, `preview_network` shows zero requests to `fonts.googleapis.com`/`fonts.gstatic.com`; Thai glyphs + tone marks render in Sarabun (check the donate FAB label, which is sensitive to font metrics); `/` ↔ article navigation still swaps instantly.

## 5. [ ] Privacy-friendly analytics — needs an owner decision first

**Why:** Owner wants share/traffic stats (see the FB SDK revival notes in CLAUDE.md) without a cookie banner. Options: GoatCounter (free, no cookies), Plausible (paid), Cloudflare Web Analytics (free, needs DNS on CF). Ask the owner which; create the account with them.

**Steps:** add the provider's script in `Layout.astro` + `index.astro`. **ClientRouter caveat:** page views after the first load are client-side swaps — fire a manual pageview inside a `document.addEventListener('astro:page-load', ...)` handler (all providers document an SPA API), otherwise only the first page counts. Consider skipping `/divine-lore/`. Update `privacy.astro` TH+EN with the new disclosure + date bump.

**Verify:** dashboard records a hard load *and* a client-side navigation as two views; no cookies set (DevTools → Application).

## 6. [ ] Parked / later

- **Tag filter or search on `/knowledge`** — revisit at ~10+ articles; premature at 6.
- **Dark mode** — large: the whole card design assumes a white surface; needs a full palette pass + `prefers-color-scheme` + the OG cards stay light.
- **Related-articles block** beyond prev/next (needs tags richer than the current 3).
- **Local copy of the Shannon portrait** in claude-intro (currently hotlinks Wikimedia; download to `public/knowledge/` with attribution kept in the caption/references).
- **FB JS SDK revival** — blocked on Meta business verification; full plan already in CLAUDE.md (ShareButtons section). Do not attempt before the owner confirms verification is approved.
