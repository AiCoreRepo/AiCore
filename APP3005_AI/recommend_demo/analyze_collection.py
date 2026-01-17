import json

# Load the collection
with open('collection2.json', 'r') as f:
    data = json.load(f)

print(f"Total items in collection: {len(data)}\n")
print("=" * 60)
print("SAMPLE ITEM (First item in collection):")
print("=" * 60)

# Get first item
item = data[0]

# Print each field
for key, value in item.items():
    if isinstance(value, list):
        print(f"\n{key}: (list with {len(value)} items)")
        for i, v in enumerate(value[:3]):  # Show first 3 items
            print(f"  [{i}] {v}")
        if len(value) > 3:
            print(f"  ... and {len(value) - 3} more")
    elif isinstance(value, str) and len(value) > 100:
        print(f"\n{key}: (string, {len(value)} chars)")
        print(f"  {value[:100]}...")
    else:
        print(f"\n{key}: {value}")

print("\n" + "=" * 60)
print("ALL FIELD NAMES ACROSS ALL ITEMS:")
print("=" * 60)

# Get all unique keys
all_keys = set()
for item in data:
    all_keys.update(item.keys())

print(", ".join(sorted(all_keys)))
