/* ============================================================
   POLYLOG — Main JS
   Author: 9onewave.github.io
   ============================================================ */

'use strict';

// ── Config ────────────────────────────────────────────────────
const CONFIG = {
  RAWG_KEY: '2d1665f8da75443984771251b27a4b68',
  RAWG_BASE: 'https://api.rawg.io/api',
  CHEAPSHARK_BASE: 'https://www.cheapshark.com/api/1.0',
  STEAM_APP: 'https://store.steampowered.com/api/appdetails',
  IGN_RSS: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.ign.com%2Farticles%2Ffeed.rss&api_key=free&count=10',
  GAMESPOT_RSS: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.gamespot.com%2Ffeeds%2Fnews&count=10',
  YT_SEARCH: 'https://www.youtube.com/results?search_query=',
};

// ── Cache ─────────────────────────────────────────────────────
const cache = new Map();
async function cachedFetch(url, ttl = 300000) {
  const now = Date.now();
  if (cache.has(url)) {
    const { data, ts } = cache.get(url);
    if (now - ts < ttl) return data;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache.set(url, { data, ts: now });
    return data;
  } catch (e) {
    console.warn('Fetch failed:', url, e.message);
    return null;
  }
}

// ── HTML escaping (XSS prevention) — kept from modified version
function escapeHTML(str) {
  if (typeof str !== 'string') return String(str ?? '');
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── RAWG API ──────────────────────────────────────────────────
const RAWG = {
  async games(params = {}) {
    const q = new URLSearchParams({ key: CONFIG.RAWG_KEY, page_size: 20, ...params });
    return cachedFetch(`${CONFIG.RAWG_BASE}/games?${q}`);
  },
  async game(slug) {
    return cachedFetch(`${CONFIG.RAWG_BASE}/games/${slug}?key=${CONFIG.RAWG_KEY}`);
  },
  async screenshots(slug) {
    return cachedFetch(`${CONFIG.RAWG_BASE}/games/${slug}/screenshots?key=${CONFIG.RAWG_KEY}&page_size=12`);
  },
  async similar(slug) {
    return cachedFetch(`${CONFIG.RAWG_BASE}/games/${slug}/game-series?key=${CONFIG.RAWG_KEY}&page_size=6`);
  },
  async search(q, page = 1) {
    return RAWG.games({ search: q, page, ordering: '-relevance' });
  },
  async trending() {
    return RAWG.games({ ordering: '-added', dates: getLastMonthRange() });
  },
  async upcoming() {
    return RAWG.games({ ordering: 'released', dates: getUpcomingRange(), page_size: 12 });
  },
  async topRated(platform = '') {
    const params = { ordering: '-rating', metacritic: '70,100' };
    if (platform) params.platforms = platform;
    return RAWG.games(params);
  },
  async byPlatform(platformId, page = 1) {
    return RAWG.games({ platforms: platformId, ordering: '-rating', page });
  },
  async genres() {
    return cachedFetch(`${CONFIG.RAWG_BASE}/genres?key=${CONFIG.RAWG_KEY}`);
  },
};

// ── CheapShark API ────────────────────────────────────────────
const CheapShark = {
  async deals(params = {}) {
    const q = new URLSearchParams({ pageSize: 12, sortBy: 'DealRating', ...params });
    return cachedFetch(`${CONFIG.CHEAPSHARK_BASE}/deals?${q}`);
  },
  async stores() {
    return cachedFetch(`${CONFIG.CHEAPSHARK_BASE}/stores`);
  },
  async searchDeals(title) {
    return cachedFetch(`${CONFIG.CHEAPSHARK_BASE}/deals?title=${encodeURIComponent(title)}&pageSize=5`);
  },
};

// ── News (RSS) ─────────────────────────────────────────────────
const News = {
  async ign() {
    const data = await cachedFetch(CONFIG.IGN_RSS, 600000);
    return data?.items || [];
  },
  async gamespot() {
    const data = await cachedFetch(CONFIG.GAMESPOT_RSS, 600000);
    return data?.items || [];
  },
  async all() {
    const [ign, gs] = await Promise.allSettled([News.ign(), News.gamespot()]);
    const items = [
      ...(ign.value || []).map(i => ({ ...i, source: 'IGN' })),
      ...(gs.value || []).map(i => ({ ...i, source: 'GameSpot' })),
    ];
    return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  },
};

// ── Helpers ───────────────────────────────────────────────────
function getLastMonthRange() {
  const now = new Date();
  const month = new Date(now); month.setMonth(month.getMonth() - 1);
  return `${fmt(month)},${fmt(now)}`;
}
function getUpcomingRange() {
  const now = new Date();
  const future = new Date(now); future.setMonth(future.getMonth() + 6);
  return `${fmt(now)},${fmt(future)}`;
}
function fmt(d) { return d.toISOString().split('T')[0]; }

function slugify(str) {
  return str?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  return Math.ceil(diff / 86400000);
}
function getRatingColor(rating) {
  if (rating >= 4.5) return 'var(--green)';
  if (rating >= 3.5) return 'var(--yellow)';
  if (rating >= 2.5) return 'var(--orange)';
  return 'var(--red)';
}
function getRatingPct(rating, max = 5) { return (rating / max) * 100; }
function platformIcon(p) {
  const n = p?.toLowerCase() || '';
  if (n.includes('pc') || n.includes('windows')) return '🖥';
  if (n.includes('playstation') || n.includes('ps')) return '🎮';
  if (n.includes('xbox')) return '🟩';
  if (n.includes('nintendo') || n.includes('switch')) return '🔴';
  if (n.includes('ios') || n.includes('android') || n.includes('mobile')) return '📱';
  return '🕹';
}
function getNewsTag(item) {
  // FIX: original had string concat bug — item.description could be undefined
  const t = ((item.title || '') + (item.description || '')).toLowerCase();
  if (t.includes('review')) return { cls: 'news-tag-review', label: 'Review' };
  if (t.includes('guide') || t.includes('tips')) return { cls: 'news-tag-guide', label: 'Guide' };
  if (t.includes('update') || t.includes('patch')) return { cls: 'news-tag-update', label: 'Update' };
  return { cls: 'news-tag-news', label: 'News' };
}
function extractYTId(url) {
  const m = url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}
function formatPrice(p) {
  const n = parseFloat(p);
  return n === 0 ? 'Free' : `$${n.toFixed(2)}`;
}
function metaScore(game) {
  return game.metacritic || Math.round((game.rating || 0) * 20);
}

// ── Fallback images ───────────────────────────────────────────
// FIX: via.placeholder.com is often blocked — switched to placehold.co
const PLACEHOLDER = 'https://placehold.co/300x400/0D1117/4E5F73?text=No+Image';
const PLACEHOLDER_WIDE = 'https://placehold.co/600x338/0D1117/4E5F73?text=No+Image';
function imgSrc(url) { return url || PLACEHOLDER; }
function imgWideSrc(url) { return url || PLACEHOLDER_WIDE; }

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, icon = '✅') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHTML(msg)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Skeleton ──────────────────────────────────────────────────
function skeletonCards(n = 8, container) {
  if (!container) return;
  container.innerHTML = Array(n).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img" style="aspect-ratio:3/4"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-title" style="width:80%"></div>
        <div class="skeleton skeleton-title" style="width:60%"></div>
        <div class="skeleton skeleton-sub"></div>
      </div>
    </div>`).join('');
}

// ── Game Card HTML ────────────────────────────────────────────
function gameCardHTML(game) {
  const safeName = escapeHTML(game.name || '');
  const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
  const platforms = (game.platforms || []).slice(0, 4).map(p =>
    `<span class="platform-icon">${platformIcon(p.platform?.name)}</span>`).join('');
  const genres = (game.genres || []).slice(0, 2).map(g => escapeHTML(g.name)).join(', ');
  const release = game.released
    ? new Date(game.released).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : 'TBA';
  const img = imgSrc(game.background_image);
  // FIX: dynamic URL so cards work correctly from both root and /pages/
  const inPages = window.location.pathname.includes('/pages/');
  const url = inPages ? `game.html?slug=${game.slug}` : `pages/game.html?slug=${game.slug}`;
  return `
    <a class="game-card" href="${url}" title="${safeName}">
      <div class="game-card-img-wrap">
        <img class="game-card-img" src="${img}" alt="${safeName}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
        <div class="game-card-overlay">
          <span style="font-size:12px;color:var(--text-2)">${genres || 'Gaming'}</span>
        </div>
        ${game.rating ? `<div class="game-card-rating">⭐ ${rating}</div>` : ''}
      </div>
      <div class="game-card-body">
        <div class="game-card-title">${safeName}</div>
        <div class="game-card-release">📅 ${release}</div>
        <div class="game-card-platforms">${platforms}</div>
      </div>
    </a>`;
}

// ── Render game grid ──────────────────────────────────────────
function renderGames(games, container) {
  if (!container) return;
  if (!games || games.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-3)">No games found.</div>`;
    return;
  }
  container.innerHTML = games.map(gameCardHTML).join('');
  initFadeUp(container);
}

// ── Nav ───────────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
    });
  }

  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && path.includes(href.replace('../', '').replace('.html', ''))) {
      a.classList.add('active');
    }
  });
}

// ── Search ────────────────────────────────────────────────────
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results-drop');
  const openBtns = document.querySelectorAll('.open-search');
  const closeBtn = document.getElementById('search-close');

  if (!overlay) return;

  openBtns.forEach(btn => btn.addEventListener('click', () => {
    overlay.classList.add('open');
    setTimeout(() => input?.focus(), 100);
  }));

  closeBtn?.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.classList.remove('open');
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); overlay.classList.add('open'); input?.focus(); }
  });

  let debounceTimer;
  input?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { if (results) results.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => doSearch(q, results), 400);
  });

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) {
        const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
        window.location.href = `${base}search.html?q=${encodeURIComponent(q)}`;
        overlay.classList.remove('open');
      }
    }
  });
}

async function doSearch(q, container) {
  if (!container) return;
  container.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-3);font-size:13px">Searching…</div>`;
  const data = await RAWG.search(q);
  const games = data?.results || [];
  if (!games.length) {
    container.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-3);font-size:13px">No results for "${escapeHTML(q)}"</div>`;
    return;
  }
  const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
  container.innerHTML = games.slice(0, 8).map(g => `
    <a class="search-result-item" role="option" href="${base}game.html?slug=${g.slug}">
      <img class="search-result-img" src="${imgSrc(g.background_image)}" alt="${escapeHTML(g.name)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
      <div>
        <div class="search-result-name">${escapeHTML(g.name)}</div>
        <div class="search-result-meta">${escapeHTML((g.genres||[]).map(x=>x.name).join(', ')||'Game')} · ${g.released||'TBA'}</div>
      </div>
    </a>`).join('');
}

// ── Video Modal ───────────────────────────────────────────────
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  const iframe = document.getElementById('modal-iframe');
  const closeBtn = document.getElementById('modal-close');
  if (!overlay) return;

  window.openTrailer = (ytId, title) => {
    if (!ytId) { showToast('No trailer available', '⚠️'); return; }
    if (iframe) iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = title || 'Trailer';
    overlay.classList.add('open');
  };

  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => { if (iframe) iframe.src = ''; }, 400);
  };
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ── Wishlist (localStorage) ────────────────────────────────────
const Wishlist = {
  get() { try { return JSON.parse(localStorage.getItem('polylog_wishlist') || '[]'); } catch { return []; } },
  add(game) {
    const list = Wishlist.get();
    if (!list.find(g => g.slug === game.slug)) {
      // FIX: store background_image (not img) so gameCardHTML can read it
      list.push({ slug: game.slug, name: game.name, background_image: game.background_image, rating: game.rating, released: game.released });
      localStorage.setItem('polylog_wishlist', JSON.stringify(list));
      showToast(`Added "${game.name}" to wishlist`, '💙');
    } else { showToast('Already in wishlist', 'ℹ️'); }
  },
  remove(slug) {
    const list = Wishlist.get().filter(g => g.slug !== slug);
    localStorage.setItem('polylog_wishlist', JSON.stringify(list));
    showToast('Removed from wishlist', '🗑️');
  },
  has(slug) { return Wishlist.get().some(g => g.slug === slug); },
};

// ── Countdown Timer ───────────────────────────────────────────
function renderCountdown(dateStr, el) {
  if (!el || !dateStr) return;
  function update() {
    const diff = new Date(dateStr) - Date.now();
    if (diff <= 0) { el.innerHTML = `<span style="color:var(--green);font-size:12px;font-weight:700">Out Now!</span>`; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `
      <div class="countdown">
        <div class="countdown-unit"><span class="countdown-num">${String(d).padStart(2,'0')}</span><span class="countdown-label">Days</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(h).padStart(2,'0')}</span><span class="countdown-label">Hrs</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(m).padStart(2,'0')}</span><span class="countdown-label">Min</span></div>
        <div class="countdown-unit"><span class="countdown-num">${String(s).padStart(2,'0')}</span><span class="countdown-label">Sec</span></div>
      </div>`;
  }
  update();
  return setInterval(update, 1000);
}

// ── Fade-up on scroll ─────────────────────────────────────────
function initFadeUp(root = document) {
  const els = root.querySelectorAll('.fade-up');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ── Back to Top ───────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Page Loader ───────────────────────────────────────────────
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  const fill = loader.querySelector('.loader-bar-fill');
  if (fill) { fill.style.width = '100%'; }
  setTimeout(() => loader.classList.add('hidden'), 400);
}

// ── Cookie Consent — kept from modified version ───────────────
function initCookieConsent() {
  const consent = document.getElementById('cookie-consent');
  if (!consent) return;
  // FIX: use namespaced key so it doesn't clash with other sites
  if (localStorage.getItem('polylog_cookie_consent')) {
    consent.style.display = 'none';
    return;
  }
  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('polylog_cookie_consent', 'true');
    consent.style.display = 'none';
  });
}

// ── Platform IDs ──────────────────────────────────────────────
const PLATFORM_IDS = { pc: 4, playstation: 187, xbox: 1, nintendo: 7 };

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSearch();
  initModal();
  initBackToTop();
  initFadeUp();
  initCookieConsent();
  setTimeout(hideLoader, 600);
});

// ── Exports ───────────────────────────────────────────────────
// FIX: PLATFORM_IDS was dropped in modified version — restored
// FIX: escapeHTML added (new useful export)
window.POLYLOG = {
  RAWG, CheapShark, News, CONFIG,
  gameCardHTML, renderGames, skeletonCards,
  showToast, Wishlist, renderCountdown,
  initFadeUp, slugify, timeAgo, daysUntil,
  getRatingColor, getRatingPct, platformIcon,
  getNewsTag, extractYTId, formatPrice, metaScore,
  imgSrc, imgWideSrc, PLACEHOLDER, PLACEHOLDER_WIDE,
  PLATFORM_IDS,
  escapeHTML,
};
