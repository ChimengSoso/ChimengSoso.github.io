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

## 1. [x] Centralize article dates in `articles.ts` (do this first) — `30892e2`

**Why:** Publish/updated dates are currently hand-written Thai strings duplicated across `articles.ts` (`date`), each article page (`<ArticleByline published=... updated=...>` **and** the `updated` Layout prop), plus an ad-hoc `MONTH_ABBR` map in `src/pages/knowledge/index.astro`. Every new article multiplies the drift risk, and nothing machine-readable exists for JSON-LD/RSS (items 2–3).

**Steps:**
1. In `src/data/articles.ts`: replace `date`/add fields — `dateISO: string` (YYYY-MM-DD) and optional `updatedISO?: string`. Existing values: claude-intro 2026-07-01 (updated 2026-07-09), claude-code-workflow 2026-07-01 (updated 2026-07-02), handoff 2026-07-05, grill-and-loop 2026-07-05, context-pollution 2026-07-06, ai-taste 2026-07-07.
2. New `src/lib/dates.ts`: `formatThaiDate(iso)` → "1 กรกฎาคม 2026" and `formatThaiDateShort(iso)` → "1 ก.ค. 2026" (move the month maps out of the listing page). CE years, not พ.ศ.
3. Article pages: look the entry up (add a `getArticle(href)` helper next to `getAdjacentArticles`) and pass derived strings to `ArticleByline`/Layout instead of hand-written literals. Acceptance: no hand-typed Thai date literals left in `src/pages/knowledge/*.astro`.
4. Update the "Adding a new article" section of CLAUDE.md to describe the new fields.

**Verify:** listing meta rows and article bylines render the exact same strings as before (compare against git HEAD in the preview).

## 2. [x] Article structured data + OG article metadata (needs #1) — `1a3ba2d`

**Why:** Knowledge pages have OG tags but no JSON-LD; the home page already ships a `Person` JSON-LD, articles deserve `BlogPosting` for rich results.

**Steps:** In `Layout.astro`, when `type === "article"` and ISO dates are passed (extend Props): emit a `BlogPosting` JSON-LD (`headline`, `datePublished`, `dateModified`, `inLanguage: "th"`, `image` = the derived OG url, `author` = Person "Worakun Ata" with url `https://chimengsoso.github.io/`) via the same `<script is:inline type="application/ld+json" set:html={JSON.stringify(...)}>` pattern as `index.astro`. Also add `<meta property="article:published_time">` / `article:modified_time` (ISO).

**Verify:** build, then run one built article HTML through Google's Rich Results test (or schema.org validator) after deploy; confirm no double-JSON-LD on non-article pages.

## 3. [x] RSS feed (`@astrojs/rss`) — DEPENDENCY, ask first (needs #1) — `e56a696`

**Steps:** add `@astrojs/rss`; new `src/pages/rss.xml.ts` reading published entries from `articles.ts` (title, `desc` as description, `pubDate` from `dateISO`, link = `/knowledge/<href>`); `<link rel="alternate" type="application/rss+xml">` in `Layout.astro` head (and `index.astro` for symmetry); optionally a footer link. Site URL comes from `astro.config.mjs` `site`.

**Verify:** `dist/rss.xml` validates (W3C feed validator), item count = published articles, URLs directory-style with trailing slash.

## 4. [x] Self-host fonts — DEPENDENCY, ask first — `6768842`

**Why:** Removes the render-blocking Google Fonts CSS *and* the only remaining third-party data flow (would let the Google Fonts paragraph in the privacy policy be deleted).

**Steps:** add `@fontsource` packages matching current usage exactly — Sarabun 400/500/600/700, JetBrains Mono 400/500/700, Fira Code 400/500, Chakra Petch 500/600/700. Import them from **one shared module/CSS entry used by both** `index.astro` and `Layout.astro` — the two pages deliberately share one stylesheet URL so ClientRouter doesn't block the `/` ↔ `/knowledge/` swap on a new stylesheet (see the comment above the Google Fonts `<link>` in `index.astro`); keep that property. Remove both Google Fonts `<link>`s + `preconnect`s. `src/og/*.ttf` (build-time OG rendering) is unaffected — don't touch it. Then update `privacy.astro` (TH+EN): drop the Google Fonts disclosure, state that no third-party requests are made, bump date.

**Verify:** in preview, `preview_network` shows zero requests to `fonts.googleapis.com`/`fonts.gstatic.com`; Thai glyphs + tone marks render in Sarabun (check the donate FAB label, which is sensitive to font metrics); `/` ↔ article navigation still swaps instantly.

## 5. [x] Privacy-friendly analytics — needs an owner decision first — `ad1e85a`

**Why:** Owner wants share/traffic stats (see the FB SDK revival notes in CLAUDE.md) without a cookie banner. Options: GoatCounter (free, no cookies), Plausible (paid), Cloudflare Web Analytics (free, needs DNS on CF). Ask the owner which; create the account with them.

**Steps:** add the provider's script in `Layout.astro` + `index.astro`. **ClientRouter caveat:** page views after the first load are client-side swaps — fire a manual pageview inside a `document.addEventListener('astro:page-load', ...)` handler (all providers document an SPA API), otherwise only the first page counts. Consider skipping `/divine-lore/`. Update `privacy.astro` TH+EN with the new disclosure + date bump.

**Verify:** dashboard records a hard load *and* a client-side navigation as two views; no cookies set (DevTools → Application).

## 6. [ ] Parked / later

- **Tag filter or search on `/knowledge`** — revisit at ~10+ articles; premature at 9 (site now has 9 published articles — close to this threshold, flag to owner but no action needed yet).
- **Dark mode** — large: the whole card design assumes a white surface; needs a full palette pass + `prefers-color-scheme` + the OG cards stay light.
- **Related-articles block** beyond prev/next (needs tags richer than the current 3).
- ~~**Local copy of the Shannon portrait** in claude-intro (currently hotlinks Wikimedia; download to `public/knowledge/` with attribution kept in the caption/references).~~ Done — `public/knowledge/claude-shannon.webp`.
- **FB JS SDK revival** — blocked on Meta business verification; full plan already in CLAUDE.md (ShareButtons section). Do not attempt before the owner confirms verification is approved.

## 7. [ ] Scaling to hundreds/thousands of articles (long-term — nothing to do now)

**Context:** The site is **SSG, not client-side rendering** — every article is prerendered to its own `.html` at build (`build.format: "directory"`) and served as a static file by GitHub Pages. So a reader opening one article never loads the others; **per-page runtime performance is flat regardless of article count**. `<ClientRouter />` only prefetches + swaps DOM on navigation; it does not render the whole site on the client. This item exists so the real (build-time and listing-page) bottlenecks aren't mistaken for a runtime problem later.

**Storage is not the near-term concern.** GitHub Pages soft-caps the *published* site at ~1 GB; a rough estimate is ~150–300 MB per 1,000 articles (HTML ~50 KB/page + one OG PNG ~30–80 KB/page + assets), so published size only gets tight around ~3,000–5,000+ articles. The thing that bloats *first* is **git history from images in `public/knowledge/`** — committed images stay in history even after deletion. Mitigation (adopt as a habit, no code change needed): compress images before commit (WebP/AVIF, resize to display size); only consider an external image host/CDN if per-article imagery gets heavy.

**Actual bottlenecks, in the order they'll bite (all build-time or listing-page, none affect an end reader mid-article):**
1. **`/knowledge` listing DOM** (~200–300+ articles): every card's HTML lives in one page → large DOM, slower first paint. **Fix = paginate** the listing (or split per-tag into separate pages). This is the first thing that will actually be felt — do this one first when the time comes.
2. **`npm run build` time**: grows linearly, dominated by OG-image generation (`src/pages/og/[slug].png.ts` rasterises an SVG via sharp per article). **Fix = cache/lazy-gen OG images** so unchanged articles aren't re-rasterised every build.
3. **`rss.xml`**: one entry per published article in a single file; cap it to the most recent N when it gets large.
4. **Search/filter** (see the parked "Tag filter or search" note): once scrolling hundreds of cards is impractical, a client-side filter/search over `articles.ts` beats an ever-longer listing.

**When to actually start:** none of this is warranted at the current ~9 articles. Revisit item 1 (pagination) around low-hundreds; the rest as each threshold above is reached.

## 8. [x] Retrofit the no-em-dash rule onto the older published prose `3894c34`

**Why:** `CLAUDE.md` states the zero-em-dash rule as a hard rule for all published prose (`/knowledge/*`, `/divine-lore/*`, `/cp/*`, plus `articles.ts`/`divineLore.ts`/`cp.ts`), and commit `6096395` already stripped every em-dash from the ICPC editorial. The rule was adopted after most `/knowledge/` articles were written, so those were never retrofitted. Every new page since then complies, which means the site's voice is currently split: recent pages read as the owner, older ones still carry the loudest AI tell in the guide. **1,152 em-dashes remain in 16 files** (counted 2026-09-07, after `eb5226f` cleared `divine-lore/index.astro` and `divineLore.ts`):

- `src/pages/knowledge/claude-toolbox.astro` 184
- `src/pages/knowledge/new-languages.astro` 124
- `src/pages/knowledge/model-memory.astro` 117
- `src/pages/knowledge/ai-taste.astro` 106
- `src/pages/divine-lore/global-workspace.astro` 104
- `src/pages/knowledge/claude-intro.astro` 91
- `src/pages/knowledge/video-editing.astro` 80
- `src/pages/knowledge/ai-persistence.astro` 64
- `src/pages/knowledge/claude-agent-team.astro` 58
- `src/pages/knowledge/context-pollution.astro` 56
- `src/pages/knowledge/watch.astro` 47
- `src/pages/knowledge/claude-code-workflow.astro` 45
- `src/pages/knowledge/grill-and-loop.astro` 34
- `src/pages/knowledge/handoff.astro` 25
- `src/data/articles.ts` 13
- `src/pages/knowledge/index.astro` 4

**This is NOT a find-and-replace job. Do not run one.** A blanket swap to a space or a dash produces broken Thai and mangles code. Every occurrence needs reading in context, and the guide already gives the substitution order: (a) just a space, which Thai usually reads fine without any connector; (b) split into a new sentence; (c) parentheses for a genuine aside or a heading label (`ท่าที่ 1 — ปิดเสียงเตือน` becomes `ท่าที่ 1: ปิดเสียงเตือน`); (d) a colon when what follows really is an explanation. In `<figcaption>`, `<CodeBlock title>`, SVG `<text>` labels and `<li>` lead-ins use `·` or parentheses. Inside code strings use a plain space in comments. Watch for the em-dashes that are **not** prose and must survive judgement rather than deletion: ones inside `<CodeBlock code={...}>` strings, inside SVG `<text>` labels where width is fixed, and any inside a quotation actually lifted from a cited source.

**Steps:** one file per commit, largest first or in reading order, whichever the owner prefers. Per file: read the surrounding sentence for each hit, apply the substitution order above, then `python -c "import io;print(io.open('<file>',encoding='utf-8').read().count('—'))"` must print `0`. Also grep the same file for smuggled zero-width spaces (U+200B). Changing a `title`/`desc` string in `articles.ts` regenerates that article's OG PNG and its RSS item, so rebuild and eyeball `dist/og/<slug>.png` for those. Ask the owner before rewording anything that changes meaning rather than punctuation, and never invent new claims while editing.

**Verify:** per file, the count above reaches 0; `npm run check` + `npm run lint` + `npm run build` stay green; the article renders with no orphaned punctuation or double spaces (read the touched paragraphs in the live preview, do not trust the diff alone); for any `articles.ts` edit, `/rss.xml` and `dist/og/<slug>.png` still show the new title correctly. Whole-repo done-check: the scan in **Why** returns TOTAL 0.

## 9. [ ] The two judgement calls left over from the `/cp/` knowledge uplift

**Context:** the uplift itself is done and shipped (`a8dab86`..`b9f5ac6` on `develop`): every technique a page is filed under is now named on that page, four techniques with no lesson of their own are taught where they are first used, all 29 pages have at least one picture, 12 walkthroughs became step players on the shared `src/lib/cpPlayer.ts`, 15 pages gained a second named technique with compiled and stress-tested code, and 7 subtask routes gained a cost bill. The working plan document that drove it (`docs/cp-knowledge-uplift-plan.html`) was deleted once the work landed. Two items were deliberately left as per-page judgement calls rather than applied across the board, because the owner's instruction was explicitly "ใส่เฉพาะหน้าที่มีกับดักจริง ไม่ใส่ยกแผง".

**Item A: decide, page by page, which pages want a `ตรงไหนที่ทำให้ข้อนี้ไม่ง่าย` section.** Seven pages have one (`archery`, `fifteen-puzzle`, `hearing-pairs`, `killer-square`, `miners`, `mobiles`, `pick-books`) and it is the section that makes a reader *want* the reveal, by naming the trap before showing the answer. Nine pages that plausibly want one do not have it: `anagram-window`, `functional-graph`, `interval-dp`, `linear-garden`, `prefix-sums`, `pyramid-base`, `sails`, `string-hashing`, `trie`. **Do not add it to all nine.** For each, ask whether there is a trap a reader actually falls into; if there is, name it in two or three paragraphs and end on the question the reader should now be asking. If there is not, say so and leave the page alone. Find the current state with `grep -L 'ตรงไหนที่ทำให้ข้อนี้ไม่ง่าย' src/pages/cp/*.astro`.

**Item B: give the last few pages a closing line on what transfers.** Most pages now end on one, either as a `ท่าที่ติดมือกลับไป` section, a `เอาไปใช้ที่ไหนในคลังนี้` section, or the closing paragraph of the second-technique section (which is why a plain grep undercounts this badly: `prefix-sums`, `killer-square`, `string-hashing` and `rolling-state-dp` all close on a real criteria paragraph). The ones whose last paragraph is a timing note or a bare summary rather than something the reader carries away are `anagram-window`, `archery` and `mobiles`, with `pyramid-base`'s being a single thin pointer. Read the last paragraph before `<h2>สรุปบรรทัดเดียว</h2>` on each before deciding; the fix is one paragraph, not a section.

**Also deliberately not done, and fine as is:** four of the six older step players (`interval-dp`, `fifteen-puzzle`, and both of `pick-books`') still run their own copy of the controller. Migrating them was attempted and reverted: `interval-dp` shares one `astro:page-load` handler and its helper scope with the plate-game, and the end marker used for the edit sat after `initPlateGame`, so the replacement deleted that function and the recovery failed on the declarations it depended on (`ROWS` and friends); the file was restored with `git checkout HEAD`. `fifteen-puzzle` needs per-root side data from `data-phases`, and `pick-books` has two players wired differently. Forcing those through the shared controller would push page-specific knowledge into it, which is the opposite of why it exists. Leave them unless the controller grows a clean way to carry per-root side data.

**Verify:** whatever you touch, the `/cp/` page checklist in `CLAUDE.md` applies unchanged (`npm run check` + `lint` + `build`, the centred-axis walk over `.panel`'s children at 1500px, 375px with no horizontal page scroll, and em-dash and zero-width-space greps at 0).

## 10. [x] Bring `/cp/archery` up to `/cp/pick-books` standard

**Why this page specifically:** the owner asked for `archery` to be the second page that is exemplary end to end, on the same footing as `pick-books`: as easy to follow as possible, a picture wherever the prose describes a shape, and enough hands-on rounds. It is the hardest problem in the vault (difficulty 5, seven reveal parts), so it is also the page where a reader is most likely to get lost.

**Done already, and pushed:** two new diagrams, both computed from the page's own model rather than drawn by hand.
- Part 4 (`สภาวะคงตัว`): the real board after `2N` rounds, from a new `steadyBoard()` that walks the board and returns where every rank sits and whether it moves. Rank 1 parked at target 1 in green, the circulating train of `N` in gold with the wrap arrow back to target `N`, the frozen ones in grey. The claim that the parked rank is rank 1 is re-checked at build time and printed in the caption, next to the existing `rolesClaim`.
- Part 7 (`ไม่ต้องลองทุกจุดเริ่มต้น`): the final target for every starting position from `ans1.finals`, with the tie set highlighted in gold, the answer (largest `k` among ties) in green, and a line pointing out that the row goes up then down so binary search on that value is not allowed.
- All four diagrams on the page were measured and now sit at exactly +12 right and +34 bottom, no stroke crossing any label, no label pairs overlapping. The two older diagrams were tightened at the same time (one had 64 units of dead space on the right).

**All six items are done.** Beyond the two diagrams above, the page gained: a picture for part 5 showing what `min over j` actually chooses (every candidate `j` priced from the real `n(0)`, the winner highlighted, and the point that the collected targets are always a contiguous block, which is why it collapses to a range query); a picture for part 6 showing why one formula cannot cover both phases, drawn at the starting position that actually leaves target 1 empty of strong archers, with the phase-one length derived rather than asserted; the three-branch board recurrence rewritten as an anchor sentence plus one bullet per branch plus a consequence line, per the shape `pick-books` uses; four `h3` sub-headings across parts 5 and 6, all sized below the layout's `h2`; a fourth minigame set on a board where target 1 starts empty, which is the case part 6 calls the real obstacle (the build's own guard cross-checks all five of its starting positions against a full simulation, so it could not have shipped wrong); and a closing `ท่าที่ติดมือกลับไป` section naming the four transferable moves, ending on the lesson from part 7 about not dismissing a checker's warning.

**Final numbers:** six diagrams (was two, matching `pick-books`), four minigame sets, four `h3`, nine step-player rounds. Every diagram measured at +12 right and +34 bottom with zero strokes crossing a label and zero label pairs overlapping; nothing off the centred axis at 1500px; at 375px the page does not scroll horizontally and all six diagrams scroll inside their own boxes; `check`, `lint` and `build` green; em-dash and zero-width-space both 0.

**Verify:** the `/cp/` checklist in `CLAUDE.md` unchanged, plus the two things that bit during this round: measure every diagram's content box against its `viewBox` (Thai label boxes are taller than an 18-unit line spacing, so three stacked legend lines need about 24 units each), and re-check that any value computed in the frontmatter is actually printed somewhere, since `npm run check` reports an unused one only as a hint.
