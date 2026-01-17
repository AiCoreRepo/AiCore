import json
import sys

# Set UTF-8 encoding for output
sys.stdout.reconfigure(encoding='utf-8')

with open('collection2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("COLLECTION2.JSON ANALYSIS")
print("="*70)
print(f"\nTotal Items: {len(data)}\n")

# Get all unique keys
all_keys = set()
for item in data:
    all_keys.update(item.keys())

print("Fields in collection:")
for key in sorted(all_keys):
    print(f"  - {key}")

print("\n" + "="*70)
print("SAMPLE ITEM #1:")
print("="*70 + "\n")
print(json.dumps(data[0], indent=2, ensure_ascii=False))

print("\n" + "="*70)
print("SAMPLE ITEM #2:")
print("="*70 + "\n")
print(json.dumps(data[1], indent=2, ensure_ascii=False))

# Show field types and sample values
print("\n" + "="*70)
print("FIELD ANALYSIS:")
print("="*70 + "\n")

for key in sorted(all_keys):
    values = [item.get(key) for item in data[:5] if key in item]
    if values:
        val_type = type(values[0]).__name__
        if isinstance(values[0], list):
            print(f"{key}: {val_type}")
            print(f"  Sample: {values[0]}")
        elif isinstance(values[0], str) and len(values[0]) > 80:
            print(f"{key}: {val_type} (long text)")
            print(f"  Sample: {values[0][:80]}...")
        else:
            print(f"{key}: {val_type}")
            print(f"  Sample: {values[0]}")
        print()
