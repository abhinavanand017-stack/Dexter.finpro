with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("sector: 'Nifty 500'", "idx: 'NIFTY 500'")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Replaced sector with idx successfully.')
