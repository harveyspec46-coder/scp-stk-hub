#!/usr/bin/env python3
"""
Removes the docs-related state/logic and Documents JSX section from
CommitteeManageModal, since documents now live in the workspace page
instead. Restores the modal to pure member/role management.
Run from ~/scp-final. Usage: python3 remove_modal_docs_duplicate.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# 1. Remove the docs state/logic block (state + loadDocs + effect + upload + delete)
docs_logic_block = '''
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocs = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setDocs(json.data || []);
    } catch (e) {
      console.error("Failed to load committee documents:", e);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [committee.id]);

  const uploadDoc = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const path = `${session.user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("committee-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("committee-documents").getPublicUrl(path);

      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: file.name,
            url: urlData.publicUrl,
            file_type: file.name.split(".").pop() || "",
          }),
        }
      );
      if (!res.ok) throw new Error("Add document failed");
      toast("Document added \u2713", "success");
      loadDocs();
    } catch (e) {
      console.error("Upload committee document failed:", e);
      toast("Failed to upload document", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/documents/${doc.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Delete failed");
      toast("Document deleted", "success");
      loadDocs();
    } catch (e) {
      console.error("Delete committee document failed:", e);
      toast("Failed to delete document (only the uploader or an admin can)", "error");
    }
  };
'''

count1 = src.count(docs_logic_block)
if count1 != 1:
    print("ERROR: expected exactly 1 occurrence of the docs logic block, found " + str(count1) + ". Aborting.")
    sys.exit(1)

src = src.replace(docs_logic_block, "", 1)

# 2. Remove the Documents JSX section (between Add-a-member block and </Modal>)
docs_jsx_block = '''
      <div className="ff" style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <label className="fl">Documents & materials</label>
        <input
          type="file"
          className="fi2"
          disabled={uploading}
          onChange={(e) => {
            uploadDoc(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
        {docsLoading && (
          <div className="fhint">Loading documents\u2026</div>
        )}
        {!docsLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>\U0001F4C4</span>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, fontSize: 12, color: T.text, textDecoration: "none" }}
                >
                  {d.name}
                </a>
                {(d.uploaded_by === user?.id || user?.role === "admin") && (
                  <button
                    className="btn btn-sm"
                    style={{ color: T.pink }}
                    onClick={() => deleteDoc(d)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
            {docs.length === 0 && (
              <div className="fhint">No documents yet.</div>
            )}
          </div>
        )}
      </div>
'''

count2 = src.count(docs_jsx_block)
if count2 != 1:
    print("ERROR: expected exactly 1 occurrence of the docs JSX block, found " + str(count2) + ". Aborting.")
    sys.exit(1)

src = src.replace(docs_jsx_block, "", 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- Documents section removed from CommitteeManageModal (now member/role management only).")
print("Next: npm run build")
