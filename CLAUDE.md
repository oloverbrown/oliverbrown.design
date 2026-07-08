# CLAUDE.md

Guidance for Claude Code working in this repo. Read this first; it captures
context that isn't obvious from the code alone.

## What this is

A static HTML/CSS/JS portfolio for **Oliver Brown** — a teacher & designer who
builds EdTech. No build step, no framework, no dependencies. Deployed via
**GitHub Pages** at the custom domain in `CNAME` (`oliverbrown.design`).

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

## Files

```
index.html            Landing page shell (4 empty sections, filled by main.js)
config.json           All content + theme
assets/css/styles.css Single stylesheet
assets/js/main.js     Landing renderer + door link
assets/js/kids.js     Canvas "kids" simulation (see below)
assets/js/piece.js    Portfolio sub-page renderer
portfolio/*.html      One per piece
sprites/              classroom_door.png, child.png (white silhouette, tinted at runtime)
designs/              Reference mockups only — NOT part of the site
CNAME                 Custom domain for GitHub Pages
```

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
- kids.js waits for the `ob:ready` event that `main.js` dispatches after render,
  so region geometry measures correctly. Don't remove that dispatch.
- Layering is deliberate: door pink `::before` (z1) < door kids canvas (z2) <
  door image (z3); lower kids canvas (z1) < section content (z2). Canvases are
  `pointer-events: none`; mouse input is read on `window`.

## Style conventions

- Font: Helvetica Neue. Only real weights exist (100/200/300/400/500/700/900) —
  **600 and 800 are not real**; `350` rounds to 300. Don't rely on them.
- All body text is black (`#000`). Section headings are centered + lowercase
  (the lowercasing is in the config text, not `text-transform`).
- The frosted white panel is `.content-box` (`rgba(255,255,255,0.15)` + blur),
  shared by portfolio cards, the about text, and the contact links. Reuse it
  rather than making new translucent boxes.
- Accent for "learn more" buttons + play icons: `#DCB8FB`.
- The intro is a centered flex group (`intro__col` sized to `max-content`) so it
  centers on the *actual wrapped text width*; door overlaps via negative margins.
  Each intro line is one array item in config with `white-space: nowrap`.

## Workflow notes

- Oliver iterates in tight visual loops: he'll ask for a small tweak, then say
  "refresh." Make the one change and tell him to refresh `http://localhost:8765`.
  Use headless Chrome screenshots (`--headless --screenshot`, add
  `--virtual-time-budget=1500` so the sim renders a frame) only to verify layout
  yourself when useful.
- Many values here (font sizes, margins, spawn counts, sim constants) were
  hand-tuned by Oliver through many iterations — change them only when asked, and
  by the amount asked.
