import urllib.request
from bs4 import BeautifulSoup
import json
import time

def scrape():
    base_url = "https://www.screener.in/screens/355742/top-500-companies/"
    companies = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    # Fetch top 10 pages (250+ companies)
    for page in range(1, 11):
        try:
            url = f"{base_url}?page={page}" if page > 1 else base_url
            req = urllib.request.Request(url, headers=headers)
            html = urllib.request.urlopen(req).read()
            soup = BeautifulSoup(html, 'html.parser')
            
            rows = soup.select('table.data-table tbody tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 14: continue
                
                try:
                    name = cols[1].text.strip()
                    cmp = float(cols[2].text.strip().replace(',', '')) if cols[2].text.strip() else 0.0
                    pe = float(cols[3].text.strip().replace(',', '')) if cols[3].text.strip() else 0.0
                    mcap = float(cols[4].text.strip().replace(',', '')) if cols[4].text.strip() else 0.0
                    roce = float(cols[10].text.strip().replace(',', '')) if cols[10].text.strip() else 0.0
                    roe3 = float(cols[12].text.strip().replace(',', '')) if cols[12].text.strip() else 0.0
                    
                    # Categorize by Market Cap
                    if mcap > 100000:
                        cat = "Mega Cap"
                    elif mcap > 30000:
                        cat = "Large Cap"
                    elif mcap > 10000:
                        cat = "Mid Cap"
                    else:
                        cat = "Small Cap"
                        
                    companies.append({
                        "name": name,
                        "cmp": cmp,
                        "pe": pe,
                        "mcap": mcap,
                        "roce": roce,
                        "roe": roe3,
                        "category": cat
                    })
                except Exception as e:
                    # Skip problematic rows
                    continue
            
            print(f"Scraped page {page}, total companies: {len(companies)}")
            time.sleep(0.5) # Prevent rate limiting
        except Exception as e:
            print(f"Failed to scrape page {page}: {e}")
            break

    # Save to JS file
    db_entries = []
    for c in companies:
        entry = f"  {{ name: '{c['name']}', category: '{c['category']}', cmp: {c['cmp']}, pe: {c['pe']}, mcap: {c['mcap']}, roce: {c['roce']}, roe: {c['roe']} }}"
        db_entries.append(entry)

    js_content = "window.SCREENER_DB = window.SCREENER_DB || [];\n"
    js_content += "window.SCREENER_DB = [\n" + ",\n".join(db_entries) + "\n];\n"

    with open('screener_db.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully saved {len(companies)} companies to screener_db.js")

if __name__ == '__main__':
    scrape()
