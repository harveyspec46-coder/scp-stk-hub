#!/usr/bin/env python3
"""
Adds a console.log of doc.source_file_url right when SignerFillScreen mounts,
to see exactly what value (if any) is actually being received.
Run from ~/scp-final. Usage: python3 debug_source_file_url.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = (
    '  useEffect(() => {\n'
    '    if (!doc.source_file_url) {\n'
    '      setLoadingPdf(false);\n'
    '      return;\n'
    '    }\n'
    '    let cancelled = false;\n'
    '    (async () => {\n'
    '      try {\n'
    '        const pdf = await pdfjsLib.getDocument(doc.source_file_url).promise;\n'
)

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of SignerFillScreen's PDF-load effect start, found {count}. Aborting.")
    sys.exit(1)

replacement = (
    '  useEffect(() => {\n'
    '    console.log("SignerFillScreen doc object:", doc);\n'
    '    console.log("source_file_url value:", doc.source_file_url, typeof doc.source_file_url);\n'
    '    if (!doc.source_file_url) {\n'
    '      setLoadingPdf(false);\n'
    '      return;\n'
    '    }\n'
    '    let cancelled = false;\n'
    '    (async () => {\n'
    '      try {\n'
    '        const pdf = await pdfjsLib.getDocument(doc.source_file_url).promise;\n'
)

src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — debug logging added to SignerFillScreen.")
print("Next: npm run build, push, reproduce, and check Console for the two new log lines.")
