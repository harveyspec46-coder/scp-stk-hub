#!/usr/bin/env python3
"""
Pass A: replaces free-text signer input with a multi-select of admin/manager
users, wires the real PDF upload + document creation call, and opens a
placement-screen stub afterward (rendered PDF + signer list, no drag/drop
yet — that's Pass B).
Run from ~/scp-final. Usage: python3 apply_placement_pass_a.py
"""
import re
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Add allUsers state + loader + selectedSignerIds state, right after
#      the getToken block AND its immediately-following my-signature fetch
#      useEffect. This combined block is unique to ESignatures, unlike
#      getToken alone which is redefined in ~13 components in this file.
anchor = (
    '  const getToken = async () => {\n'
    '    const { data: { session } } = await supabase.auth.getSession();\n'
    '    return session?.access_token;\n'
    '  };\n'
    '\n'
    '  useEffect(() => {\n'
    '    (async () => {\n'
    '      try {\n'
    '        const token = await getToken();\n'
    '        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/my-signature`, {\n'
    '          headers: { Authorization: `Bearer ${token}` },\n'
    '        });\n'
    '        const json = await res.json();\n'
    '        setMySignature(json.data || null);\n'
    '      } catch (e) {\n'
    '        /* silent — banner just stays in "set up" state */\n'
    '      } finally {\n'
    '        setSigLoading(false);\n'
    '      }\n'
    '    })();\n'
    '  }, []);\n'
)

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the getToken + my-signature useEffect block, found {count}. Aborting.")
    sys.exit(1)

extra_block = (
    '\n'
    '  const [allUsers, setAllUsers] = useState([]);\n'
    '  const [selectedSignerIds, setSelectedSignerIds] = useState([]);\n'
    '  const [placementDoc, setPlacementDoc] = useState(null); // created doc + signers, opens placement screen\n'
    '  const [creating, setCreating] = useState(false);\n'
    '\n'
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
    '\n'
    '  const boardUsers = allUsers.filter((u) => u.role === "admin" || u.role === "manager");\n'
    '\n'
    '  const toggleSigner = (id) => {\n'
    '    setSelectedSignerIds((prev) =>\n'
    '      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]\n'
    '    );\n'
    '  };\n'
    '\n'
    '  const createDocument = async () => {\n'
    '    if (!newDoc.name) {\n'
    '      toast("Document name required", "warn");\n'
    '      return;\n'
    '    }\n'
    '    if (!pdfFile) {\n'
    '      toast("Upload a PDF document", "warn");\n'
    '      return;\n'
    '    }\n'
    '    if (selectedSignerIds.length === 0) {\n'
    '      toast("Select at least one signer", "warn");\n'
    '      return;\n'
    '    }\n'
    '    setCreating(true);\n'
    '    try {\n'
    '      const { data: { session } } = await supabase.auth.getSession();\n'
    '      const path = `${session.user.id}/${Date.now()}_${pdfFile.name}`;\n'
    '      const { error: uploadError } = await supabase.storage.from("esign-documents").upload(path, pdfFile);\n'
    '      if (uploadError) throw uploadError;\n'
    '      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(path);\n'
    '\n'
    '      const signers = selectedSignerIds.map((id) => {\n'
    '        const u = boardUsers.find((x) => x.id === id);\n'
    '        return { name: u.full_name, email: u.email, role: u.role };\n'
    '      });\n'
    '\n'
    '      const token = await getToken();\n'
    '      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents`, {\n'
    '        method: "POST",\n'
    '        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },\n'
    '        body: JSON.stringify({\n'
    '          name: newDoc.name,\n'
    '          type: newDoc.type,\n'
    '          clauses: [],\n'
    '          source_file_url: urlData.publicUrl,\n'
    '          signers,\n'
    '        }),\n'
    '      });\n'
    '      if (!res.ok) throw new Error("Create failed");\n'
    '      const json = await res.json();\n'
    '\n'
    '      setSendModal(false);\n'
    '      setPlacementDoc(json.data);\n'
    '      toast("Document created — place signature fields next", "success");\n'
    '    } catch (e) {\n'
    '      toast("Failed to create document", "error");\n'
    '    } finally {\n'
    '      setCreating(false);\n'
    '    }\n'
    '  };\n'
)

src = src.replace(anchor, anchor + extra_block, 1)

# ── 2. Replace the "Signers (names or IDs, comma-separated)" field with the
#      multi-select of board users ──────────────────────────────────────────
old_signers_field = (
    '          <div className="ff">\n'
    '            <label className="fl">\n'
    '              Signers (names or IDs, comma-separated)\n'
    '            </label>\n'
    '            <input\n'
    '              className="fi2"\n'
    '              value={newDoc.signerNames}\n'
    '              onChange={setND("signerNames")}\n'
    '              placeholder="e.g. Kezia M., MGR-001, STF-003"\n'
    '            />\n'
    '            <div className="fhint">\n'
    '              Leave blank to add yourself as the only signer\n'
    '            </div>\n'
    '          </div>'
)

count = src.count(old_signers_field)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the old signers text field, found {count}. Aborting.")
    sys.exit(1)

new_signers_field = (
    '          <div className="ff">\n'
    '            <label className="fl">Signers</label>\n'
    '            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>\n'
    '              {boardUsers.map((u) => {\n'
    '                const checked = selectedSignerIds.includes(u.id);\n'
    '                return (\n'
    '                  <div\n'
    '                    key={u.id}\n'
    '                    onClick={() => toggleSigner(u.id)}\n'
    '                    style={{\n'
    '                      display: "flex",\n'
    '                      alignItems: "center",\n'
    '                      gap: 8,\n'
    '                      padding: "8px 10px",\n'
    '                      borderRadius: 6,\n'
    '                      border: `1px solid ${checked ? "#f20785" : "var(--border)"}`,\n'
    '                      background: checked ? "rgba(242,7,133,.06)" : "transparent",\n'
    '                      cursor: "pointer",\n'
    '                      fontSize: 12,\n'
    '                    }}\n'
    '                  >\n'
    '                    <span>{checked ? "✓" : "○"}</span>\n'
    '                    <span>{u.full_name}</span>\n'
    '                    <span style={{ color: T.muted, marginLeft: "auto" }}>\n'
    '                      {u.role === "admin" ? "Admin" : "Manager"}\n'
    '                    </span>\n'
    '                  </div>\n'
    '                );\n'
    '              })}\n'
    '              {boardUsers.length === 0 && (\n'
    '                <div className="fhint">No admins or managers found</div>\n'
    '              )}\n'
    '            </div>\n'
    '          </div>'
)

src = src.replace(old_signers_field, new_signers_field, 1)

# ── 3. Replace the old "Send for signatures" button's local-only onClick
#      with a call to createDocument() ──────────────────────────────────────
old_button_pattern = re.compile(
    r'<button\s*\n\s*className="btn btn-p"\s*\n\s*onClick=\{\(\) => \{\s*\n'
    r'\s*if \(!newDoc\.name\) \{.*?toast\("Document sent for signatures ✓", "success"\);\s*\n'
    r'\s*\}\}\s*\n\s*>\s*\n\s*Send for signatures\s*\n\s*</button>',
    re.DOTALL,
)
matches = old_button_pattern.findall(src)
if len(matches) != 1:
    print(f"ERROR: expected exactly 1 occurrence of the old Send-for-signatures button block, found {len(matches)}. Aborting.")
    sys.exit(1)

new_button = (
    '<button\n'
    '                className="btn btn-p"\n'
    '                onClick={createDocument}\n'
    '                disabled={creating}\n'
    '              >\n'
    '                {creating ? "Creating…" : "Continue to placement →"}\n'
    '              </button>'
)

src = old_button_pattern.sub(lambda m: new_button, src, count=1)

# ── 4. Add a placement-screen stub, rendered right before the sigSetupOpen
#      modal (a unique, already-confirmed landmark) ─────────────────────────
placement_anchor = (
    '      {sigSetupOpen && (\n'
    '        <MySignatureSetup'
)
count = src.count(placement_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the sigSetupOpen modal anchor, found {count}. Aborting.")
    sys.exit(1)

placement_stub = (
    '      {placementDoc && (\n'
    '        <Modal\n'
    '          title="Place signature fields"\n'
    '          sub={placementDoc.name}\n'
    '          onClose={() => setPlacementDoc(null)}\n'
    '          footer={\n'
    '            <>\n'
    '              <button className="btn" onClick={() => setPlacementDoc(null)}>\n'
    '                Close (finish later)\n'
    '              </button>\n'
    '            </>\n'
    '          }\n'
    '        >\n'
    '          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>\n'
    '            Document created with {(placementDoc.signers || []).length} signer\n'
    '            {(placementDoc.signers || []).length !== 1 ? "s" : ""}:\n'
    '          </div>\n'
    '          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>\n'
    '            {(placementDoc.signers || []).map((s) => (\n'
    '              <div key={s.id} style={{ fontSize: 12, color: T.text }}>\n'
    '                • {s.name} ({s.role})\n'
    '              </div>\n'
    '            ))}\n'
    '          </div>\n'
    '          <div style={{ fontSize: 11, color: T.muted }}>\n'
    '            Drag-and-drop field placement is coming next — this document is\n'
    '            saved and will appear in your document list.\n'
    '          </div>\n'
    '        </Modal>\n'
    '      )}\n'
    '\n'
    '      {sigSetupOpen && (\n'
    '        <MySignatureSetup'
)

src = src.replace(placement_anchor, placement_stub, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — Pass A applied: signer multi-select, real document creation, placement-screen stub.")
print("Next: npm run build")
