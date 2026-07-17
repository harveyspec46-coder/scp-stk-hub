#!/usr/bin/env python3
"""
Switches pdfjs-dist imports to the "legacy" build, which is maintained by
Mozilla specifically for older browsers/build targets — avoids top-level
await and newer Promise methods (Promise.try, Promise.withResolvers) that
broke both the Vite build and the runtime worker on older Chromium.
Run from ~/scp-final. Usage: python3 fix_pdfjs_legacy_build.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

old_imports = (
    'import * as pdfjsLib from "pdfjs-dist";\n'
    'import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";\n'
)

count = src.count(old_imports)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the pdfjsLib imports, found {count}. Aborting.")
    sys.exit(1)

new_imports = (
    'import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";\n'
    'import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";\n'
)

src = src.replace(old_imports, new_imports, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — switched to pdfjs-dist legacy build imports.")
print("Next: npm uninstall pdfjs-dist && npm install pdfjs-dist@latest && npm run build")
