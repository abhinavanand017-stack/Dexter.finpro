import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

# Replace script tag
if '<script src="funds_db.js"></script>' not in text:
    text = text.replace('<script src="app.js"></script>', '<script src="funds_db.js"></script>\n  <script src="app.js"></script>')

new_ui = '''<div class="tab-panel" id="panel-mutualfunds">
      <h2>Top 10 Mutual Funds Screener</h2>
      <div style="display: flex; gap: 20px; margin-top: 15px; height: 600px;">
        
        <!-- Sidebar Tree -->
        <div class="card" style="flex: 0 0 300px; overflow-y: auto; padding: 15px; border-right: 1px solid var(--border);">
          <div class="card-label">CATEGORIES</div>
          <ul id="mf-category-list" style="list-style: none; padding-left: 0; margin-top: 10px; font-size: 14px; line-height: 2.2;">
            <!-- Populated via JS -->
          </ul>
        </div>

        <!-- Main Content Table -->
        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="card-label" id="mf-table-title" style="margin-bottom: 15px; color: var(--purple); font-size: 1.1em;">Select a Category</div>
          <div style="overflow-y: auto; flex: 1;">
            <table class="market-table" style="width: 100%;">
              <thead>
                <tr>
                  <th>FUND NAME</th>
                  <th>RATING</th>
                  <th>NAV (₹)</th>
                  <th>3Y RETURN</th>
                </tr>
              </thead>
              <tbody id="mf-tbody">
                <!-- Populated via JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>'''

start_marker = '<div class="tab-panel" id="panel-mutualfunds">'
end_marker = '<div class="tab-panel" id="panel-forecasting">'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_ui + '\n\n    <!-- ======================== FORECASTING TAB ======================== -->\n    ' + text[end_idx:]
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(text)
    print('index.html updated successfully.')
else:
    print('Could not find markers in index.html')
