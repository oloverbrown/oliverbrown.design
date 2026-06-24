/* ============================================================
   oliverbrown.design — portfolio sub-page renderer
   Each sub-page sets <body data-slug="..."> and this script
   pulls that piece's content from config.json.
   ============================================================ */

const CONFIG_URL = '../config.json';

async function loadConfig() {
  const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${CONFIG_URL} (${res.status})`);
  return res.json();
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function applyTheme(cfg) {
  const r = document.documentElement.style;
  const i = cfg.theme.inside;
  if (cfg.site.font) r.setProperty('--font', cfg.site.font);
  r.setProperty('--inside-bg', i.background);
  r.setProperty('--inside-text', i.text);
  r.setProperty('--inside-card', i.card);
  r.setProperty('--inside-accent', i.accent);
}

function renderNav(cfg) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const [brand, ...links] = cfg.nav;
  // From a sub-page, links point back to the landing page sections.
  nav.appendChild(el('a', { class: 'nav__brand', href: `../index.html${brand.href}`, text: brand.label }));
  nav.appendChild(
    el('nav', { class: 'nav__links' },
      links.map((l) => el('a', { class: 'nav__link', href: `../index.html${l.href}`, text: l.label }))
    )
  );
}

function renderHero(piece) {
  const hero = el('div', { class: 'piece-page__hero' });
  if (piece.video) {
    hero.appendChild(el('video', { src: piece.video, controls: '', playsinline: '' }));
  } else if (piece.image) {
    hero.appendChild(el('img', { src: piece.image, alt: piece.title }));
  } else {
    hero.appendChild(el('span', { class: 'piece__play' }));
  }
  return hero;
}

function renderPiece(cfg, slug) {
  const piece = cfg.portfolio.pieces.find((p) => p.slug === slug);
  const root = document.getElementById('piece-root');
  if (!root) return;

  if (!piece) {
    root.appendChild(el('p', { text: 'Portfolio piece not found.' }));
    return;
  }

  document.title = `${piece.title} — ${cfg.site.brand}`;

  root.appendChild(el('a', { class: 'back-link', href: '../index.html#portfolio', text: '← back to portfolio' }));
  root.appendChild(el('h1', { class: 'piece-page__title', text: piece.title }));

  if (piece.tags && piece.tags.length) {
    root.appendChild(
      el('div', { class: 'piece-page__meta' }, piece.tags.map((t) => el('span', { class: 'tag', text: t })))
    );
  }

  root.appendChild(renderHero(piece));

  const body = el('div', { class: 'piece-page__body' });
  body.appendChild(el('p', { class: 'piece__blurb', text: piece.blurb }));
  (piece.overview || []).forEach((p) => body.appendChild(el('p', { text: p })));

  const facts = el('dl', { class: 'piece-page__facts' });
  if (piece.role) { facts.appendChild(el('dt', { text: 'Role' })); facts.appendChild(el('dd', { text: piece.role })); }
  if (piece.year) { facts.appendChild(el('dt', { text: 'Year' })); facts.appendChild(el('dd', { text: piece.year })); }
  if (facts.children.length) body.appendChild(facts);

  root.appendChild(body);
}

async function init() {
  const slug = document.body.dataset.slug;
  try {
    const cfg = await loadConfig();
    applyTheme(cfg);
    renderNav(cfg);
    renderPiece(cfg, slug);
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<p style="padding:1rem;font-family:sans-serif;color:#a00">
         Could not load config.json — serve the site over HTTP
         (e.g. <code>python3 -m http.server</code>) rather than opening the file directly.
       </p>`
    );
  }
}

document.addEventListener('DOMContentLoaded', init);
