import codecs

# 1. Update index.html
with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

nav_tab_html = '      <button class="nav-tab" data-tab="fundamentals" id="tab-fundamentals">Fundamental Screener</button>\n'
target_nav = '<button class="nav-tab" data-tab="equity" id="tab-equity">Equity Screener</button>'
if 'id="tab-fundamentals"' not in html and target_nav in html:
    html = html.replace(target_nav, target_nav + '\n' + nav_tab_html)

fundamentals_panel = """
    <!-- ======================== FUNDAMENTALS TAB ======================== -->
    <div class="tab-panel" id="panel-fundamentals">
      <h2>Screener.in Fundamentals (Top 500)</h2>
      <div style="display: flex; gap: 20px; margin-top: 15px; height: 600px;">
        
        <!-- Sidebar Tree -->
        <div class="card" style="flex: 0 0 300px; overflow-y: auto; padding: 15px; border-right: 1px solid var(--border);">
          <div class="card-label">MARKET CAP</div>
          <ul id="fun-category-list" style="list-style: none; padding-left: 0; margin-top: 10px; font-size: 14px; line-height: 2.2;">
            <!-- Populated via JS -->
          </ul>
        </div>

        <!-- Main Content Table -->
        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="card-label" id="fun-table-title" style="margin-bottom: 15px; color: var(--purple); font-size: 1.1em;">Select a Category</div>
          <div style="overflow-y: auto; flex: 1;">
            <table class="market-table" style="width: 100%;">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>PRICE (₹)</th>
                  <th>P/E</th>
                  <th>MCAP (Cr)</th>
                  <th>ROCE (%)</th>
                  <th>ROE (%)</th>
                </tr>
              </thead>
              <tbody id="fun-tbody">
                <!-- Populated via JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
"""

target_panel = '<!-- ======================== FORECASTING TAB ======================== -->'
if 'id="panel-fundamentals"' not in html and target_panel in html:
    html = html.replace(target_panel, fundamentals_panel + '\n    ' + target_panel)

if 'screener_db.js' not in html:
    html = html.replace('<script src="stocks_db.js"></script>', '<script src="stocks_db.js"></script>\n  <script src="screener_db.js"></script>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
    
print("Patched index.html")

# 2. Update app.js
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

if 'initFundamentalScreener();' not in js:
    js = js.replace('  initEquityScreener();', '  initEquityScreener();\n  initFundamentalScreener();')

if 'initFundamentalScreener()' not in js:
    js += '\n' + fun_logic

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(js)

print("Patched app.js")

# 3. Update CSS Responsive
with codecs.open('styles.css', 'r', 'utf-8') as f:
    css = f.read()

if '#panel-fundamentals' not in css:
    css = css.replace(
        '#panel-equity > div {',
        '#panel-equity > div, #panel-fundamentals > div {'
    ).replace(
        '#panel-equity .card:first-child {',
        '#panel-equity .card:first-child, #panel-fundamentals .card:first-child {'
    )
    with codecs.open('styles.css', 'w', 'utf-8') as f:
        f.write(css)
    print("Patched styles.css")
