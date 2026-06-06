import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    js = f.read()

# 1. Update initTopFundsExplorer to auto-load globally (without click)
if 'selectCategory(categories[0]);' not in js:
    js = js.replace(
        '  // Init on tab open\n  if (tabBtn) {\n    tabBtn.addEventListener(\'click\', () => {\n      // Default to first category if empty\n      if (tbody.innerHTML.trim() === \'\' || tbody.innerHTML.includes(\'Populated\')) {\n        selectCategory(categories[0]);\n      }\n    });\n  }',
        '  // Init on tab open\n  if (tabBtn) {\n    tabBtn.addEventListener(\'click\', () => {\n      if (tbody.innerHTML.trim() === \'\' || tbody.innerHTML.includes(\'Populated\')) {\n        selectCategory(categories[0]);\n      }\n    });\n  }\n  \n  // Auto-load first category immediately so it is seen\n  if (categories.length > 0) {\n    selectCategory(categories[0]);\n  }'
    )

# 2. Add initEquityScreener
equity_logic = """
// ==========================================
// EQUITY SCREENER
// ==========================================
function initEquityScreener() {
  const categoryList = document.getElementById('eq-category-list');
  const tbody = document.getElementById('eq-tbody');
  const title = document.getElementById('eq-table-title');
  const tabBtn = document.getElementById('tab-equity');

  if (!categoryList || !tbody || typeof STOCKS_DB === 'undefined') return;

  // Extract unique categories from DB
  const categories = [...new Set(STOCKS_DB.map(s => s.category))];

  // Render Sidebar
  categoryList.innerHTML = categories.map(cat => {
    let icon = '📈';
    if (cat === 'NIFTY 50') icon = '🏛️';
    if (cat === 'Top Gainers') icon = '🚀';
    if (cat === 'Top Losers') icon = '🩸';
    return `<li class="eq-cat-item" data-cat="${cat}" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
      ${icon} ${cat}
    </li>`;
  }).join('');

  const catItems = document.querySelectorAll('.eq-cat-item');

  function selectCategory(cat) {
    // Update Title
    title.innerHTML = `${cat.toUpperCase()} <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">TOP STOCKS</span>`;
    
    // Highlight sidebar
    catItems.forEach(item => {
      item.style.background = item.getAttribute('data-cat') === cat ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
      item.style.color = item.getAttribute('data-cat') === cat ? 'var(--cyan)' : 'var(--text-secondary)';
    });

    // Render Table
    let stocks = STOCKS_DB.filter(s => s.category === cat);
    if (cat === 'Top Gainers') {
        stocks.sort((a, b) => b.change - a.change);
    } else if (cat === 'Top Losers') {
        stocks.sort((a, b) => a.change - b.change);
    }
    
    // Limit to top 50 for performance if large
    stocks = stocks.slice(0, 50);

    tbody.innerHTML = stocks.map(stock => {
      const color = stock.change >= 0 ? 'var(--green)' : 'var(--red)';
      const sign = stock.change >= 0 ? '+' : '';
      return `
      <tr style="animation: fadeUp 0.3s ease-out forwards; opacity: 0;">
        <td style="font-weight: 600;">${stock.symbol}</td>
        <td style="font-family: var(--font-mono);">₹${stock.price.toFixed(2)}</td>
        <td style="color: ${color}; font-family: var(--font-mono); font-weight: bold;">${sign}${stock.change.toFixed(2)}%</td>
      </tr>
    `}).join('');
    
    // Stagger animation
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.02}s`;
    });
  }

  // Click listeners
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      selectCategory(item.getAttribute('data-cat'));
    });
  });

  // Auto-load first category immediately
  if (categories.length > 0) {
    selectCategory(categories[0]);
  }
}
"""

if 'initEquityScreener' not in js:
    js += '\n' + equity_logic

# 3. Add to boot() if not there
if 'initEquityScreener();' not in js:
    js = js.replace('  initTopFundsExplorer();', '  initTopFundsExplorer();\n  initEquityScreener();')

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(js)
    
print("Successfully patched app.js")
