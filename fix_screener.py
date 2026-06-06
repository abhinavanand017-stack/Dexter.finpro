import codecs
import re

with codecs.open('screener_db.js', 'r', 'utf-8') as f:
    text = f.read()

# Replace any unescaped single quotes inside word boundaries (e.g. Divi's -> Divi\'s)
text = re.sub(r'(\w+)\'s', r'\1\\\'s', text)

with codecs.open('screener_db.js', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('app.js', 'r', 'utf-8') as f:
    js = f.read()

fun_logic = """
// ==========================================
// FUNDAMENTAL SCREENER
// ==========================================
function initFundamentalScreener() {
  const categoryList = document.getElementById('fun-category-list');
  const tbody = document.getElementById('fun-tbody');
  const title = document.getElementById('fun-table-title');
  const tabBtn = document.getElementById('tab-fundamentals');

  if (!categoryList || !tbody || typeof SCREENER_DB === 'undefined') return;

  const categories = [...new Set(SCREENER_DB.map(s => s.category))];

  categoryList.innerHTML = categories.map(cat => {
    return `<li class="fun-cat-item" data-cat="${cat}" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
      🏢 ${cat}
    </li>`;
  }).join('');

  const catItems = document.querySelectorAll('.fun-cat-item');

  function selectCategory(cat) {
    title.innerHTML = `${cat.toUpperCase()} <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">TOP COMPANIES</span>`;
    
    catItems.forEach(item => {
      item.style.background = item.getAttribute('data-cat') === cat ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
      item.style.color = item.getAttribute('data-cat') === cat ? 'var(--cyan)' : 'var(--text-secondary)';
    });

    let stocks = SCREENER_DB.filter(s => s.category === cat);
    stocks.sort((a, b) => b.mcap - a.mcap);
    stocks = stocks.slice(0, 50);

    tbody.innerHTML = stocks.map(stock => {
      return `
      <tr style="animation: fadeUp 0.3s ease-out forwards; opacity: 0;">
        <td style="font-weight: 600;">${stock.name}</td>
        <td style="font-family: var(--font-mono);">₹${stock.cmp.toFixed(2)}</td>
        <td style="color: var(--amber); font-family: var(--font-mono);">${stock.pe > 0 ? stock.pe.toFixed(1) : '-'}</td>
        <td style="font-family: var(--font-mono);">${stock.mcap.toFixed(0)}</td>
        <td style="color: ${stock.roce > 15 ? 'var(--green)' : 'var(--text)'}; font-family: var(--font-mono);">${stock.roce.toFixed(2)}%</td>
        <td style="color: ${stock.roe > 15 ? 'var(--green)' : 'var(--text)'}; font-family: var(--font-mono);">${stock.roe.toFixed(2)}%</td>
      </tr>
    `}).join('');
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.02}s`;
    });
  }

  catItems.forEach(item => {
    item.addEventListener('click', () => {
      selectCategory(item.getAttribute('data-cat'));
    });
  });

  if (categories && categories.length > 0) {
    selectCategory(categories[0]);
  }
}
"""

if 'function initFundamentalScreener' not in js:
    with codecs.open('app.js', 'a', 'utf-8') as f:
        f.write(fun_logic)
        
print("Fixed screener_db.js and app.js")
