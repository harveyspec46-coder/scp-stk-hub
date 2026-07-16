#!/usr/bin/env python3
"""
Adds a real fetch of documents (GET /api/esign/documents) so the E-Signatures
list actually shows created documents instead of staying empty.
Run from ~/scp-final. Usage: python3 apply_load_documents.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# Anchor: the allUsers-loading useEffect we added in Pass A — unique to
# ESignatures, and a safe place to add a sibling useEffect right after it.
anchor = (
    '  useEffect(() => {\n'
    '    (async () => {\n'
    '      try {\n'
    '        const token = await getToken();\n'
    '        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {\n'
    '          headers: { Authorization: `Bearer ${token}` },\n'
    '        });\n'
    '        const json = await res.json();\n'
    '        setAllUsers(json.data || []);\n'
    '      } catch (e) {\n'
    '        /* silent — signer multi-select just stays empty */\n'
    '      }\n'
    '    })();\n'
    '  }, []);\n'
)

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the allUsers-loading useEffect, found {count}. Aborting.")
    sys.exit(1)

load_docs_block = (
    '\n'
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
    '\n'
    '  useEffect(() => {\n'
    '    loadDocuments();\n'
    '  }, []);\n'
)

src = src.replace(anchor, anchor + load_docs_block, 1)

# Also: refresh the list right after a document is successfully created, so
# it appears immediately without needing a manual page reload.
create_success_anchor = (
    '      setSendModal(false);\n'
    '      setPlacementDoc(json.data);\n'
    '      toast("Document created — place signature fields next", "success");\n'
)
count2 = src.count(create_success_anchor)
if count2 != 1:
    print(f"ERROR: expected exactly 1 occurrence of the createDocument success block, found {count2}. Aborting.")
    sys.exit(1)

src = src.replace(
    create_success_anchor,
    create_success_anchor + '      loadDocuments();\n',
    1,
)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — real document list wired up (GET /api/esign/documents), refreshes after create.")
print("Next: npm run build")
