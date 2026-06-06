import codecs

code = """
// ==========================================
// DAILY TRACKER MODULE
// ==========================================
function initTrackerModule() {
  const STORAGE_KEY = 'dexter_daily_tracker';
  let trackerData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const addBtn = document.getElementById('tracker-add-btn');
  const snapshotBtn = document.getElementById('tracker-snapshot-btn');
  const tbody = document.getElementById('tracker-tbody');
  const tickerInput = document.getElementById('tracker-ticker');
  const typeSelect = document.getElementById('tracker-type');

  if (!addBtn || !snapshotBtn || !tbody) return;

  function renderTracker() {
    tbody.innerHTML = '';
    trackerData.forEach((asset, index) => {
      const history = asset.history || [];
      const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
      const prevPrice = history.length > 1 ? history[history.length - 2].price : currentPrice;
      const change = currentPrice - prevPrice;
      const pctChange = currentPrice > 0 ? (change / prevPrice) * 100 : 0;
      
      const tr = document.createElement('tr');
      
      const minP = Math.min(...history.map(h => h.price), currentPrice * 0.9);
      const maxP = Math.max(...history.map(h => h.price), currentPrice * 1.1);
      const range = maxP - minP || 1;
      const stepX = 100 / Math.max(1, history.length - 1);
      
      let pathD = history.map((h, i) => {
        const x = i * stepX;
        const y = 30 - ((h.price - minP) / range) * 30;
        return (i === 0 ? 'M' : 'L') + x + ',' + y;
      }).join(' ');
      
      const sparklineColor = change >= 0 ? '#00D4FF' : '#FF6B35';

      tr.innerHTML = `
        <td style="font-weight: 600;">${asset.ticker}</td>
        <td style="color: var(--text-secondary); font-size: 11px;">${asset.type}</td>
        <td style="font-family: var(--font-mono);">₹${currentPrice.toFixed(2)}</td>
        <td class="${change >= 0 ? 'positive' : 'negative'}" style="font-family: var(--font-mono);">
          ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pctChange.toFixed(2)}%)
        </td>
        <td style="width: 100px; padding: 4px;">
          <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="${pathD}" fill="none" stroke="${sparklineColor}" stroke-width="2" vector-effect="non-scaling-stroke" />
          </svg>
        </td>
        <td>
          <button class="delete-asset-btn" data-idx="${index}" style="background: transparent; border: none; color: #ff4a4a; cursor: pointer; font-size: 14px;">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.delete-asset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        trackerData.splice(idx, 1);
        saveData();
        renderTracker();
      });
    });
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
  }

  addBtn.addEventListener('click', () => {
    const ticker = tickerInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    if (!ticker) return;

    if (trackerData.some(a => a.ticker === ticker)) {
      alert(ticker + ' is already being tracked.');
      return;
    }

    const initialPrice = type === 'MF' ? (Math.random() * 100 + 50) : (Math.random() * 2000 + 100);

    trackerData.push({
      ticker,
      type,
      history: [
        { date: new Date().toISOString(), price: initialPrice }
      ]
    });

    tickerInput.value = '';
    saveData();
    renderTracker();
  });

  snapshotBtn.addEventListener('click', async () => {
    trackerData.forEach(asset => {
      const history = asset.history;
      const lastPrice = history.length > 0 ? history[history.length - 1].price : 100;
      const drift = asset.type === 'MF' ? 0.0005 : 0.001; 
      const volatility = asset.type === 'MF' ? 0.01 : 0.02; 
      
      const randomReturn = (Math.random() - 0.5) * volatility + drift;
      const newPrice = lastPrice * (1 + randomReturn);
      
      history.push({
        date: new Date().toISOString(),
        price: newPrice
      });
      
      if (history.length > 30) {
        asset.history = history.slice(-30);
      }
    });

    saveData();
    renderTracker();
    
    snapshotBtn.style.backgroundColor = '#00D4FF';
    setTimeout(() => { snapshotBtn.style.backgroundColor = 'var(--amber)'; }, 300);
  });

  document.getElementById('tab-tracker')?.addEventListener('click', () => {
    renderTracker();
  });
}
"""

with codecs.open('app.js', 'a', 'utf-8') as f:
    f.write(code)
print('Tracker logic appended to app.js')
