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

## 9. [x] The two judgement calls left over from the `/cp/` knowledge uplift — `19e7517`, `c32d86e`

**Context:** the uplift itself is done and shipped (`a8dab86`..`b9f5ac6` on `develop`): every technique a page is filed under is now named on that page, four techniques with no lesson of their own are taught where they are first used, all 29 pages have at least one picture, 12 walkthroughs became step players on the shared `src/lib/cpPlayer.ts`, 15 pages gained a second named technique with compiled and stress-tested code, and 7 subtask routes gained a cost bill. The working plan document that drove it (`docs/cp-knowledge-uplift-plan.html`) was deleted once the work landed. Two items were deliberately left as per-page judgement calls rather than applied across the board, because the owner's instruction was explicitly "ใส่เฉพาะหน้าที่มีกับดักจริง ไม่ใส่ยกแผง".

**Item A: decide, page by page, which pages want a `ตรงไหนที่ทำให้ข้อนี้ไม่ง่าย` section. DONE, decided page by page.** The section names the trap before the reveal, which is what makes a reader *want* the reveal. It is a **problem-page** device: the eleven lesson pages (`prefix-sums`, `state-graph-bfs`, `tree-dp`, `string-hashing`, `interval-dp`, `rolling-state-dp`, `sliding-window`, `trie`, `count-then-walk`, `functional-graph`, `segment-tree`) all open with an `อาการ ·` or `ปัญหาที่บทนี้แก้` section that already *is* this section in lesson form, and the heading's word `ข้อนี้` does not fit a lesson anyway. They are excluded, which corrects this item's original list (it wrongly named `prefix-sums`, `interval-dp`, `string-hashing`, `trie` and `functional-graph` as candidates, and predated the vault growing to 29 pages).

Of the eleven **problem** pages that lacked it, two had a genuine pre-reveal trap and got one (`19e7517`):
- `type-printer` — the print order is ours to choose, so the naive search is every ordering of up to 25,000 words; the 40-point subtask (`N ≤ 18`) actively baits a bitmask DP that dies at `N = 19` and extends to nothing.
- `training-route` — two stacked blow-ups: up to `2^4001` subsets of closable roads, and verifying even one of them means looking at every simple cycle (the problem's own 8-road sample already holds 12, counted at build time by a new `countSimpleCycles` in the frontmatter).

The other nine were left alone deliberately, each for a stated reason. `anagram-window`, `linear-garden`, `pyramid-base` and `fish-jewels` already state the blow-up inside the `ใบ้` callout, so a section would only repeat it. `sails` and `islands` hand the key simplification over in the story itself. `teleporters`'s trap is a post-reveal implementation bug (a greedy formula that passes both of the statement's samples and is still wrong), which belongs in the `ที่มา` callout where it already lives. `dna-kth` and `flood-walls` carry both difficulties in an `ใบ้` that already ends on the right question. Re-check the current state with `grep -L 'ตรงไหนที่ทำให้ข้อนี้ไม่ง่าย' src/pages/cp/*.astro` (the eleven lesson pages and `index.astro` are expected hits).

**Item B: give the last few pages a closing line on what transfers. DONE.** Most pages already ended on one, either as a `ท่าที่ติดมือกลับไป` section, a `เอาไปใช้ที่ไหนในคลังนี้` section, or the closing paragraph of the second-technique section (which is why a plain grep undercounts this badly: `prefix-sums`, `killer-square`, `string-hashing` and `rolling-state-dp` all close on a real criteria paragraph). `archery` gained its section during item 10. The remaining three each ended on a timing note or a bare pointer and now close on one paragraph, added inside the page's final `<Spoiler>` so it stays part of the reveal (`c32d86e`):
- `anagram-window` — the test for reusing the pay-only-the-difference move: can the thing you keep be repaired from the delta alone? Counts and sums can, a window maximum cannot, and that is the boundary where the tool has to change. Points at the monotonic-deque section of `sliding-window`.
- `mobiles` — when an operation may be applied any number of times, ask first what it *cannot* change: that part is settled before you start and usually rejects a large block of answers immediately, leaving only the rest to search. Points at `tree-dp`.
- `pyramid-base` — two layers: the monotonicity precondition that licenses binary search on the answer (and turns "how big" into the cheaper "is this size possible"), and the timing lesson the page's own story earned, that work repeated inside the binary search's loop should be hoisted out before anything heavier gets rewritten.

Written to be criteria the reader can apply elsewhere rather than a recap of the page. Verified with `check`/`lint`/`build`, the centred-axis walk at 1500px (only `p.tag` off-axis on all three, which is the documented exception), no horizontal page scroll at 375px, and em-dash and zero-width-space greps at 0.

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

## 11. [x] Three things a reader of `/cp/` would want next

**Where this came from:** on 2026-09-09 the owner asked what a reader of the `/cp/` articles would want improved, judged on four things: easy to read, bridges between pages, worked examples of the right way, and worked examples of the wrong way. A structural audit of all 29 pages says three of the four are already strong; the gaps are ranked below.

**The full plan, with the evidence, the proposed shape for each fix, and the re-measure script, is in `docs/cp-reader-improvements-plan.html`.** That file is temporary in the same way `docs/cp-derivation-narrative-plan.md` was: work from it, keep its status table current, and when all three items land, fold the summary back into this entry and delete it.

1. **No wrong code anywhere in the vault** (do first). All 132 `<CodeBlock>`s are correct code. Five pages (`islands`, `pyramid-base`, `teleporters`, `archery`, `sails`) narrate a specific bug that passed every sample in the statement, but the reader never sees the broken line beside the fixed one. Fix: one extra `<details>` per page inside the existing `<Spoiler>`, holding the broken snippet, the smallest input that breaks it, and the wrong number next to the right one. The broken code still has to compile and still has to be shown to pass the statement's samples.
2. **Prerequisite bridges are stated in prose but never linked** (cheapest). `pick-books` says "DP บนช่วง" 10 times and never links to the `interval-dp` lesson, though its own `cp.ts` description says it builds on it; `hearing-pairs` says "เฟนวิก" 8 times and "ผลรวมสะสม" 5 times with no link to `prefix-sums`; `archery` names the segment tree and binary search and links to neither. Six pages have no outbound link at all, five have no inbound. Fix: one link at the first mention. Measured scope is 5 links across 4 files (`hearing-pairs`, `pick-books`, `archery` x2, and `rolling-state-dp` if the single mention warrants it); `state-graph-bfs` and `tree-dp` have no outbound link because they are foundation lessons themselves, which is correct.
3. **No table of contents on `/cp/` while `/knowledge/` has one** (needs a decision first). `pick-books` is 118,914 characters with 11 `h2`s and `archery` is 90,411 with 16, against a vault median of 40,144. `Layout.astro` builds a sticky TOC from `h2`s; `CpProblemLayout` has none. The catch is that section titles give the answer away, so a plain TOC fights the reveal-after-hint rule the whole vault is built on. Ask the owner before building anything.

**Caveat carried from the audit:** the findings above come from measuring structure (headings, links, code blocks, length), not from reading all 29 pages end to end as a reader. Read the page in full before acting on item 1 or 3.

**Done 2026-09-09.** All three landed. (1) Five pages (`islands`, `pyramid-base`, `teleporters`, `archery`, `sails`) now show the broken code beside the fixed line, each with the minimal failing input found by sweeping small cases against the page's own brute force, and each verified by actually compiling both versions. Four of the five bugs do pass the statement's samples; `sails`'s does not, and its expander says so. (2) The bridge work turned out to be 2 links, not the 13 first estimated: `hearing-pairs` to `prefix-sums` and `pick-books` to `interval-dp`. `archery` deliberately gets none, because both times it names binary search it says that approach does not work there. (3) `CpProblemLayout` gained a floating table of contents that masks the title of any section whose reveal is still locked, and unmasks it the moment the reader opens that reveal. The conventions this produced are written up in `CLAUDE.md`; `docs/cp-reader-improvements-plan.html` holds the working notes and can be deleted.

**Closed 2026-09-09.** The dead `bool ok = true;` in `brute_tele.cpp` on `/cp/teleporters` is gone, and the owner chose absolute links, so every in-vault link under `src/pages/cp/` is now `href="/cp/<slug>/"` (63 relative ones rewritten, plus the hub's card href). An audit only has to count one form from here on.

## 12. [x] Two bugs found after item 11 shipped (screenshots, 2026-09-09)

Full notes, with what was verified versus what is still a hypothesis, are in `docs/cp-reader-improvements-plan.html` under "บักที่เจอหลังส่ง". Both are now fixed and verified on `npm run preview` (the real build), not the dev server.

**A. The hub's filter rail is stranded on a problem page's body after a client-side navigation** (pre-existing, unrelated to item 11). On `/cp/archery/` the whole `/cp/` filter rail renders unstyled below the footer, twice. Verified: `DivineLoreLayout` line 60 really does render `<ClientRouter />`, so hub → problem is a DOM swap, not a fresh load (**`CLAUDE.md` currently claims this layout has no ClientRouter — that line is wrong and should be corrected**); `src/pages/cp/index.astro` moves the rail to `document.body` in side mode because `.panel`'s animation leaves a `transform` that would capture a `position:fixed` child; the restore is a single `astro:before-swap` listener registered with `{ once: true }`; and the `resize` listener that calls `layoutRail` is never removed on navigation. Unproven hypothesis: stale `resize` listeners from earlier visits re-append their own detached rail onto the shared `body` after the swap, which would explain both the stranding and the duplicate. Reproduce on `npm run preview`, not `npm run dev`, at a viewport wide enough for side mode, going hub → problem → hub → problem.

**B. The new table of contents masks too much to navigate by.** Headings that contain no ` · ` separator get their whole title replaced by `…`, so on `archery` both `เดินกระดานให้ดูหนึ่งชุด` and `โค้ดเต็มขอบเขต` appear as bare `…` rows that cannot be identified, and the current-section marker can land on one of them. Neither of those titles gives anything away, so the masking buys no protection. Separately the floating button overlaps the prev/next card and the open panel covers the right half of the article. The likely one-line fix for the first two is to mask only headings that actually have a separator; the overlap is a placement decision for the owner.

**Why the verification missed B:** the check counted how many rows were masked (`masked: 10`) and accepted the number without reading what the masked rows still said, and never opened the panel over real content to look for overlap.

**Fixes, 2026-09-09.** A: the real cause was the `resize` listener in `src/pages/cp/index.astro`, which was never removed on navigation. Its closure kept the old hub's rail, so any resize on the next page ran `layoutRail` and re-appended that detached rail to the shared `body`; every extra hub visit added another listener, which is why the rail appeared twice. The `astro:before-swap` handler now removes the listener and clears the pending timer as well as restoring the rail, and `layoutRail` bails when its anchor comment is no longer connected. Verified over three hub↔problem round trips with a resize fired on each page: the problem pages hold zero stranded rails and the hub keeps exactly its own one, and the hub's 34 filter chips still work (29 → 11 → 29).

B: masking now applies only to headings that actually contain the ` · ` separator, so the two unidentifiable `…` rows on `archery` read as `เดินกระดานให้ดูหนึ่งชุด` and `โค้ดเต็มขอบเขต` again (bare-`…` count 0, masked count 10 → 8, and revealing a section still restores its full title). The floating button now hides itself, with `pointer-events:none`, once the prev/next card is on screen; hit-testing the centre of the "ข้อถัดไป" link returns the link rather than the button. The panel also closes on an outside click, alongside Esc and the close button.

**One thing that changed during the fix, worth keeping:** the tuck was first written with an `IntersectionObserver`, and a control test showed that a fresh observer on a plainly-visible element never fires a callback in the preview pane at all. It was rewritten to a geometry check inside the existing scroll handler, which the pane can exercise by dispatching a `scroll` event. Do not use `IntersectionObserver` for anything that has to be verified in this pane.

**Closed 2026-09-09.** `CLAUDE.md`'s `DivineLoreLayout` note was corrected in `d0cb37f`, the two `/cp/` link styles are unified on the absolute form, and the dead `bool ok` is removed. Nothing from items 11-12 remains open.
