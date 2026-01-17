import json

with open('collection2.json', 'r') as f:
    data = json.load(f)

print(f"📊 COLLECTION2.JSON ANALYSIS")
print(f"{'='*70}\n")
print(f"Total Items: {len(data)}\n")

# Get all unique keys
all_keys = set()
for item in data:
    all_keys.update(item.keys())

print(f"Fields in collection:")
for key in sorted(all_keys):
    print(f"  • {key}")

print(f"\n{'='*70}")
print(f"SAMPLE ITEM #1:")
print(f"{'='*70}\n")
print(json.dumps(data[0], indent=2))

print(f"\n{'='*70}")
print(f"SAMPLE ITEM #2:")
print(f"{'='*70}\n")
print(json.dumps(data[1], indent=2))
