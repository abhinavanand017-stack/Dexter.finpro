import json

def generate_stocks():
    with open('nifty500_scraped.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # NIFTY 50 (Let's just take the first 50 by highest price/random as proxy, or we just take the first 50 from the file)
    # The scraped file likely has NIFTY 50 top market cap stocks first or interleaved.
    # To be realistic, we will just classify the first 50 as NIFTY 50, and the rest as BSE/NSE Top Gainers/Losers based on perChange.
    
    db_entries = []
    
    for i, stock in enumerate(data):
        sym = stock['symbol']
        price = stock['ltp']
        chg = stock['perChange']
        
        # Categorize
        if i < 50:
            category = "NIFTY 50"
        elif chg > 1.5:
            category = "Top Gainers"
        elif chg < -1.5:
            category = "Top Losers"
        else:
            category = "BSE/NSE 500"
            
        # Add to "All Stocks" implicitly because we'll just filter in JS
        db_entries.append(f"  {{ symbol: '{sym}', category: '{category}', price: {price}, change: {chg} }}")

    # Generate JS file
    js_content = "const STOCKS_DB = [\n" + ",\n".join(db_entries) + "\n];\n"
    
    with open('stocks_db.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Successfully created stocks_db.js with", len(db_entries), "stocks")

if __name__ == '__main__':
    generate_stocks()
