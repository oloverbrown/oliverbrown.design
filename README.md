# oliverbrown.design

Portfolio site for Oliver Brown — teacher & designer building targeted EdTech.

A scrollable landing page with four sections (**intro → about → portfolio → contact**)
and a sub-page for each portfolio piece. The visual concept is a classroom:
the grayscale "outside" (intro/about) leads through a door into the colorful
"inside" (portfolio/contact).

## Structure

```
index.html              Landing page (4 sections)
config.json             All copy + theme variables live here
portfolio/
  treasure-box.html     One sub-page per portfolio piece
  memory-metro.html
assets/
  css/styles.css
  js/main.js            Renders the landing page from config.json
  js/piece.js           Renders a sub-page from config.json
sprites/                Door + child art
designs/                Design mockups (reference, not served)
```

## Editing content

Everything — nav, copy, colours, and portfolio pieces — is driven by
[`config.json`](config.json). To add a portfolio piece, add an entry to
`portfolio.pieces` and create a matching `portfolio/<slug>.html`
(copy an existing one and change the `data-slug`).

## Running locally

The pages load `config.json` via `fetch`, so serve over HTTP rather than
opening the file directly:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

Works as-is on any static host. For GitHub Pages, enable Pages on the
`main` branch (root) in the repo settings.

Font: Helvetica Neue.
