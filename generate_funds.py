import json
import random

categories = [
    # Equity
    "Large-Cap", "Mid-Cap", "Small-Cap", "Large & Mid-Cap", "Multi-Cap", "Flexi-Cap",
    "Sectoral / Thematic", "Value / Contra", "ELSS",
    # Debt
    "Overnight & Liquid", "Ultra-Short & Low Duration", "Short/Medium/Long Duration",
    "Corporate Bond", "Credit Risk", "Banking & PSU", "Gilt", "Dynamic Bond",
    # Hybrid
    "Aggressive Hybrid", "Conservative Hybrid", "Balanced Hybrid",
    "Dynamic Asset Allocation", "Multi-Asset Allocation", "Arbitrage", "Equity Savings",
    # Sectors
    "Sector - Banking & Financial", "Sector - Technology", "Sector - Pharma & Healthcare",
    "Sector - Infrastructure & Power", "Sector - Energy", "Sector - FMCG"
]

amcs = ["HDFC", "ICICI Pru", "SBI", "Nippon India", "Kotak", "Axis", "DSP", "Mirae Asset", "Tata", "Aditya Birla", "UTI", "Motilal Oswal"]

db = []

def get_risk_return_profile(cat):
    # Returns (min_return, max_return, min_nav, max_nav, rating_weights)
    lower = cat.lower()
    if "small" in lower:
        return (18.0, 35.0, 20, 150, [1, 2, 4, 3])
    elif "mid" in lower:
        return (15.0, 28.0, 30, 300, [0, 2, 5, 3])
    elif "large" in lower or "flexi" in lower or "multi" in lower:
        return (12.0, 22.0, 50, 1000, [0, 1, 4, 5])
    elif "sector" in lower:
        return (10.0, 40.0, 10, 200, [1, 3, 4, 2])
    elif "debt" in lower or "liquid" in lower or "overnight" in lower or "short" in lower or "bond" in lower or "gilt" in lower:
        return (5.0, 8.5, 100, 3000, [0, 1, 6, 3])
    elif "hybrid" in lower or "arbitrage" in lower or "asset" in lower or "savings" in lower:
        return (8.0, 15.0, 20, 500, [0, 2, 5, 3])
    else:
        return (10.0, 25.0, 10, 500, [0, 2, 5, 3])

for cat in categories:
    prof = get_risk_return_profile(cat)
    # Generate 10 funds for this category
    selected_amcs = random.sample(amcs, 10)
    
    # Generate some sorted returns to simulate "Top 10"
    returns = sorted([random.uniform(prof[0], prof[1]) for _ in range(10)], reverse=True)
    
    for i in range(10):
        amc = selected_amcs[i]
        
        # Suffix
        if " - " in cat:
            suffix = cat.split(" - ")[1] + " Fund Dir Gr"
        elif "elss" in cat.lower():
            suffix = "Tax Saver Fund Dir Gr"
        else:
            suffix = cat.replace("/", "").strip() + " Fund Dir Gr"
            
        name = f"{amc} {suffix}"
        
        rating = random.choices([2, 3, 4, 5], weights=prof[4])[0]
        nav = random.uniform(prof[2], prof[3])
        ret3y = returns[i]
        
        db.append({
            "name": name,
            "category": cat,
            "rating": rating,
            "nav": round(nav, 2),
            "return3y": round(ret3y, 2)
        })

js_content = f"const TOP_FUNDS_DB = {json.dumps(db, indent=2)};"

with open("funds_db.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Successfully generated funds_db.js with", len(db), "funds.")
