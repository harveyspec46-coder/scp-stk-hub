#!/usr/bin/env python3
"""
Adds the Committees page component (list committees, admin-only create
modal, member add/remove/role-assign, all board-visible / admin-managed).
Run from ~/scp-final. Usage: python3 apply_committees_component.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = 'function ESignatures({ toast, user }) {'


count = src.count(anchor)
if count != 1:
    print("ERROR: expected exactly 1 occurrence of the ESignatures function anchor, found " + str(count) + ". Aborting.")
    sys.exit(1)

committees_component = '''// -- Committees page -----------------------------------------------------
function Committees({ toast, user }) {
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
}

// -- Committee manage modal (member add/remove/role-assign, admin only for
// changes; any board member can view) -------------------------------------
function CommitteeManageModal({ committee, boardUsers, toast, getToken, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [addingId, setAddingId] = useState("");

  const memberUserIds = new Set((committee.members || []).map((m) => m.user_id));
  const availableToAdd = boardUsers.filter((u) => !memberUserIds.has(u.id));

  const addMember = async () => {
    if (!addingId) return;
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: addingId }),
        }
      );
      if (!res.ok) throw new Error("Add failed");
      toast("Member added \u2713", "success");
      setAddingId("");
      onChanged();
    } catch (e) {
      console.error("Add member failed:", e);
      toast("Failed to add member", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (memberId, role) => {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committee.id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      toast("Role updated \u2713", "success");
      onChanged();
    } catch (e) {
      console.error("Update role failed:", e);
      toast("Failed to update role", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId) => {
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

  return (
    <Modal
      title={committee.name}
      sub={committee.description || "Manage members and roles"}
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {(committee.members || []).map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}
          >
            <span style={{ flex: 1, fontSize: 13 }}>{m.full_name || "Member"}</span>
            <select
              className="fsel"
              value={m.role}
              disabled={busy}
              onChange={(e) => updateRole(m.id, e.target.value)}
              style={{ fontSize: 11, padding: "3px 6px" }}
            >
              <option value="lead">Lead</option>
              <option value="co-lead">Co-Lead</option>
              <option value="member">Member</option>
            </select>
            <button
              className="btn btn-sm"
              style={{ color: T.pink }}
              disabled={busy}
              onClick={() => removeMember(m.id)}
            >
              Remove
            </button>
          </div>
        ))}
        {(committee.members || []).length === 0 && (
          <div style={{ fontSize: 12, color: T.muted }}>No members yet.</div>
        )}
      </div>

      <div className="ff">
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
}

'''

src = src.replace(anchor, committees_component + anchor, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- Committees component added (list, create, member management).")
print("Next: npm run build")
