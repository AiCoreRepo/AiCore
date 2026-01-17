import json

with open('collection2.json', 'r') as f:
    data = json.load(f)

# Show first 2 complete items
print(json.dumps(data[:2], indent=2))
