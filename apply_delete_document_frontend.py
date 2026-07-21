#!/usr/bin/env python3
"""
Adds a delete button to each document row, visible only when the current
user is the document's creator. Confirms before deleting, calls
DELETE /api/esign/documents/{id}, then refreshes the list.
Run from ~/scp-final. Usage: python3 apply_delete_document_frontend.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# 1. Add deleteDocument function, right after loadDocuments
anchor = (
    '  const loadDocuments = async () => {\n'
    '    try {\n'
    '      const token = await getToken();\n'
    '      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents`, {\n'
    '        headers: { Authorization: `Bearer ${token}` },\n'
    '      });\n'
    '      const json = await res.json();\n'
    '      setDocs(json.data || []);\n'
    '    } catch (e) {\n'
    '      console.error("Failed to load esign documents:", e);\n'
    '      toast("Failed to load documents", "error");\n'
    '    }\n'
    '  };\n'
)

count = src.count(anchor)
if count != 1:
    print("ERROR: expected exactly 1 occurrence of loadDocuments, found " + str(count) + ". Aborting.")
    sys.exit(1)

delete_fn = (
    '\n'
    '  const deleteDocument = async (doc) => {\n'
    '    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;\n'
    '    try {\n'
    '      const token = await getToken();\n'
    '      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents/${doc.id}`, {\n'
    '        method: "DELETE",\n'
    '        headers: { Authorization: `Bearer ${token}` },\n'
    '      });\n'
    '      if (!res.ok) throw new Error("Delete failed");\n'
    '      toast("Document deleted", "success");\n'
    '      loadDocuments();\n'
    '    } catch (e) {\n'
    '      console.error("Delete document failed:", e);\n'
    '      toast("Failed to delete document", "error");\n'
    '    }\n'
    '  };\n'
)

src = src.replace(anchor, anchor + delete_fn, 1)

# 2. Add the delete button inside the document row, next to the PDF button
old_pdf_button = (
    '              {allSigned && (\n'
    '                <button\n'
    '                  className="btn btn-sm"\n'
    '                  style={{ marginLeft: 6 }}\n'
    '                  onClick={(e) => {\n'
    '                    e.stopPropagation();\n'
    '                    toast("Preparing signed PDF\u2026");\n'
    '                    exportSignedPdf(doc, toast);\n'
    '                  }}\n'
    '                >\n'
    '                  \U0001F4C4 PDF\n'
    '                </button>\n'
    '              )}\n'
)

count2 = src.count(old_pdf_button)
if count2 != 1:
    print("ERROR: expected exactly 1 occurrence of the PDF button, found " + str(count2) + ". Aborting.")
    sys.exit(1)

new_with_delete = (
    old_pdf_button
    + '              {doc.created_by === user?.id && (\n'
    '                <button\n'
    '                  className="btn btn-sm"\n'
    '                  style={{ marginLeft: 6, color: T.pink }}\n'
    '                  onClick={(e) => {\n'
    '                    e.stopPropagation();\n'
    '                    deleteDocument(doc);\n'
    '                  }}\n'
    '                >\n'
    '                  \U0001F5D1\uFE0F Delete\n'
    '                </button>\n'
    '              )}\n'
)

src = src.replace(old_pdf_button, new_with_delete, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- delete button added, visible only to the document's creator.")
print("Next: npm run build")
