#!/usr/bin/env python3
"""
Adds console.error logging to MySignatureSetup's save() catch block so the
real failure reason shows up in DevTools console instead of being swallowed.
Run from ~/scp-final. Usage: python3 debug_signature_save.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = '''    } catch (e) {
      toast("Failed to save signature", "error");
    } finally {
      setSaving(false);
    }'''

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the save() catch block, found {count}. Aborting.")
    sys.exit(1)

replacement = '''    } catch (e) {
      console.error("Signature save failed:", e);
      toast("Failed to save signature", "error");
    } finally {
      setSaving(false);
    }'''

src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — console.error logging added to save() catch block.")
print("Next: npm run build, then push, then reproduce the failure and check the Console tab.")
