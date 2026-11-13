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
  // Black bar as its own layer (below the kids); nav text stays on top.
  document.body.appendChild(el('div', { class: 'nav__bg' }));
  const [brand, ...links] = cfg.nav;
  const centerLinks = links.slice(0, 3);
  const rightLinks = links.slice(3);
  nav.appendChild(el('a', { class: 'nav__brand', href: linkPrefix + brand.href, text: brand.label }));
  nav.appendChild(
    el('nav', { class: 'nav__links nav__links--center' },
      centerLinks.map((l) => el('a', { class: 'nav__link', href: linkPrefix + l.href, text: l.label, ...(l.target && { target: l.target, rel: 'noopener' }) }))
    )
  );
  nav.appendChild(
    el('nav', { class: 'nav__links' },
      rightLinks.map((l) => el('a', { class: 'nav__link', href: linkPrefix + l.href, text: l.label, ...(l.target && { target: l.target, rel: 'noopener' }) }))
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
  const headlineWrap = document.getElementById('about-headline-wrap');
  if (cfg.about.headline && headlineWrap) {
    headlineWrap.appendChild(el('h1', { class: 'about__headline', text: cfg.about.headline }));
  }

  const wrap = el('div', { class: 'content-box about__box' });

  const pillars = cfg.about.pillars || [];
  if (pillars.length) {
    wrap.appendChild(el('div', { class: 'about__label', text: 'Design Pillars' }));

    let open = false;
    const pillarsEl = el('div', { class: 'about__pillars' });

    const pillarEls = pillars.map((p) => {
      const descEl = el('div', { class: 'about__pillar-desc' }, [
        el('p', { text: p.description || '' }),
      ]);
      const pillarEl = el('div', {
        class: 'about__pillar',
        style: `--pillar-color: ${p.color}`,
        tabindex: '0',
        role: 'button',
      }, [
        el('div', { class: 'about__pillar__shape' }, [
          el('span', {}, [
            p.prefix ? el('span', { class: 'about__pillar-prefix', text: `${p.prefix} ` }) : null,
            p.text,
          ]),
        ]),
        el('div', { class: 'about__pillar__caret' }, ['›']),
        descEl,
      ]);
      return pillarEl;
    });

    const toggle = () => {
      open = !open;
      pillarsEl.classList.toggle('about__pillars--open', open);
    };

    pillarEls.forEach(pe => {
      pe.addEventListener('click', toggle);
      pe.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      pillarsEl.appendChild(pe);
    });

    wrap.appendChild(pillarsEl);
  }

  wrap.appendChild(el('div', { class: 'about__label about__label--bio', text: 'Bio' }));

  const blocks = cfg.about.blocks || [];

  const darkenAndSaturate = (hex, lightenAmount = 0.15, saturateAmount = 0.1) => {
    const n = parseInt(hex.slice(1), 16);
    const r0 = ((n >> 16) & 255) / 255;
    const g0 = ((n >> 8) & 255) / 255;
    const b0 = (n & 255) / 255;
    const max = Math.max(r0, g0, b0);
    const min = Math.min(r0, g0, b0);
    let h, s;
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) {
      h = s = 0;
    } else {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r0) h = ((g0 - b0) / d) % 6;
      else if (max === g0) h = (b0 - r0) / d + 2;
      else h = (r0 - g0) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    s = Math.min(1, s * (1 + saturateAmount));
    const newL = l * (1 - lightenAmount);
    const c = (1 - Math.abs(2 * newL - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = newL - c / 2;
    let r1, g1, b1;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };
  const childColors = ((cfg.theme && cfg.theme.childColors) || []).filter((_, i) => i !== 1).map((c) => darkenAndSaturate(c));
  let highlightColorIdx = 0;
  const colorizeWords = (phrase) => phrase.split(/(\s+)/).map((token) => {
    if (!childColors.length || /^\s*$/.test(token)) return token;
    const color = childColors[highlightColorIdx % childColors.length];
    highlightColorIdx++;
    return `<span style="color: ${color}">${token}</span>`;
  }).join('');

  const block = (item) => {
    const text = typeof item === 'string' ? item : item.text;
    const phrases = typeof item === 'object' && item.highlight
      ? (Array.isArray(item.highlight) ? item.highlight : [item.highlight])
      : [];
    const p = document.createElement('p');
    if (phrases.length) {
      let html = text;
      for (const phrase of phrases) {
        if (html.includes(phrase)) {
          html = html.replace(phrase, `<span class="about__highlight">${colorizeWords(phrase)}</span>`);
        }
      }
      p.innerHTML = html;
    } else {
      p.textContent = text;
    }
    return el('div', { class: 'about__block' }, [p]);
  };

  const row = el('div', { class: 'about__row' });

  const resumeHref = (cfg.nav || []).find((n) => n.label === 'resume')?.href || 'Oliver Brown Resume.pdf';
  row.appendChild(el('div', { class: 'about__photo-col' }, [
    el('img', { class: 'about__photo', src: 'website_photo.png', alt: '' }),
    el('a', { class: 'about__resume-btn', href: resumeHref, target: '_blank', rel: 'noopener', text: 'my resume' }),
  ]));

  if (blocks[0]) row.appendChild(block(blocks[0]));
  row.appendChild(el('div', { class: 'about__image' }));
  if (blocks[1]) row.appendChild(block(blocks[1]));

  wrap.appendChild(row);

  const skills = cfg.about.skills || [];
  if (skills.length) {
    const colors = (cfg.theme && cfg.theme.childColors) || [];
    wrap.appendChild(el('div', { class: 'about__label about__label--skills', text: 'Skills / Services' }));
    wrap.appendChild(el('div', { class: 'about__skills' },
      skills.map((s, i) => el('div', { class: 'about__skill', style: `--skill-color: ${colors[i % colors.length]}` }, [
        el('span', { text: s }),
      ]))
    ));
  }

  box.appendChild(wrap);
}

function thumb(piece) {
  const wrap = el('div', { class: 'piece__thumb' });
  if (piece.image) {
    wrap.appendChild(el('img', { src: piece.image, alt: piece.title, loading: 'lazy' }));
  } else if (!piece.heroLabel) {
    wrap.appendChild(el('span', { class: 'piece__play' }));
  }
  if (piece.heroLabel && !piece.image) {
    wrap.appendChild(el('div', { class: 'piece__hero-label', text: piece.heroLabel }));
  }
  return wrap;
}

function renderPortfolio(cfg) {
  const root = document.getElementById('portfolio-root');
  if (!root) return;

  const groups = [];
  cfg.portfolio.pieces.forEach((piece) => {
    const cat = piece.category || null;
    if (!groups.length || groups[groups.length - 1].category !== cat) {
      groups.push({ category: cat, pieces: [] });
    }
    groups[groups.length - 1].pieces.push(piece);
  });

  groups.forEach((group, i) => {
    const headingText = (i === 0 ? cfg.portfolio.heading : group.category) || '';
    const id = headingText.replace(/\s+/g, '-');
    const section = el('div', { class: 'portfolio__section', id });
    section.appendChild(el('h2', { class: 'section__heading', text: headingText }));
    const grid = el('div', { class: 'portfolio__grid' });
    group.pieces.forEach((piece) => {
      const card = el('a', { class: 'piece', href: `portfolio/${piece.slug}.html` }, [
        el('div', { class: 'piece__info' }, [
          el('h3', { class: 'piece__title', text: piece.title }),
          ...(piece.details ? [el('p', { class: 'piece__details', text: piece.details })] : []),
          el('p', { class: 'piece__blurb', text: piece.subtitle }),
          el('span', { class: 'piece__more', text: 'learn more' })
        ]),
        thumb(piece)
      ]);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    root.appendChild(section);
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
