#!/usr/bin/env python3
"""
Reduces the date text font size in exportSignedPdf (was too large).
Run from ~/scp-final. Usage: python3 fix_date_font_size.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = '          ctx.font = `${Math.round(height * 0.7)}px sans-serif`;\n'
count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the date font-size line, found {count}. Aborting.")
    sys.exit(1)

replacement = '          ctx.font = `${Math.round(height * 0.4)}px sans-serif`;\n'
src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — date font size reduced (0.7x -> 0.4x of field height).")
