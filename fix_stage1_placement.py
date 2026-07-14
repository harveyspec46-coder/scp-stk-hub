#!/usr/bin/env python3
"""
Fixes Stage 1 pieces that landed in the wrong component.
Run from ~/scp-final. Usage: python3 fix_stage1_placement.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

original = src

# ── Remove misplaced pdfFile state line ───────────────────────────────────────
bad_state = '  const [pdfFile, setPdfFile] = useState(null);\n'
count = src.count(bad_state)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the misplaced pdfFile state line, found {count}. Aborting — no changes made.")
    sys.exit(1)
src = src.replace(bad_state, '', 1)

# ── Remove misplaced upload block (wrong modal) ───────────────────────────────
bad_block = '''          <div className="ff">
            <label className="fl">Upload PDF document</label>
            <input
              type="file"
              accept="application/pdf"
              className="fi2"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            {pdfFile && (
              <div className="fhint">
                {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
          <PdfPageImages file={pdfFile} />
'''
count = src.count(bad_block)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the misplaced upload block, found {count}. Aborting — no changes made.")
    sys.exit(1)
src = src.replace(bad_block, '', 1)

# ── Re-insert pdfFile state in the CORRECT component (ESignatures) ───────────
# Anchor: the docs state line immediately followed by newDoc state init,
# which is unique to ESignatures.
correct_state_anchor = '  const [docs, setDocs] = useState([]);\n\n  const [newDoc, setNewDoc] = useState({'
count = src.count(correct_state_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the ESignatures docs/newDoc anchor, found {count}. Aborting — reverting.")
    sys.exit(1)
src = src.replace(
    correct_state_anchor,
    '  const [docs, setDocs] = useState([]);\n  const [pdfFile, setPdfFile] = useState(null);\n\n  const [newDoc, setNewDoc] = useState({',
    1,
)

# ── Re-insert upload block in the CORRECT modal (before newDoc.name field) ───
correct_jsx_anchor = '''            <input
              className="fi2"
              value={newDoc.name}
              onChange={setND("name")}
              placeholder="e.g. Program Participation Agreement — Kezia M."
            />'''
count = src.count(correct_jsx_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the newDoc.name input anchor, found {count}. Aborting — reverting.")
    sys.exit(1)

upload_block = '''          <div className="ff">
            <label className="fl">Upload PDF document</label>
            <input
              type="file"
              accept="application/pdf"
              className="fi2"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            {pdfFile && (
              <div className="fhint">
                {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
          <PdfPageImages file={pdfFile} />
          <div className="ff">
            <label className="fl">Document name</label>
'''

# The anchor above is the <input> block itself; we need to insert the upload
# block right before the enclosing "Document name" <div className="ff"> that
# wraps it. That wrapper text is:
wrapper_anchor = '          <div className="ff">\n            <label className="fl">Document name</label>\n' + correct_jsx_anchor
count = src.count(wrapper_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the full Document-name wrapper anchor, found {count}. Aborting — reverting.")
    sys.exit(1)

src = src.replace(
    wrapper_anchor,
    upload_block.replace('          <div className="ff">\n            <label className="fl">Document name</label>\n', '') + wrapper_anchor,
    1,
)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — misplaced pieces removed and re-inserted into the correct ESignatures modal.")
print("Next: npm run build")
