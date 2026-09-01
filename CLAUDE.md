# CLAUDE.md

Guidance for Claude Code working in this repo. Read this first; it captures
context that isn't obvious from the code alone.

## What this is

A static HTML/CSS/JS portfolio for **Oliver Brown** — a senior learning game
designer who builds EdTech. No build step, no framework, no dependencies.
Deployed via **GitHub Pages** at the custom domain in `CNAME`
(`oliverbrown.design`).

Repo: `github.com/oloverbrown/oliverbrown.design` (note the GitHub username is
`oloverbrown`, not `oliverbrown`). Oliver pushes with **GitHub Desktop**, not the
CLI — so leave changes committed-or-not per his request, and don't assume `gh`
or push credentials exist in this environment.

## The concept (don't break the metaphor)

A classroom. The **intro** is "outside" — white background, a large classroom
door centered between two columns of text. Clicking the door scrolls to About.
The **about → portfolio → contact** sections are "inside" — one continuous pink
(`#F7C9FF`) region. Animated pastel "kids" wander both the small pink area behind
the door's window and the whole lower pink region.

## Architecture

- **Everything is config-driven.** All copy, nav, theme colors, and portfolio
  pieces live in [`config.json`](config.json). `main.js` renders the landing page
  from it; `piece.js` renders each portfolio sub-page (sub-page sets
  `<body data-slug="...">` and piece.js looks it up). Prefer editing config over
  hardcoding content in HTML/JS.
- **Must be served over HTTP**, not opened as a `file://` — the JS `fetch`es
  `config.json`. Local dev: `python3 -m http.server 8765` then
  `http://localhost:8765`. (There is usually already a server on 8765 during a
  session.)
- To add a portfolio piece: add an entry to `portfolio.pieces` in config.json
  **and** create a matching `portfolio/<slug>.html`.
- Hidden pieces live in `portfolio.pieces_hidden` in config.json — move an entry
  back into `portfolio.pieces` to restore it. Creative Decimal Division is currently
  hidden there.
- Nav entries in config support an optional `"target": "_blank"` (renderer adds
  `rel="noopener"`). Used by the "resume" link, which points at the PDF in the
  repo root. The first nav entry is the brand ("Oliver Brown", top-left).

## Files

```
index.html              Landing page shell (sections filled by main.js)
config.json             All content + theme
assets/css/styles.css   Single stylesheet
assets/js/main.js       Landing renderer + door link
assets/js/kids.js       Canvas "kids" simulation (see below)
assets/js/piece.js      Portfolio sub-page renderer
portfolio/*.html        One per piece (treasure-box, memory-metro, greenfield-game,
                          dress-rehearsal, variable-pipes, migration-data-poetry,
                          creative-decimal-division [hidden in pieces_hidden])
sprites/                classroom_door.png, child.png (white silhouette, tinted at runtime)
website_photo.png       Oliver's photo, shown in the about section
pillar_backing.png      White silhouette behind each design pillar (CSS-mask tinted)
skill_backing.png       White silhouette behind each skill (CSS-mask tinted)
Oliver Brown Resume.pdf Resume; opened in a new tab by the nav + about buttons
Greenfield_game_thumbnail.jpg       Main-page card thumbnail
migration_data_thumbnail.png        Main-page card thumbnail
dress_rehearsal_thumbnail.png       Main-page card thumbnail
CDD_thumbnail.png                   Main-page card thumbnail (Creative Decimal Division)
VP_thumbnail.png                    Main-page card thumbnail (Variable Pipes)
memory_metro_thumb.png              Main-page card thumbnail (Memory Metro)
designs/                Reference mockups only — NOT part of the site
CNAME                   Custom domain for GitHub Pages
```

## Config schema — portfolio pieces

Each entry in `portfolio.pieces` supports:

```jsonc
{
  "slug":        "my-piece",          // matches portfolio/<slug>.html
  "title":       "MY PIECE",          // ALL CAPS
  "subtitle":    "...",               // shown on main page card
  "details":     "Role | Org | Year", // shown on subpage below title; omitted on card
  "overview":    ["paragraph", ...],  // subpage body text
  "disclosures": "...",               // small print below overview; omit or "" to hide
  "heroLabel":   "coming soon",       // text centered over the hero/thumb; suppresses play button.
                                      // Main-page cards hide it when "image" is set; subpage always shows it.
  "youtubeId":   "VIDEO_ID",          // YouTube embed on subpage
  "vimeoId":     "VIDEO_ID",          // Vimeo embed on subpage
  "itchioEmbed": "https://itch.io/embed-upload/ID?color=XXXXXX",  // itch.io playable embed on subpage
  "itchioSize":  [1920, 1080],        // native resolution of the itch.io game (default 1920×1080)
  "video":       "",                  // native <video> fallback (rarely used)
  "image":       "path/or/url",       // card thumbnail on main page
  "comingSoon":  true                 // DEPRECATED — use heroLabel instead
}
```

Hero priority: `youtubeId` → `vimeoId` → `itchioEmbed` → `video` → `image` → play-button placeholder.

**itch.io embed scaling gotchas:**
- The iframe is rendered at native size (`itchioSize`) then CSS-scaled down to fit the container width using `transform: scale(s)` with `transform-origin: top left`.
- Scale factor is `(containerWidth / nativeW) * 1.11`; container height is set to `nativeH * s * 0.89` (the 1.11/0.89 multipliers were hand-tuned for the dress-rehearsal piece).
- The initial `scale()` call is deferred with `requestAnimationFrame` so `hero.offsetWidth` is non-zero when it runs (the element must be in the DOM first).
- `.piece-page__hero--itchio` overrides the hero's `display: flex` to `display: block` so the iframe sits at `(0,0)` before scaling — without this, flex centering offsets the 1920px iframe and the wrong quadrant of the game appears.

## About section

Rendered top to bottom by `renderAbout`: heading → pillars → text row → skills.

- **Pillars** (`about.pillars`): three `{ "text", "color", "description" }` entries.
  Text is 2rem / weight 300. Each pillar is a flex column: `.about__pillar__shape`
  (holds the backing + text, `aspect-ratio: 708/253`) → `.about__pillar__caret`
  (a `›` rotated 90°, 2.8rem, flips to 270° when open) → `.about__pillar-desc`
  (description paragraph, hidden via `grid-template-rows: 0fr` when closed).
  Clicking any pillar toggles all three descriptions open/closed simultaneously.
  Hovering a pillar darkens its shape (`filter: brightness(0.88)` on `.about__pillar__shape`).
  The backing is `pillar_backing.png` tinted via CSS mask on `.about__pillar__shape::before`.
  Descriptions: no backing, left-aligned, 1.1rem.
- **Bio blocks** (`about.blocks`): objects `{ "text": "...", "highlight": "phrase" }`.
  `highlight` can be a **string** (one phrase) or an **array of strings** (multiple
  phrases); each is wrapped in `.about__highlight` (bold). Font-size: 1.1rem.
- `.about__photo-col` is `position: absolute`, centered horizontally over the text
  row via `left: 50%; transform: translate(-50%, calc(-50% - 10px))`. Fixed height
  of **275px** — does not stretch to text height. `z-index: 2` so the resume button
  (which hangs 50% below the col via `transform: translate(-50%, 50%)`) renders
  above the sibling text blocks (z-index: 1).
- The middle grid column (`.about__image`) is `visibility: hidden` — it just holds
  the photo's space open in the 3-column grid.
- **Narrow layout (≤900px):** the bio row switches to `flex-direction: column` with
  CSS `order`: block[0] first (order 1), photo-col second (order 2), block[1] third
  (order 3). `about__image` is hidden. Photo-col becomes `position: relative` so it
  flows in the column.
- **Skills** (`about.skills`): flat string array labelled "Skills / Services" (set
  in `main.js`, not config). Shown in a 4-column grid (8 skills = 2 rows) at wide
  layouts; drops to 2 columns at ≤900px. Text is 1.3rem / weight 300 over
  `skill_backing.png`, mask-tinted by cycling `theme.childColors` in order
  (`--skill-color`); with 8 skills the last one wraps back to the first color.
- About section labels (Design Pillars, Bio, Skills / Services) and the headline
  are **left-aligned**. Pillar text within each pillar shape remains centered.
- **About headline** (`about__headline`): `text-align: left`, `letter-spacing: 0.02em`
  (hand-tuned so the text visually spans the width of the content box below it).

## The intro layout

- CSS Grid: `1fr auto 1fr` — door is always centered in the `auto` middle column.
- Left/right text columns overlap the door via negative `margin-right`/`margin-left`
  (currently `-80px`). Each intro line is one array item in config with
  `white-space: nowrap`.

## Scroll architecture (important — don't break)

`<main>` is the scroll container on **both** the main page and subpages. Its CSS:

```css
main {
  position: relative;
  margin-top: var(--nav-h);
  height: calc(100vh - var(--nav-h));
  overflow-y: scroll;
  overscroll-behavior: none;
  scroll-behavior: smooth;
  background: var(--inside-bg);
}
```

- `margin-top` positions main exactly at the navbar bottom; `overflow-y: scroll`
  clips content that scrolls above that line. This is the only correct way to
  prevent content from showing behind the navbar — JS clip-path can't keep up
  with the compositor and always lags on macOS elastic scroll. Don't revert to
  clip-path.
- `overscroll-behavior: none` is on `main` (the actual scroll container), not just
  `html`/`body`. Must stay on the scroll container element.
- `background: var(--inside-bg)` fills the pink "inside" color behind the
  sections, including the bottom overscroll bounce zone.
- On subpages, `<main class="piece-page">` is both the scroll container and the
  content root. `.piece-page` has higher CSS specificity than `main` (class vs
  element selector), so any property `.piece-page` sets overrides `main`. Currently
  `.piece-page` sets `background: transparent` (kids show through), `z-index: 3`
  (content above kids), and `margin-top: var(--nav-h)` (below navbar). The
  `height`, `overflow-y`, and `overscroll-behavior` come from the `main` rule.
- `<main>` does NOT have an explicit `z-index` on the main landing page — this is
  intentional: no stacking context means children's z-indexes (headline z:1,
  about__box z:3) participate in the root stacking context. The kids canvas (z:2,
  fixed, outside main) correctly slots between them.

## Z-index layering

```
z: 100  nav text (.nav, position fixed)
z:   3  section content: .about__box, .portfolio__grid, .contact__links.content-box,
        .piece-page (subpages)
z:   2  kids canvas (.kids-canvas--lower, position fixed, outside main)
z:   1  nav background (.nav__bg, position fixed) + .about__headline +
        .portfolio .section__heading + .contact h2
```

Kids walk in front of the navbar bar, the about headline, and the portfolio/contact
section headings, but behind all card/link content. `.portfolio` and `.contact`
containers have NO z-index (no stacking context) — z:3 is set directly on
`.portfolio__grid` and `.contact__links.content-box` so their children participate
in the root stacking context. On subpages, `.piece-page { z-index: 3 }` creates a
stacking context — all piece content renders at z:3 globally, so kids appear behind it.

## The kids simulation ([`kids.js`](assets/js/kids.js))

Canvas-based crowd sim. Two regions, each its own `<canvas>` layer:
- **Door region** — 25 kids on the small pink rectangle behind the door window;
  `noIdle: true` (continuous movement), `clickable: false`. Main page only.
- **Lower region** — kids across the full viewport; responds to clicks. Runs on
  **both** the main page and all portfolio subpages.

Key properties of the lower region:
- `spriteW: 62` (10% smaller than the original 69)
- Canvas extends 1 sprite-width (`62px`) beyond every viewport edge so kids can
  spawn and walk in from off-screen. `measure()` returns
  `{ left: -62, top: -62, width: clientWidth+124, height: clientHeight+124 }`;
  `Region.resize()` sets inline styles that override the CSS defaults.
- `cycleColors: true` — colors cycle sequentially through `KID_COLORS` instead
  of randomly, so the full palette is always evenly represented.
- Kids spawn at the canvas perimeter (`atEdge: true`) so they walk in from all
  edges and are never visible at rest.
- Count scales to crowd density based on about/contact section height (+20 extra).

**State persistence across navigation:**
Kids save their full state to `sessionStorage` (`'kids-lower'` key) on
`pagehide`, and restore it on the next page load. Saved fields per kid:
`x, y, dir, ci, state, speed, targetSpeed, stateDur, stateElapsed`. This means
kids continue moving exactly as they were after navigating to/from a subpage.
On subpages, kids.js listens for `DOMContentLoaded` instead of `ob:ready`
(piece.js never dispatches `ob:ready`). The sprite path on subpages is
`../sprites/child.png` (one level up from `portfolio/`).

Each `portfolio/*.html` must include both:
```html
<script src="../assets/js/piece.js"></script>
<script src="../assets/js/kids.js"></script>
```

Tunable constants live at the top of the file (`MOUSE_RADIUS`, `ATTRACT`,
`CLICK_*`, `IDLE_*`, `MOVE_*`, `SPEED_*`, `LOWER_SPRITE_W`) and the spawn
counts are in `start()`.

Gotchas:
- **Collision escape valve:** `Kid.step()` only blocks a move that pushes *further into* an
  overlapping neighbour — moves that increase separation are allowed. This prevents kids from
  freezing in a vertical pile after a window resize clamps multiple kids to the same edge.
  Don't revert this to a simple "any overlap = blocked" check.
- The kid palette is **hardcoded** as `KID_COLORS` in kids.js; `theme.childColors`
  in config.json is a manually-synced copy of it (the about skills tint from the
  config copy). If one changes, change the other.
- kids.js waits for the `ob:ready` event that `main.js` dispatches after render,
  so region geometry measures correctly. Don't remove that dispatch.
- After `ob:ready`, `main.js` also re-scrolls to `window.location.hash` so that
  "back to portfolio" links land correctly after dynamic content shifts the layout.

## Sub-page layout

Each `portfolio/*.html` has `<body class="subpage" data-slug="...">` and a single
`<main class="piece-page" id="piece-root">` filled by `piece.js`. The `main` CSS
makes it a full-width scroll container; `.piece-page` overrides to transparent
background and `z-index: 3`. Content structure rendered by `renderPiece`:

```
.back-link                    ← pill button, outside the box
.content-box.piece-page__content-box
  .piece-page__title (h1)
  .piece__details (p, optional)
  .piece-page__hero
  .piece-page__body
.back-link.back-link--bottom  ← pill button, outside the box
```

`.piece-page__content-box` is `max-width: var(--maxw); margin: 1.5rem auto` —
this centers the content while the scroll container (`<main>`) stays full-width
so the scrollbar sits at the right edge of the window.

## Style conventions

- Font: Helvetica Neue. Only real weights exist (100/200/300/400/500/700/900) —
  **600 and 800 are not real**; `350` rounds to 300. Don't rely on them.
- All body text is black (`#000`). Section headings are centered + lowercase
  (the lowercasing is in the config text, not `text-transform`).
- The frosted white panel is `.content-box` (`rgba(255,255,255,0.25)` + blur),
  shared by portfolio cards, the about text blocks, the contact links, and the
  subpage content box. Reuse it rather than making new translucent boxes.
- Accent color for "learn more" buttons, play icons, `heroLabel` text, and the
  "my resume" button: `#DCB8FB`.
- **White-silhouette tinting:** `pillar_backing.png` / `skill_backing.png` are
  all-white PNGs colored at runtime with a CSS mask on a `::before` layer
  (`mask: url(...) center / contain no-repeat` + `background: var(--*-color)`);
  the text sits in a sibling `span` above the mask layer. child.png does the same
  idea on canvas. Follow this pattern for any new tintable art.
- CSS `url()` paths in styles.css resolve relative to `assets/css/`, so root-level
  images need the `../../` prefix.
- Portfolio cards: info column (title + subtitle + "learn more") is centered via
  `.piece__info { display: flex; flex-direction: column; align-items: center; }`.
- "back to portfolio" buttons use the same pill style as "learn more" (`#DCB8FB`
  background, `999px` radius). One at the top, one at the bottom of each sub-page,
  outside the `.content-box`.

## Workflow notes

- Oliver iterates in tight visual loops: he'll ask for a small tweak, then say
  "refresh." Make the one change and tell him to refresh `http://localhost:8765`.
- The generic "Could not load config.json" error fires on **any** JS exception in
  `init()`, not just fetch failures. If config.json is valid JSON but the page
  still errors, suspect a stale cached script — tell Oliver to hard-refresh
  (⌘ + Shift + R).
- Many values here (font sizes, margins, spawn counts, sim constants) were
  hand-tuned by Oliver through many iterations — change them only when asked, and
  by the amount asked.
- Oliver measures spacing from Retina screenshots (2× CSS px). The macOS overlay
  scrollbar paints ~17px **over** the page's right edge while visible, so
  right-side gaps can *look* smaller than the CSS says. The nav padding is
  symmetric (verified pixel-exact in headless Chrome) — don't "fix" it with
  asymmetric padding. Headless Chrome + a screenshot is the reliable way to
  settle layout disputes.
- **Narrow nav (≤760px):** `--nav-h` increases to `7.5rem`. The nav uses
  `flex-wrap: wrap`; `.nav__brand` is `flex: 0 0 100%` so it occupies the full
  first row and the links wrap to a second row beneath it.
