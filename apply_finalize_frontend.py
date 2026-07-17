#!/usr/bin/env python3
"""
Calls the new finalize endpoint whenever SignerFillScreen detects all of
the current signer's fields are filled — closes the gap where fields
filled in an earlier/interrupted session never triggered completion.
Run from ~/scp-final. Usage: python3 apply_finalize_frontend.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = (
    '  useEffect(() => {\n'
    '    if (step === "fill" && allFilled) {\n'
    '      setStep("done");\n'
    '      onSigned && onSigned();\n'
    '    }\n'
    '  }, [allFilled, step]);\n'
)

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the allFilled useEffect, found {count}. Aborting.")
    sys.exit(1)

replacement = (
    '  useEffect(() => {\n'
    '    if (step === "fill" && allFilled && mySigner) {\n'
    '      (async () => {\n'
    '        try {\n'
    '          const token = await getToken();\n'
    '          await fetch(\n'
    '            `${import.meta.env.VITE_API_URL}/api/esign/documents/${doc.id}/signers/${mySigner.id}/finalize`,\n'
    '            { method: "POST", headers: { Authorization: `Bearer ${token}` } }\n'
    '          );\n'
    '        } catch (e) {\n'
    '          console.error("Finalize failed:", e);\n'
    '        } finally {\n'
    '          setStep("done");\n'
    '          onSigned && onSigned();\n'
    '        }\n'
    '      })();\n'
    '    }\n'
    '  }, [allFilled, step]);\n'
)

src = src.replace(anchor, replacement, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — finalize call wired into SignerFillScreen's completion detection.")
print("Next: npm run build")
