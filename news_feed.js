// Live Market News — Moneycontrol RSS via public CORS proxy (allorigins).
(function () {
  const FEEDS = [
    { label: 'Markets',      url: 'https://www.moneycontrol.com/rss/marketsnews.xml' },
    { label: 'Business',     url: 'https://www.moneycontrol.com/rss/business.xml' },
    { label: 'Latest',       url: 'https://www.moneycontrol.com/rss/latestnews.xml' },
    { label: 'Economy',      url: 'https://www.moneycontrol.com/rss/economy.xml' },
    { label: 'Mutual Funds', url: 'https://www.moneycontrol.com/rss/mfreports.xml' },
  ];
  let activeFeed = 0;
  let loaded = false;
  let timer = null;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function timeAgo(d) {
    const t = new Date(d); if (isNaN(t)) return '';
    const s = (Date.now() - t.getTime()) / 1000;
    if (s < 60) return Math.floor(s) + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  async function fetchFeed(url) {
    const proxies = [
      u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
      u => 'https://corsproxy.io/?' + encodeURIComponent(u),
    ];
    let lastErr;
    for (const p of proxies) {
      try {
        const r = await fetch(p(url));
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const txt = await r.text();
        const xml = new DOMParser().parseFromString(txt, 'text/xml');
        const items = [...xml.querySelectorAll('item')].slice(0, 24).map(it => ({
          title: it.querySelector('title')?.textContent || '',
          link: it.querySelector('link')?.textContent || '#',
          desc: (it.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '').slice(0, 200),
          pub: it.querySelector('pubDate')?.textContent || '',
        }));
        if (items.length) return items;
        throw new Error('Empty feed');
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All proxies failed');
  }

  async function load() {
    const list = document.getElementById('news-list');
    const updated = document.getElementById('news-updated');
    if (!list) return;
    list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-dim);">Loading live news from Moneycontrol…</div>';
    try {
      const items = await fetchFeed(FEEDS[activeFeed].url);
      list.innerHTML = items.map(it => `
        <a class="news-card" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">
          <div class="news-meta"><span class="news-pulse">●</span> LIVE · ${esc(timeAgo(it.pub))} · Moneycontrol</div>
          <h4>${esc(it.title)}</h4>
          <p>${esc(it.desc)}…</p>
        </a>`).join('');
      if (updated) updated.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour12: false });
      loaded = true;
    } catch (e) {
      list.innerHTML = `<div style="grid-column:1/-1;padding:32px;color:#ef4444;">Could not load news feed (${esc(e.message)}). Click <b>↻ Refresh</b> to try again.</div>`;
    }
  }

  ready(() => {
    const tab = document.getElementById('tab-news');
    const tabs = document.getElementById('news-tabs');
    const refresh = document.getElementById('news-refresh');
    if (!tab || !tabs) return;

    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('.news-tab-btn'); if (!b) return;
      activeFeed = +b.dataset.idx;
      tabs.querySelectorAll('.news-tab-btn').forEach(x => x.classList.toggle('active', x === b));
      load();
    });
    refresh?.addEventListener('click', load);

    tab.addEventListener('click', () => { if (!loaded) load(); });

    // Auto-refresh every 2 minutes while panel is visible
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (document.getElementById('panel-news')?.classList.contains('active')) load();
    }, 120000);
  });
})();