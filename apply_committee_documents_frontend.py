#!/usr/bin/env python3
"""
Adds a Documents section (upload + list + delete) to CommitteeManageModal.
Run from ~/scp-final. Usage: python3 apply_committee_documents_frontend.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

old_sig = 'function CommitteeManageModal({ committee, boardUsers, toast, getToken, onClose, onChanged }) {'
count1 = src.count(old_sig)
if count1 != 1:
    print("ERROR: expected exactly 1 occurrence of CommitteeManageModal's signature, found " + str(count1) + ". Aborting.")
    sys.exit(1)

new_sig = 'function CommitteeManageModal({ committee, boardUsers, user, toast, getToken, onClose, onChanged }) {'
src = src.replace(old_sig, new_sig, 1)

anchor = '''  const removeMember = async (memberId) => {
    if (!window.confirm("Remove this member from the committee?")) return;
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/members/${memberId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Remove failed");
      toast("Member removed", "success");
      onChanged();
    } catch (e) {
      console.error("Remove member failed:", e);
      toast("Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };
'''

count2 = src.count(anchor)
if count2 != 1:
    print("ERROR: expected exactly 1 occurrence of removeMember, found " + str(count2) + ". Aborting.")
    sys.exit(1)

docs_logic = '''
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
      toast("Document added ✓", "success");
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

src = src.replace(anchor, anchor + docs_logic, 1)

old_tail = '''      <div className="ff">
        <label className="fl">Add a member</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="fsel"
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select a board member\u2026</option>
            {availableToAdd.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role === "admin" ? "Admin" : "Manager"})
              </option>
            ))}
          </select>
          <button className="btn btn-p" disabled={!addingId || busy} onClick={addMember}>
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
}'''

count3 = src.count(old_tail)
if count3 != 1:
    print("ERROR: expected exactly 1 occurrence of the Add-a-member tail block, found " + str(count3) + ". Aborting.")
    sys.exit(1)

new_tail = '''      <div className="ff">
        <label className="fl">Add a member</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="fsel"
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select a board member…</option>
            {availableToAdd.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role === "admin" ? "Admin" : "Manager"})
              </option>
            ))}
          </select>
          <button className="btn btn-p" disabled={!addingId || busy} onClick={addMember}>
            Add
          </button>
        </div>
      </div>

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
          <div className="fhint">Loading documents…</div>
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
                <span style={{ fontSize: 16 }}>📄</span>
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
    </Modal>
  );
}'''

src = src.replace(old_tail, new_tail, 1)

old_usage = '''      {managedCommittee && (
        <CommitteeManageModal
          committee={managedCommittee}
          boardUsers={boardUsers}
          toast={toast}
          getToken={getToken}
          onClose={() => setManageId(null)}
          onChanged={loadCommittees}
        />
      )}'''

count4 = src.count(old_usage)
if count4 != 1:
    print("ERROR: expected exactly 1 occurrence of the CommitteeManageModal usage, found " + str(count4) + ". Aborting.")
    sys.exit(1)

new_usage = '''      {managedCommittee && (
        <CommitteeManageModal
          committee={managedCommittee}
          boardUsers={boardUsers}
          user={user}
          toast={toast}
          getToken={getToken}
          onClose={() => setManageId(null)}
          onChanged={loadCommittees}
        />
      )}'''

src = src.replace(old_usage, new_usage, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- document upload/list/delete added to CommitteeManageModal.")
print("Next: npm run build")
