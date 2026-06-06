import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

target = '<button class="nav-tab" data-tab="mutualfunds" id="tab-mutualfunds">Mutual Funds</button>'
if 'id="tab-equity"' not in html and target in html:
    html = html.replace(target, target + '\n      <button class="nav-tab" data-tab="equity" id="tab-equity">Equity Screener</button>')
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(html)
    print("Fixed index.html tab button.")

with codecs.open('styles.css', 'r', 'utf-8') as f:
    css = f.read()

if 'fadeUp' not in css:
    css += '\n@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }\n'
    with codecs.open('styles.css', 'w', 'utf-8') as f:
        f.write(css)
    print("Fixed styles.css fadeUp animation.")
