/* ═══════════════════════════════════════════════════════════
   Les 3 Marcellinois – script.js
   - Menu hamburger (mobile)
   - Chargement menu depuis Google Sheets (CSV public)
   ═══════════════════════════════════════════════════════════ */

const SHEET_ID  = '1olFPK32a4XjKH-bhWtSa739enwR73oI4zADWm67lM20';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

/* ── Hamburger ───────────────────────────────── */

function initHamburger() {
  const toggle  = document.querySelector('.nav-toggle');
  const navList = document.querySelector('nav ul');
  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Ferme le menu au clic sur un lien */
  navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* Ferme si on redimensionne au-dessus du breakpoint */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navList.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ── Helpers CSV ─────────────────────────────── */

function clean(str) {
  return (str || '').trim().replace(/\r/g, '');
}

function findCol(headers, candidates) {
  return headers.findIndex(h =>
    candidates.some(c => h.includes(c))
  );
}

function parseCSVRow(row) {
  const result = [];
  let current  = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  return text.trim().split('\n').map(parseCSVRow);
}

/* ── Rendu menu ──────────────────────────────── */

function renderMenu(categories) {
  const container = document.getElementById('menu-container');
  if (Object.keys(categories).length === 0) {
    showPlaceholder(container);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'menu-categories';

  for (const [cat, items] of Object.entries(categories)) {
    const section = document.createElement('div');

    const title = document.createElement('h3');
    title.className = 'menu-cat-title';
    title.textContent = cat;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'menu-items';

    items.forEach(({ name, desc, price }) => {
      const card = document.createElement('div');
      card.className = 'menu-item';

      const info   = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'menu-item-name';
      nameEl.textContent = name;
      info.appendChild(nameEl);

      if (desc) {
        const descEl = document.createElement('div');
        descEl.className = 'menu-item-desc';
        descEl.textContent = desc;
        info.appendChild(descEl);
      }
      card.appendChild(info);

      if (price) {
        const priceEl = document.createElement('div');
        priceEl.className = 'menu-item-price';
        priceEl.textContent = price;
        card.appendChild(priceEl);
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);
    wrap.appendChild(section);
  }

  container.innerHTML = '';
  container.className = '';
  container.appendChild(wrap);
}

function showPlaceholder(container, msg = '') {
  container.className = '';
  container.innerHTML = `
    <div class="menu-placeholder">
      <p>La carte sera bientôt disponible</p>
      <p>${msg || "Le menu s'affichera ici dès que le Google Sheet sera partagé en accès public."}</p>
    </div>`;
}

/* ── Chargement Sheet ────────────────────────── */

async function loadMenu() {
  const container = document.getElementById('menu-container');
  container.className = 'menu-loading';
  container.textContent = 'Chargement de la carte en cours…';

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text    = await res.text();
    const rows    = parseCSV(text);
    if (rows.length < 2) throw new Error('Sheet vide');

    const headers = rows[0].map(h => clean(h).toLowerCase());
    const colCat   = findCol(headers, ['catég', 'categorie', 'category', 'cat']);
    const colName  = findCol(headers, ['nom', 'name', 'produit', 'article']);
    const colDesc  = findCol(headers, ['desc', 'description', 'detail']);
    const colPrice = findCol(headers, ['prix', 'price', 'tarif', 'montant']);

    if (colName === -1) throw new Error('Colonne "nom" introuvable');

    const categories = {};
    rows.slice(1).forEach(row => {
      const name = colName >= 0 ? clean(row[colName]) : '';
      if (!name) return;
      const cat   = colCat   >= 0 ? clean(row[colCat])   || 'La carte' : 'La carte';
      const desc  = colDesc  >= 0 ? clean(row[colDesc])  : '';
      const price = colPrice >= 0 ? clean(row[colPrice]) : '';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ name, desc, price });
    });

    renderMenu(categories);

  } catch (err) {
    console.warn('[Menu] Impossible de charger le Sheet :', err.message);
    showPlaceholder(document.getElementById('menu-container'));
  }
}

/* ── Init ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  loadMenu();
});
