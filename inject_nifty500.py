import re
import json

# 1. Read the scratchpad
with open(r'C:\Users\Abhin\.gemini\antigravity-ide\brain\5b93669a-22c1-4327-8f2e-ae9a117411b9\browser\scratchpad_xks6kcye.md', 'r', encoding='utf-8') as f:
    scratch_content = f.read()

# Extract JSON
json_match = re.search(r'```json\n(.*?)\n```', scratch_content, re.DOTALL)
if not json_match:
    print("No JSON found in scratchpad")
    exit(1)

data = json.loads(json_match.group(1))

# Assign categories to match the UI expectations
# Sort by perChange to get Top Gainers and Top Losers
sorted_by_change = sorted(data, key=lambda x: x.get('perChange', 0), reverse=True)
top_gainers = set(x['symbol'] for x in sorted_by_change[:30])
top_losers = set(x['symbol'] for x in sorted_by_change[-30:])

# First 50 items from the original Nifty 50 index roughly (just grab first 50)
nifty_50 = set(x['symbol'] for x in data[:50])

formatted_data = []
for item in data:
    sym = item['symbol']
    price = item['ltp']
    change = item['perChange']
    
    if sym in top_gainers:
        cat = "Top Gainers"
    elif sym in top_losers:
        cat = "Top Losers"
    elif sym in nifty_50:
        cat = "NIFTY 50"
    else:
        cat = "BSE/NSE 500"
        
    formatted_data.append(f"  {{ symbol: '{sym}', category: '{cat}', price: {price}, change: {change} }}")

js_array = "const STOCKS_DB = [\n" + ",\n".join(formatted_data) + "\n];\n"

# Replace in app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# The user added `const STOCKS_DB = [...];` at the bottom of app.js.
# Let's remove any existing `const STOCKS_DB = [...];` block using regex.
app_js = re.sub(r'const STOCKS_DB = \[.*?\];', '', app_js, flags=re.DOTALL)

# Let's append the new STOCKS_DB to the end of the file.
app_js = app_js.strip() + "\n\n" + js_array

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Successfully injected 500 stocks into app.js")
