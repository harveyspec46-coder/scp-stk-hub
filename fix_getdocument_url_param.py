#!/usr/bin/env python3
"""
Fixes "getDocument - expected either data, range, or url parameter" by
passing an explicit { url: ... } object instead of a bare string — the
more robust, version-safe form of the pdf.js API.
Run from ~/scp-final. Usage: python3 fix_getdocument_url_param.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = 'const pdf = await pdfjsLib.getDocument(doc.source_file_url).promise;'
count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the getDocument(doc.source_file_url) call, found {count}. Aborting.")
    sys.exit(1)

replacement = 'const pdf = await pdfjsLib.getDocument({ url: doc.source_file_url }).promise;'
src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — getDocument now called with an explicit { url: ... } object.")
print("Next: npm run build")
