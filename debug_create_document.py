#!/usr/bin/env python3
"""
Adds console.error logging to createDocument's catch block so the real
failure reason shows up in DevTools console instead of being swallowed.
Run from ~/scp-final. Usage: python3 debug_create_document.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = (
    '    } catch (e) {\n'
    '      toast("Failed to create document", "error");\n'
    '    } finally {\n'
    '      setCreating(false);\n'
    '    }\n'
)

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of createDocument's catch block, found {count}. Aborting.")
    sys.exit(1)

replacement = (
    '    } catch (e) {\n'
    '      console.error("Create document failed:", e);\n'
    '      toast("Failed to create document", "error");\n'
    '    } finally {\n'
    '      setCreating(false);\n'
    '    }\n'
)

src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — console.error logging added to createDocument's catch block.")
print("Next: npm run build, push, reproduce the failure, and check the Console tab.")
