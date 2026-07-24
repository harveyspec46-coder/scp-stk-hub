#!/usr/bin/env python3
"""
Restructures Committees: clicking a committee now opens a full dedicated
workspace page (matching the Programs component's sel-based pattern)
instead of a modal directly. The workspace has a two-column layout: left
= info + Manage members button + Documents, right = a persistent Messages
panel (placeholder for now -- real messaging is separate follow-up work).
The existing CommitteeManageModal is untouched, just triggered from a
button inside the workspace instead of from the list row.

Run from ~/scp-final. Usage: python3 apply_committee_workspace.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

old_full = '''function Committees({ toast, user }) {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageId, setManageId] = useState(null); // committee id currently being managed
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === "admin";

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadCommittees = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setCommittees(json.data || []);
    } catch (e) {
      console.error("Failed to load committees:", e);
      toast("Failed to load committees", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setAllUsers(json.data || []);
    } catch (e) {
      /* silent -- member picker just stays empty */
    }
  };

  useEffect(() => {
    loadCommittees();
    loadUsers();
  }, []);

  const boardUsers = allUsers.filter((u) => u.role === "admin" || u.role === "manager");

  const toggleNewMember = (id) => {
    setNewMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createCommittee = async () => {
    if (!newName.trim()) {
      toast("Committee name required", "warn");
      return;
    }
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          member_ids: newMemberIds,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      toast("Committee created \u2713", "success");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewMemberIds([]);
      loadCommittees();
    } catch (e) {
      console.error("Create committee failed:", e);
      toast("Failed to create committee", "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteCommittee = async (committee) => {
    if (!window.confirm(`Delete "${committee.name}"? This removes all its members too.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees/${committee.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast("Committee deleted", "success");
      loadCommittees();
    } catch (e) {
      console.error("Delete committee failed:", e);
      toast("Failed to delete committee", "error");
    }
  };

  const roleLabel = (r) => ({ lead: "Lead", "co-lead": "Co-Lead", member: "Member" }[r] || r);
  const roleBadgeClass = (r) =>
    r === "lead" ? "badge b-p" : r === "co-lead" ? "badge b-v" : "badge b-a";

  const managedCommittee = committees.find((c) => c.id === manageId);

  return (
    <div>
      {createOpen && (
        <Modal
          title="Create committee"
          sub="Board members only"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={createCommittee} disabled={creating}>
                {creating ? "Creating\u2026" : "Create committee"}
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Committee name</label>
            <input
              className="fi2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Grants Committee"
            />
          </div>
          <div className="ff">
            <label className="fl">Description (optional)</label>
            <textarea
              className="ftxt"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What this committee is responsible for\u2026"
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="ff">
            <label className="fl">Initial members (optional)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {boardUsers.map((u) => {
                const checked = newMemberIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleNewMember(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${checked ? "#f20785" : "var(--border)"}`,
                      background: checked ? "rgba(242,7,133,.06)" : "transparent",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <span>{checked ? "\u2713" : "\u25CB"}</span>
                    <span>{u.full_name}</span>
                    <span style={{ color: T.muted, marginLeft: "auto" }}>
                      {u.role === "admin" ? "Admin" : "Manager"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="fhint">You can add or promote members later too</div>
          </div>
        </Modal>
      )}

      {managedCommittee && (
        <CommitteeManageModal
          committee={managedCommittee}
          boardUsers={boardUsers}
          user={user}
          toast={toast}
          getToken={getToken}
          onClose={() => setManageId(null)}
          onChanged={loadCommittees}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">Committees</div>
          <div className="page-sub">Board-only working groups \u2014 grants, AYP, and more</div>
        </div>
        {isAdmin && (
          <button className="btn btn-p" onClick={() => setCreateOpen(true)}>
            + New committee
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
          Loading committees\u2026
        </div>
      )}

      {!loading &&
        committees.map((c) => (
          <div
            key={c.id}
            className="esign-doc-row"
            onClick={() => setManageId(c.id)}
            style={{ cursor: "pointer" }}
          >
            <div className="esign-doc-icon">\U0001F465</div>
            <div className="esign-doc-meta">
              <div className="esign-doc-name">{c.name}</div>
              <div className="esign-doc-sub">
                {c.description ? c.description + " \u00B7 " : ""}
                {(c.members || []).length} member{(c.members || []).length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                {(c.members || []).slice(0, 6).map((m) => (
                  <span key={m.id} className={roleBadgeClass(m.role)} style={{ fontSize: 10 }}>
                    {m.full_name || "Member"} \u00B7 {roleLabel(m.role)}
                  </span>
                ))}
                {(c.members || []).length > 6 && (
                  <span style={{ fontSize: 10, color: T.muted }}>
                    +{(c.members || []).length - 6} more
                  </span>
                )}
              </div>
            </div>
            {isAdmin && c.created_by === user?.id && (
              <button
                className="btn btn-sm"
                style={{ color: T.pink }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCommittee(c);
                }}
              >
                \U0001F5D1\uFE0F Delete
              </button>
            )}
          </div>
        ))}

      {!loading && committees.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>\U0001F465</div>
          <div style={{ fontSize: 14, color: T.text, marginBottom: 6 }}>No committees yet</div>
          <div style={{ fontSize: 12 }}>
            {isAdmin
              ? "Create one using the button above."
              : "An admin hasn't created any committees yet."}
          </div>
        </div>
      )}
    </div>
  );
}'''

count = src.count(old_full)
if count != 1:
    print("ERROR: expected exactly 1 occurrence of the full Committees function, found " + str(count) + ". Aborting -- no changes made.")
    print("This likely means the file has drifted from what this script expects (e.g. a prior manual edit).")
    sys.exit(1)

new_full = '''function Committees({ toast, user }) {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageId, setManageId] = useState(null); // committee id whose member-management modal is open
  const [sel, setSel] = useState(null); // committee id currently open as a workspace page
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const [wsDocs, setWsDocs] = useState([]);
  const [wsDocsLoading, setWsDocsLoading] = useState(false);
  const [wsUploading, setWsUploading] = useState(false);

  const isAdmin = user?.role === "admin";

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadCommittees = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setCommittees(json.data || []);
    } catch (e) {
      console.error("Failed to load committees:", e);
      toast("Failed to load committees", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setAllUsers(json.data || []);
    } catch (e) {
      /* silent -- member picker just stays empty */
    }
  };

  useEffect(() => {
    loadCommittees();
    loadUsers();
  }, []);

  const boardUsers = allUsers.filter((u) => u.role === "admin" || u.role === "manager");

  const toggleNewMember = (id) => {
    setNewMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createCommittee = async () => {
    if (!newName.trim()) {
      toast("Committee name required", "warn");
      return;
    }
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          member_ids: newMemberIds,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      toast("Committee created \u2713", "success");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewMemberIds([]);
      loadCommittees();
    } catch (e) {
      console.error("Create committee failed:", e);
      toast("Failed to create committee", "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteCommittee = async (committee) => {
    if (!window.confirm(`Delete "${committee.name}"? This removes all its members too.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/committees/${committee.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast("Committee deleted", "success");
      setSel(null);
      loadCommittees();
    } catch (e) {
      console.error("Delete committee failed:", e);
      toast("Failed to delete committee", "error");
    }
  };

  const roleLabel = (r) => ({ lead: "Lead", "co-lead": "Co-Lead", member: "Member" }[r] || r);
  const roleBadgeClass = (r) =>
    r === "lead" ? "badge b-p" : r === "co-lead" ? "badge b-v" : "badge b-a";

  const managedCommittee = committees.find((c) => c.id === manageId);
  const selCommittee = committees.find((c) => c.id === sel);

  const loadWsDocs = async (committeeId) => {
    setWsDocsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committeeId}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setWsDocs(json.data || []);
    } catch (e) {
      console.error("Failed to load committee documents:", e);
    } finally {
      setWsDocsLoading(false);
    }
  };

  const openCommittee = (id) => {
    setSel(id);
    loadWsDocs(id);
  };

  const uploadWsDoc = async (file) => {
    if (!file || !selCommittee) return;
    setWsUploading(true);
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
        `${import.meta.env.VITE_API_URL}/api/committees/${selCommittee.id}/documents`,
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
      loadWsDocs(selCommittee.id);
    } catch (e) {
      console.error("Upload committee document failed:", e);
      toast("Failed to upload document", "error");
    } finally {
      setWsUploading(false);
    }
  };

  const deleteWsDoc = async (doc) => {
    if (!selCommittee || !window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${selCommittee.id}/documents/${doc.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Delete failed");
      toast("Document deleted", "success");
      loadWsDocs(selCommittee.id);
    } catch (e) {
      console.error("Delete committee document failed:", e);
      toast("Failed to delete document (only the uploader or an admin can)", "error");
    }
  };

  return (
    <div>
      {createOpen && (
        <Modal
          title="Create committee"
          sub="Board members only"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={createCommittee} disabled={creating}>
                {creating ? "Creating\u2026" : "Create committee"}
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Committee name</label>
            <input
              className="fi2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Grants Committee"
            />
          </div>
          <div className="ff">
            <label className="fl">Description (optional)</label>
            <textarea
              className="ftxt"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What this committee is responsible for\u2026"
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="ff">
            <label className="fl">Initial members (optional)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {boardUsers.map((u) => {
                const checked = newMemberIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleNewMember(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${checked ? "#f20785" : "var(--border)"}`,
                      background: checked ? "rgba(242,7,133,.06)" : "transparent",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <span>{checked ? "\u2713" : "\u25CB"}</span>
                    <span>{u.full_name}</span>
                    <span style={{ color: T.muted, marginLeft: "auto" }}>
                      {u.role === "admin" ? "Admin" : "Manager"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="fhint">You can add or promote members later too</div>
          </div>
        </Modal>
      )}

      {managedCommittee && (
        <CommitteeManageModal
          committee={managedCommittee}
          boardUsers={boardUsers}
          user={user}
          toast={toast}
          getToken={getToken}
          onClose={() => setManageId(null)}
          onChanged={loadCommittees}
        />
      )}

      {!sel && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <div>
              <div className="page-title">Committees</div>
              <div className="page-sub">Board-only working groups \u2014 grants, AYP, and more</div>
            </div>
            {isAdmin && (
              <button className="btn btn-p" onClick={() => setCreateOpen(true)}>
                + New committee
              </button>
            )}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
              Loading committees\u2026
            </div>
          )}

          {!loading &&
            committees.map((c) => (
              <div
                key={c.id}
                className="esign-doc-row"
                onClick={() => openCommittee(c.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="esign-doc-icon">\U0001F465</div>
                <div className="esign-doc-meta">
                  <div className="esign-doc-name">{c.name}</div>
                  <div className="esign-doc-sub">
                    {c.description ? c.description + " \u00B7 " : ""}
                    {(c.members || []).length} member{(c.members || []).length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {(c.members || []).slice(0, 6).map((m) => (
                      <span key={m.id} className={roleBadgeClass(m.role)} style={{ fontSize: 10 }}>
                        {m.full_name || "Member"} \u00B7 {roleLabel(m.role)}
                      </span>
                    ))}
                    {(c.members || []).length > 6 && (
                      <span style={{ fontSize: 10, color: T.muted }}>
                        +{(c.members || []).length - 6} more
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && c.created_by === user?.id && (
                  <button
                    className="btn btn-sm"
                    style={{ color: T.pink }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCommittee(c);
                    }}
                  >
                    \U0001F5D1\uFE0F Delete
                  </button>
                )}
              </div>
            ))}

          {!loading && committees.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>\U0001F465</div>
              <div style={{ fontSize: 14, color: T.text, marginBottom: 6 }}>No committees yet</div>
              <div style={{ fontSize: 12 }}>
                {isAdmin
                  ? "Create one using the button above."
                  : "An admin hasn't created any committees yet."}
              </div>
            </div>
          )}
        </>
      )}

      {sel && selCommittee && (
        <>
          <button className="btn btn-ghost" style={{ marginBottom: 12 }} onClick={() => setSel(null)}>
            \u2190 All committees
          </button>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Left column: info, members, documents */}
            <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>\U0001F465</span>
                  <div className="page-title" style={{ fontSize: 17 }}>{selCommittee.name}</div>
                </div>
                {selCommittee.description && (
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
                    {selCommittee.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {(selCommittee.members || []).map((m) => (
                    <span key={m.id} className={roleBadgeClass(m.role)} style={{ fontSize: 10 }}>
                      {m.full_name || "Member"} \u00B7 {roleLabel(m.role)}
                    </span>
                  ))}
                  {(selCommittee.members || []).length === 0 && (
                    <span style={{ fontSize: 11, color: T.muted }}>No members yet</span>
                  )}
                </div>
                <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => setManageId(selCommittee.id)}>
                  Manage members
                </button>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 8 }}>
                  Documents & materials
                </div>
                <input
                  type="file"
                  className="fi2"
                  disabled={wsUploading}
                  onChange={(e) => {
                    uploadWsDoc(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
                {wsDocsLoading && <div className="fhint">Loading documents\u2026</div>}
                {!wsDocsLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                    {wsDocs.map((d) => (
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
                        <span style={{ fontSize: 15 }}>\U0001F4C4</span>
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
                            onClick={() => deleteWsDoc(d)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {wsDocs.length === 0 && <div className="fhint">No documents yet.</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: persistent messages panel */}
            <div className="card" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: 520 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Messages</div>
                <div style={{ fontSize: 11, color: T.muted }}>Only visible to committee members</div>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.muted,
                  fontSize: 12,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                Committee messaging is coming soon \u2014 this panel will show a live
                <br />
                group chat for {selCommittee.name} members.
              </div>
              <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
                <input
                  className="fi2"
                  placeholder="Message coming soon\u2026"
                  disabled
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}'''

src = src.replace(old_full, new_full, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- Committees restructured into a full workspace page (grid + two-column detail view).")
print("Next: npm run build")
