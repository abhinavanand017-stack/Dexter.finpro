import re
import json

# 1. Read the scratchpad
with open(r'C:\Users\Abhin\.gemini\antigravity-ide\brain\5b93669a-22c1-4327-8f2e-ae9a117411b9\browser\scratchpad_ut6o7mq7.md', 'r', encoding='utf-8') as f:
    scratch_content = f.read()

# Extract JSON
json_match = re.search(r'```json\n(.*?)\n```', scratch_content, re.DOTALL)
if not json_match:
    print("No JSON found in scratchpad")
    exit(1)

new_midcap_data = json.loads(json_match.group(1))

# Format to JS objects
formatted_midcaps = []
for item in new_midcap_data:
    name = item.get('name', '').replace("'", "\\'")
    rating = item.get('rating', 3)
    nav = item.get('nav')
    return3y = item.get('return3y')
    
    # Handle nulls gracefully
    nav_str = nav if nav is not None else 'null'
    ret_str = return3y if return3y is not None else 'null'
    
    formatted_midcaps.append(f"  {{\n    \"name\": \"{name}\",\n    \"category\": \"Mid-Cap\",\n    \"rating\": {rating},\n    \"nav\": {nav_str},\n    \"return3y\": {ret_str}\n  }}")

# 2. Read funds_db.js
with open('funds_db.js', 'r', encoding='utf-8') as f:
    funds_js = f.read()

# Extract the existing JSON array using regex
arr_match = re.search(r'const TOP_FUNDS_DB = (\[.*?\]);', funds_js, re.DOTALL)
if not arr_match:
    print("Could not find TOP_FUNDS_DB array in funds_db.js")
    exit(1)

# To safely manipulate, let's load it in python
# Because it might not be strict JSON (might have single quotes, trailing commas, missing quotes around keys)
# The file looks like valid JSON actually because in the snippet it was:
# {
#    "name": "Axis Large-Cap Fund Dir Gr", ...
# }
try:
    existing_data = json.loads(arr_match.group(1))
    # Filter out Mid-Cap
    filtered_data = [d for d in existing_data if d.get('category') != 'Mid-Cap']
    
    # Append the newly scraped Mid-Cap funds
    # new_midcap_data has valid dicts, but we need to ensure nulls are handled. 
    # Python json.dumps handles None -> null
    for item in new_midcap_data:
        filtered_data.append({
            "name": item.get('name'),
            "category": "Mid-Cap",
            "rating": item.get('rating', 3),
            "nav": item.get('nav'),
            "return3y": item.get('return3y')
        })
        
    final_js = "const TOP_FUNDS_DB = " + json.dumps(filtered_data, indent=2) + ";\n"
    
    # Replace in file
    new_funds_js = funds_js[:arr_match.start()] + final_js + funds_js[arr_match.end():]
    with open('funds_db.js', 'w', encoding='utf-8') as f:
        f.write(new_funds_js)
    print(f"Successfully injected {len(new_midcap_data)} mid-cap funds via json parsing")
    
except json.JSONDecodeError as e:
    print("funds_db.js array is not strict JSON:", e)
    # Fallback: simple text replacement to just prepend it into the array
    # If the file is not strict JSON, this is safer.
    
    # Let's find all items that are NOT mid-cap. 
    # Actually, simpler fallback is just keeping the json parsing logic since it IS strict JSON as seen from the snippet.
