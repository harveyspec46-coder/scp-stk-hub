#!/usr/bin/env python3
"""
Adds user_id to the signer objects sent by createDocument — this is the fix
that was written earlier tonight but never actually got applied to this file.
Run from ~/scp-final. Usage: python3 fix_missing_userid_now.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = 'return { name: u.full_name, email: u.email, role: u.role };'
count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the signer-mapping return line, found {count}. Aborting.")
    sys.exit(1)

replacement = 'return { name: u.full_name, email: u.email, role: u.role, user_id: u.id };'
src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — user_id now included in the signers payload.")
print("Next: npm run build")
