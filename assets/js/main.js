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

  const blocks = cfg.about.blocks || [];

  const block = (item) => {
    const text = typeof item === 'string' ? item : item.text;
    const phrase = typeof item === 'object' && item.highlight;
    const p = document.createElement('p');
    if (phrase && text.includes(phrase)) {
      p.innerHTML = text.replace(phrase, `<span class="about__highlight">${phrase}</span>`);
    } else {
      p.textContent = text;
    }
    return el('div', { class: 'content-box about__block' }, [p]);
  };

  const row = el('div', { class: 'about__row' });

  row.appendChild(el('img', { class: 'about__photo', src: 'website_photo.png', alt: '' }));

  if (blocks[0]) row.appendChild(block(blocks[0]));
  row.appendChild(el('div', { class: 'about__image' }));
  if (blocks[1]) row.appendChild(block(blocks[1]));

  box.appendChild(row);
}

function thumb(piece) {
  const wrap = el('div', { class: 'piece__thumb' });
  if (piece.image) {
    wrap.appendChild(el('img', { src: piece.image, alt: piece.title, loading: 'lazy' }));
  } else if (!piece.heroLabel) {
    wrap.appendChild(el('span', { class: 'piece__play' }));
  }
  if (piece.heroLabel) {
    wrap.appendChild(el('div', { class: 'piece__hero-label', text: piece.heroLabel }));
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
        el('p', { class: 'piece__blurb', text: piece.subtitle }),
        el('span', { class: 'piece__more', text: 'learn more' })
      ]),
      thumb(piece)
    ]);
    grid.appendChild(card);
  });
}

function renderContact(cfg) {
  const box = document.getElementById('contact-content');
  if (!box) return;
  const c = cfg.contact;
  box.appendChild(el('h2', { text: c.heading }));
  box.appendChild(
    el('div', { class: 'contact__links content-box' },
      (c.links || []).map((l) => el('a', { class: 'contact__link', href: l.href, text: l.label, target: '_blank', rel: 'noopener' }))
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
    renderContact(cfg);
    renderFooter(cfg);
    // Layout is now in the DOM; let the kids simulation measure regions.
    document.dispatchEvent(new Event('ob:ready'));

    // Re-scroll to hash after rendering — dynamic content above can shift positions.
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
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
