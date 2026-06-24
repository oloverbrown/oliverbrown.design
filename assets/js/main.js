/* ============================================================
   oliverbrown.design — landing page renderer
   Loads config.json and populates the page so all copy and
   theme variables live in one place.
   ============================================================ */

const CONFIG_URL = 'config.json';

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
  const { font } = cfg.site;
  const o = cfg.theme.outside;
  const i = cfg.theme.inside;
  if (font) r.setProperty('--font', font);
  r.setProperty('--outside-bg', o.background);
  r.setProperty('--outside-text', o.text);
  r.setProperty('--outside-muted', o.muted);
  r.setProperty('--outside-line', o.line);
  r.setProperty('--inside-bg', i.background);
  r.setProperty('--inside-text', i.text);
  r.setProperty('--inside-card', i.card);
  r.setProperty('--inside-accent', i.accent);
  document.title = cfg.site.title;
}

function renderNav(cfg, brandHref = '#intro', linkPrefix = '') {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const [brand, ...links] = cfg.nav;
  nav.appendChild(el('a', { class: 'nav__brand', href: linkPrefix + brand.href, text: brand.label }));
  nav.appendChild(
    el('nav', { class: 'nav__links' },
      links.map((l) => el('a', { class: 'nav__link', href: linkPrefix + l.href, text: l.label }))
    )
  );
}

function renderIntro(cfg) {
  const left = document.getElementById('intro-left');
  const right = document.getElementById('intro-right');
  const { leftLines = [], rightLines = [] } = cfg.intro;
  if (left) leftLines.forEach((line) => left.appendChild(el('div', { text: line })));
  if (right) rightLines.forEach((line) => right.appendChild(el('div', { text: line })));
}

function renderAbout(cfg) {
  const box = document.getElementById('about-content');
  if (!box) return;
  box.appendChild(el('h2', { text: cfg.about.heading }));
  cfg.about.paragraphs.forEach((p) => box.appendChild(el('p', { text: p })));
}

function thumb(piece) {
  const wrap = el('div', { class: 'piece__thumb' });
  if (piece.image) {
    wrap.appendChild(el('img', { src: piece.image, alt: piece.title, loading: 'lazy' }));
  } else {
    wrap.appendChild(el('span', { class: 'piece__play' }));
  }
  return wrap;
}

function renderPortfolio(cfg) {
  const heading = document.getElementById('portfolio-heading');
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;
  if (heading) heading.textContent = cfg.portfolio.heading;

  cfg.portfolio.pieces.forEach((piece) => {
    const card = el('a', { class: 'piece', href: `portfolio/${piece.slug}.html` }, [
      el('div', { class: 'piece__info' }, [
        el('h3', { class: 'piece__title', text: piece.title }),
        el('p', { class: 'piece__blurb', text: piece.blurb }),
        el('span', { class: 'piece__more', text: 'learn more' })
      ]),
      thumb(piece)
    ]);
    grid.appendChild(card);
  });
}

function renderChildren(cfg) {
  const layer = document.getElementById('children');
  if (!layer) return;
  const colors = cfg.theme.childColors || [];
  // Deterministic-ish scatter so it looks intentional, not random noise.
  const spots = [
    [4, 14], [16, 52], [9, 80], [28, 22], [34, 68], [44, 88],
    [58, 12], [66, 58], [74, 84], [86, 20], [92, 60], [50, 40]
  ];
  spots.forEach(([top, left], n) => {
    layer.appendChild(el('span', {
      class: 'child',
      style: `top:${top}%; left:${left}%; background-color:${colors[n % colors.length]};`
    }));
  });
}

function renderContact(cfg) {
  const box = document.getElementById('contact-content');
  if (!box) return;
  const c = cfg.contact;
  box.appendChild(el('h2', { text: c.heading }));
  box.appendChild(el('p', { text: c.blurb }));
  box.appendChild(el('a', { class: 'contact__email', href: `mailto:${c.email}`, text: c.email }));
  box.appendChild(
    el('div', { class: 'contact__links' },
      (c.links || []).map((l) => el('a', { href: l.href, text: l.label, target: '_blank', rel: 'noopener' }))
    )
  );
}

function renderFooter(cfg) {
  const f = document.getElementById('footer');
  if (!f) return;
  f.textContent = `© ${new Date().getFullYear()} ${cfg.site.name}`;
}

async function init() {
  try {
    const cfg = await loadConfig();
    window.__OBCONFIG__ = cfg;
    applyTheme(cfg);
    renderNav(cfg);
    renderIntro(cfg);
    renderAbout(cfg);
    renderPortfolio(cfg);
    renderChildren(cfg);
    renderContact(cfg);
    renderFooter(cfg);
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
