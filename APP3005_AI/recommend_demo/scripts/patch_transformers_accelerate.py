from pathlib import Path


root = Path("/usr/local/lib")
matches = list(root.rglob("transformers/integrations/accelerate.py"))
if matches:
    path = matches[0]
    text = path.read_text(encoding="utf-8")
    if "from __future__ import annotations\\n" in text:
        text = text.replace(
            "from __future__ import annotations\\n",
            "from __future__ import annotations\n",
        )
        path.write_text(text, encoding="utf-8")
        print(f"Fixed escaped newline in {path}")
    elif "from __future__ import annotations" not in text.splitlines()[:3]:
        path.write_text("from __future__ import annotations\n" + text, encoding="utf-8")
        print(f"Patched {path}")
    else:
        print(f"No patch needed for {path}")
else:
    print("transformers accelerate.py not found; skip patch")
