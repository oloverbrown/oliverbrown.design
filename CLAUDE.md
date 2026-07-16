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
- Nav entries in config support an optional `"target": "_blank"` (renderer adds
  `rel="noopener"`). Used by the "resume" link, which points at the PDF in the
  repo root. The first nav entry is the brand ("Oliver Brown", top-left).

## Files

```
index.html              Landing page shell (4 empty sections, filled by main.js)
config.json             All content + theme
assets/css/styles.css   Single stylesheet
assets/js/main.js       Landing renderer + door link
assets/js/kids.js       Canvas "kids" simulation (see below)
assets/js/piece.js      Portfolio sub-page renderer
portfolio/*.html        One per piece (treasure-box, memory-metro,
                          greenfield-game, migration-data-poetry)
sprites/                classroom_door.png, child.png (white silhouette, tinted at runtime)
website_photo.png       Oliver's photo, shown in the about section
pillar_backing.png      White silhouette behind each design pillar (CSS-mask tinted)
skill_backing.png       White silhouette behind each skill (CSS-mask tinted)
Oliver Brown Resume.pdf Resume; opened in a new tab by the nav + about buttons
Greenfield_game_thumbnail.jpg   Main-page card thumbnail
migration_data_thumbnail.png    Main-page card thumbnail
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
  "video":       "",                  // native <video> fallback (rarely used)
  "image":       "path/or/url",       // card thumbnail on main page
  "comingSoon":  true                 // DEPRECATED — use heroLabel instead
}
```

Hero priority: `youtubeId` → `vimeoId` → `video` → `image` → play-button placeholder.

## About section

Rendered top to bottom by `renderAbout`: heading → pillars → text row → skills.

- **Pillars** (`about.pillars`): three `{ "text", "color" }` entries shown under
  the heading. Text is 2rem / weight 300; the backing is `pillar_backing.png`
  tinted via CSS mask with the entry's color (`--pillar-color`), scaled 1.07.
- Two text blocks stored as objects: `{ "text": "...", "highlight": "phrase" }`.
  The `highlight` phrase is wrapped in `.about__highlight` (bold, nowrap) in `renderAbout`.
- `.about__photo-col` is absolutely positioned over the middle of the text row and
  spans its full height: the photo's top aligns with the top of the text blocks, and
  the "my resume" button is pinned to the bottom (aligned with the text blocks'
  bottoms, overlapping the photo). The button's width is computed from `--maxw`
  (¾ of a skill-cell width) so it keeps its size wherever it lives.
- The middle grid column (`.about__image`) is `visibility: hidden` — it just holds
  the photo's space open in the 3-column grid.
- **Skills** (`about.skills`): flat string array shown below the text row in a
  4-column grid (8 skills = 2 rows). Text is 1.3rem / weight 300 over
  `skill_backing.png`, mask-tinted by cycling `theme.childColors` in order
  (`--skill-color`); with 8 skills the last one wraps back to the first color.

## The intro layout

- CSS Grid: `1fr auto 1fr` — door is always centered in the `auto` middle column.
- Left/right text columns overlap the door via negative `margin-right`/`margin-left`
  (currently `-80px`). Each intro line is one array item in config with
  `white-space: nowrap`.

## The kids simulation ([`kids.js`](assets/js/kids.js))

Canvas-based crowd sim. Two regions, each its own `<canvas>` layer:
- **Door region** — kids on the small pink rectangle behind the door window;
  `noIdle: true` (continuous movement), `clickable: false`.
- **Lower region** — kids across the about→contact pink area; responds to clicks.

Tunable constants live at the top of the file (`MOUSE_RADIUS`, `ATTRACT`,
`CLICK_*`, `IDLE_*`, `MOVE_*`, `SPEED_*`) and the spawn counts / `spriteW` are in
the `start()` bootstrap. Behavior per kid: random color from the 7 pastel hexes,
random heading, idle/move states with a triangular speed ramp, boundary radius =
½ sprite width (feet-based) for wall + kid collisions, turn-opposite-±90° on
obstacle, mouse-move attraction, click = strong sustained seek then scatter,
y-sorted draw order each frame.

Gotchas:
- Sprite `SPRITE_SRC` is resolved **relative to index.html** (`sprites/child.png`),
  not to the JS file.
- The kid palette is **hardcoded** as `KID_COLORS` in kids.js; `theme.childColors`
  in config.json is a manually-synced copy of it (the about skills tint from the
  config copy). If one changes, change the other.
- kids.js waits for the `ob:ready` event that `main.js` dispatches after render,
  so region geometry measures correctly. Don't remove that dispatch.
- After `ob:ready`, `main.js` also re-scrolls to `window.location.hash` so that
  "back to portfolio" links land correctly after dynamic content shifts the layout.
- Layering is deliberate: door pink `::before` (z1) < door kids canvas (z2) <
  door image (z3); lower kids canvas (z1) < section content (z2). Canvases are
  `pointer-events: none`; mouse input is read on `window`.

## Style conventions

- Font: Helvetica Neue. Only real weights exist (100/200/300/400/500/700/900) —
  **600 and 800 are not real**; `350` rounds to 300. Don't rely on them.
- All body text is black (`#000`). Section headings are centered + lowercase
  (the lowercasing is in the config text, not `text-transform`).
- The frosted white panel is `.content-box` (`rgba(255,255,255,0.15)` + blur),
  shared by portfolio cards, the about text blocks, and the contact links. Reuse it
  rather than making new translucent boxes.
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
- Sub-page layout: title and details are centered; hero spans full width; body text
  (`max-width: 100%`) is left-aligned.
- "back to portfolio" buttons use the same pill style as "learn more" (`#DCB8FB`
  background, `999px` radius). One at the top, one at the bottom of each sub-page.

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
