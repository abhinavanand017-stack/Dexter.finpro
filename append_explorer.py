import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

# First, remove the old renderMutualFunds logic and MUTUAL_FUNDS_DB
# We know it was around line 2734 or similar. It's safer to just split by '// MUTUAL FUNDS TRACKING' and '// STOCHASTIC FORECASTING'
start_idx = text.find('// ==========================================\n// MUTUAL FUNDS TRACKING')
end_idx = text.find('// ==========================================\n// STOCHASTIC FORECASTING')

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]

# Also replace the old boot call if it's there
# Actually, the old boot call just added an event listener: document.getElementById('tab-mutualfunds')?.addEventListener('click', () => { renderMutualFunds(); });
# We'll just replace renderMutualFunds() inside boot or wherever.

# Append new module
new_js = """
// ==========================================
// TOP 10 MUTUAL FUNDS EXPLORER
// ==========================================
function initTopFundsExplorer() {
  const categoryList = document.getElementById('mf-category-list');
  const tbody = document.getElementById('mf-tbody');
  const title = document.getElementById('mf-table-title');
  const tabBtn = document.getElementById('tab-mutualfunds');

  if (!categoryList || !tbody || typeof TOP_FUNDS_DB === 'undefined') return;

  // Extract unique categories from DB
  const categories = [...new Set(TOP_FUNDS_DB.map(f => f.category))];

  // Render Sidebar
  categoryList.innerHTML = categories.map(cat => {
    return `<li class="mf-cat-item" data-cat="${cat}" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
      ${cat.startsWith('Sector') ? '🔬 ' + cat : '📈 ' + cat}
    </li>`;
  }).join('');

  const catItems = document.querySelectorAll('.mf-cat-item');

  function selectCategory(cat) {
    // Update Title
    title.innerHTML = `${cat.toUpperCase()} <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">TOP 10 FUNDS</span>`;
    
    // Highlight sidebar
    catItems.forEach(item => {
      item.style.background = item.getAttribute('data-cat') === cat ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
      item.style.color = item.getAttribute('data-cat') === cat ? 'var(--cyan)' : 'var(--text-secondary)';
    });

    // Render Table
    const funds = TOP_FUNDS_DB.filter(f => f.category === cat)
      .sort((a, b) => b.return3y - a.return3y) // Sort by return descending
      .slice(0, 10); // Take Top 10

    tbody.innerHTML = funds.map(mf => `
      <tr style="animation: fadeUp 0.3s ease-out forwards; opacity: 0;">
        <td style="font-weight: 600;">${mf.name}</td>
        <td style="color: var(--amber); letter-spacing: 2px;">${'★'.repeat(mf.rating)}</td>
        <td style="font-family: var(--font-mono);">₹${mf.nav.toFixed(2)}</td>
        <td class="positive" style="font-family: var(--font-mono); font-weight: bold;">+${mf.return3y.toFixed(2)}%</td>
      </tr>
    `).join('');
    
    // Stagger animation
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.03}s`;
    });
  }

  // Click listeners
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      selectCategory(item.getAttribute('data-cat'));
    });
  });

  // Init on tab open
  if (tabBtn) {
    tabBtn.addEventListener('click', () => {
      // Default to first category if empty
      if (tbody.innerHTML.trim() === '' || tbody.innerHTML.includes('Populated')) {
        selectCategory(categories[0]);
      }
    });
  }
}

// Call init at bottom
document.addEventListener('DOMContentLoaded', () => {
  initTopFundsExplorer();
});
"""

text = text + new_js

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print('app.js updated with Top Funds Explorer logic.')
