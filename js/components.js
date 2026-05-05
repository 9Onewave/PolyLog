/* ============================================================
   POLYLOG — Shared Components (nav, footer, modal, toast, loader)
   ============================================================ */

(function () {
  const isRoot = !window.location.pathname.includes('/pages/');
  const base = isRoot ? '' : '../';

  // ── Inject shared HTML ──────────────────────────────────────
  function inject() {
    document.body.insertAdjacentHTML('afterbegin', loader());
    document.body.insertAdjacentHTML('afterbegin', nav(base));
    document.body.insertAdjacentHTML('afterbegin', mobileNav(base));
    document.body.insertAdjacentHTML('beforeend', footer(base));
    document.body.insertAdjacentHTML('beforeend', modalHTML());
    document.body.insertAdjacentHTML('beforeend', searchOverlay());
    document.body.insertAdjacentHTML('beforeend', toastContainer());
    document.body.insertAdjacentHTML('beforeend', backToTop());
  }

  function loader() {
    return `<div id="page-loader">
      <div class="loader-logo">Poly<span style="color:var(--accent)">Log</span></div>
      <div class="loader-bar"><div class="loader-bar-fill"></div></div>
    </div>`;
  }

  function nav(b) {
    return `<nav id="nav">
      <div class="container nav-inner">
        <a href="${b}index.html" class="nav-logo">Poly<span class="nav-logo-dot">Log</span></a>
        <div class="nav-links">
          <a href="${b}index.html" class="nav-link">Home</a>
          <a href="${b}pages/games.html" class="nav-link">Games</a>
          <a href="${b}pages/upcoming.html" class="nav-link">Upcoming</a>
          <a href="${b}pages/news.html" class="nav-link">News</a>
          <a href="${b}pages/deals.html" class="nav-link">Deals</a>
          <a href="${b}pages/platforms.html" class="nav-link">Platforms</a>
        </div>
        <div class="nav-platform-pills">
          <a href="${b}pages/platform.html?p=pc" class="platform-pill">🖥 PC</a>
          <a href="${b}pages/platform.html?p=playstation" class="platform-pill">🎮 PS</a>
          <a href="${b}pages/platform.html?p=xbox" class="platform-pill">🟩 Xbox</a>
          <a href="${b}pages/platform.html?p=nintendo" class="platform-pill">🔴 Switch</a>
        </div>
        <div class="nav-right">
          <button class="nav-search-btn open-search" aria-label="Search" title="Search (Ctrl+K)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <a href="${b}pages/profile.html" class="nav-search-btn" title="Profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>`;
  }

  function mobileNav(b) {
    return `<div id="mobile-nav">
      <a href="${b}index.html" class="mobile-nav-link">🏠 Home</a>
      <a href="${b}pages/games.html" class="mobile-nav-link">🎮 Games</a>
      <a href="${b}pages/upcoming.html" class="mobile-nav-link">📅 Upcoming</a>
      <a href="${b}pages/news.html" class="mobile-nav-link">📰 News</a>
      <a href="${b}pages/deals.html" class="mobile-nav-link">💰 Deals</a>
      <a href="${b}pages/platforms.html" class="mobile-nav-link">🕹 Platforms</a>
      <a href="${b}pages/profile.html" class="mobile-nav-link">👤 Profile</a>
    </div>`;
  }

  function footer(b) {
    const year = new Date().getFullYear();
    return `<footer id="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="${b}index.html" class="nav-logo" style="margin-bottom:12px;display:inline-flex">Poly<span class="nav-logo-dot">Log</span></a>
            <p>Your all-in-one gaming hub. Discover, track, and explore the best video games across all platforms.</p>
            <p style="margin-top:8px;font-size:12px">Created by <a href="https://9onewave.github.io" target="_blank" rel="noopener" style="color:var(--accent)">9onewave</a></p>
          </div>
          <div class="footer-links-grid">
            <div>
              <div class="footer-links-title">Explore</div>
              <a href="${b}pages/games.html" class="footer-link">All Games</a>
              <a href="${b}pages/upcoming.html" class="footer-link">Upcoming</a>
              <a href="${b}pages/deals.html" class="footer-link">Deals</a>
              <a href="${b}pages/news.html" class="footer-link">News</a>
            </div>
            <div>
              <div class="footer-links-title">Platforms</div>
              <a href="${b}pages/platform.html?p=pc" class="footer-link">PC</a>
              <a href="${b}pages/platform.html?p=playstation" class="footer-link">PlayStation</a>
              <a href="${b}pages/platform.html?p=xbox" class="footer-link">Xbox</a>
              <a href="${b}pages/platform.html?p=nintendo" class="footer-link">Nintendo</a>
            </div>
            <div>
              <div class="footer-links-title">About</div>
              <a href="${b}pages/about.html" class="footer-link">About PolyLog</a>
              <a href="https://9onewave.github.io" target="_blank" rel="noopener" class="footer-link">Creator</a>
              <a href="${b}pages/profile.html" class="footer-link">My Profile</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${year} PolyLog · Built by <a href="https://9onewave.github.io" target="_blank" rel="noopener" style="color:var(--accent)">9onewave</a> · Powered by RAWG, CheapShark & RSS feeds</span>
          <div class="footer-social">
            <a href="https://9onewave.github.io" target="_blank" rel="noopener" class="social-link" title="Creator">🌐</a>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function modalHTML() {
    return `<div id="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">Trailer</div>
          <button class="modal-close" id="modal-close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-video-wrap">
          <iframe id="modal-iframe" allowfullscreen allow="autoplay; encrypted-media" title="Game Trailer"></iframe>
        </div>
      </div>
    </div>`;
  }

  function searchOverlay() {
    return `<div id="search-overlay" role="dialog" aria-label="Search">
      <button class="search-close-btn" id="search-close" aria-label="Close search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="search-bar-wrap">
        <input class="search-bar" id="search-input" type="search" placeholder="Search games… (Ctrl+K)" autocomplete="off" spellcheck="false">
        <div class="search-bar-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div class="search-results-drop" id="search-results-drop"></div>
      </div>
      <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-3)">Press <kbd style="background:var(--surface);border:1px solid var(--border);padding:2px 6px;border-radius:4px;font-size:11px">Enter</kbd> to see full results</p>
    </div>`;
  }

  function toastContainer() { return `<div id="toast-container"></div>`; }
  function backToTop() {
    return `<button id="back-to-top" aria-label="Back to top" title="Back to top">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
    </button>`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
