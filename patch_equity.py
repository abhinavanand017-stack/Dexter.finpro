import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Add Navigation Tab
nav_tab_html = '      <button class="nav-tab" data-tab="equity" id="tab-equity">Equity Screener</button>\n'
# Find the mutual funds tab and insert after it
if '<button class="nav-tab" data-tab="mutualfunds"' in html and 'id="tab-equity"' not in html:
    html = html.replace(
        '<button class="nav-tab" data-tab="mutualfunds" id="tab-mutualfunds">Mutual Funds</button>\n',
        '<button class="nav-tab" data-tab="mutualfunds" id="tab-mutualfunds">Mutual Funds</button>\n' + nav_tab_html
    )

# 2. Add Equity Panel
equity_panel = """
    <!-- ======================== EQUITY SCREENER TAB ======================== -->
    <div class="tab-panel" id="panel-equity">
      <h2>Equity Screener: BSE / NSE Stocks</h2>
      <div style="display: flex; gap: 20px; margin-top: 15px; height: 600px;">
        
        <!-- Sidebar Tree -->
        <div class="card" style="flex: 0 0 300px; overflow-y: auto; padding: 15px; border-right: 1px solid var(--border);">
          <div class="card-label">STOCK CATEGORIES</div>
          <ul id="eq-category-list" style="list-style: none; padding-left: 0; margin-top: 10px; font-size: 14px; line-height: 2.2;">
            <!-- Populated via JS -->
          </ul>
        </div>

        <!-- Main Content Table -->
        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="card-label" id="eq-table-title" style="margin-bottom: 15px; color: var(--purple); font-size: 1.1em;">Select a Category</div>
          <div style="overflow-y: auto; flex: 1;">
            <table class="market-table" style="width: 100%;">
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>LIVE PRICE (₹)</th>
                  <th>% CHANGE</th>
                </tr>
              </thead>
              <tbody id="eq-tbody">
                <!-- Populated via JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
"""

# Insert before <!-- ======================== FORECASTING TAB ======================== -->
if 'id="panel-equity"' not in html:
    html = html.replace(
        '<!-- ======================== FORECASTING TAB ======================== -->',
        equity_panel + '    <!-- ======================== FORECASTING TAB ======================== -->'
    )

# 3. Add Script tags
if 'stocks_db.js' not in html:
    html = html.replace(
        '<script src="funds_db.js"></script>',
        '<script src="funds_db.js"></script>\n  <script src="stocks_db.js"></script>'
    )

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
    
print("Successfully patched index.html")
