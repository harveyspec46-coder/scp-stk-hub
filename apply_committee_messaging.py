#!/usr/bin/env python3
"""
Replaces the "coming soon" Messages placeholder in the Committees workspace
with a real chat: loads messages, sends new ones, and live-updates via
Supabase Realtime (same postgres_changes pattern used by the CRM jobs board).
Run from ~/scp-final. Usage: python3 apply_committee_messaging.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

anchor = '''  const deleteWsDoc = async (doc) => {
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
'''

count1 = src.count(anchor)
if count1 != 1:
    print("ERROR: expected exactly 1 occurrence of deleteWsDoc, found " + str(count1) + ". Aborting.")
    sys.exit(1)

messaging_logic = '''
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadMessages = async (committeeId) => {
    setMessagesLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${committeeId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setMessages(json.data || []);
    } catch (e) {
      console.error("Failed to load committee messages:", e);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Real-time: refresh messages the moment anyone posts to this committee
  useEffect(() => {
    if (!sel) return;
    const channel = supabase
      .channel("committee-messages-" + sel)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "committee_messages", filter: `committee_id=eq.${sel}` },
        () => loadMessages(sel)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sel]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selCommittee) return;
    setSendingMessage(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/committees/${selCommittee.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body: messageInput.trim() }),
        }
      );
      if (!res.ok) throw new Error("Send failed");
      setMessageInput("");
      loadMessages(selCommittee.id);
    } catch (e) {
      console.error("Send committee message failed:", e);
      toast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };
'''

src = src.replace(anchor, anchor + messaging_logic, 1)

old_open = '''  const openCommittee = (id) => {
    setSel(id);
    loadWsDocs(id);
  };'''

count2 = src.count(old_open)
if count2 != 1:
    print("ERROR: expected exactly 1 occurrence of openCommittee, found " + str(count2) + ". Aborting.")
    sys.exit(1)

new_open = '''  const openCommittee = (id) => {
    setSel(id);
    loadWsDocs(id);
    loadMessages(id);
  };'''

src = src.replace(old_open, new_open, 1)

old_panel = '''            <div className="card" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: 520 }}>
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
                Committee messaging is coming soon — this panel will show a live
                <br />
                group chat for {selCommittee.name} members.
              </div>
              <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
                <input
                  className="fi2"
                  placeholder="Message coming soon…"
                  disabled
                  style={{ width: "100%" }}
                />
              </div>
            </div>'''

count3 = src.count(old_panel)
if count3 != 1:
    print("ERROR: expected exactly 1 occurrence of the Messages placeholder panel, found " + str(count3) + ". Aborting.")
    sys.exit(1)

new_panel = '''            <div className="card" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: 520 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Messages</div>
                <div style={{ fontSize: 11, color: T.muted }}>Only visible to committee members</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {messagesLoading && (
                  <div style={{ textAlign: "center", color: T.muted, fontSize: 12 }}>Loading messages…</div>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <div style={{ textAlign: "center", color: T.muted, fontSize: 12, marginTop: 20 }}>
                    No messages yet — say hello to {selCommittee.name}.
                  </div>
                )}
                {!messagesLoading &&
                  messages.map((m) => {
                    const isMe = m.user_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                        }}
                      >
                        {!isMe && (
                          <div style={{ fontSize: 10, color: T.muted, marginBottom: 2, marginLeft: 4 }}>
                            {m.full_name || "Member"}
                          </div>
                        )}
                        <div
                          style={{
                            background: isMe ? "var(--p)" : "var(--dk)",
                            color: isMe ? "#fff" : T.text,
                            border: isMe ? "none" : "1px solid var(--border)",
                            borderRadius: 12,
                            padding: "8px 12px",
                            fontSize: 13,
                            wordBreak: "break-word",
                          }}
                        >
                          {m.body}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: T.muted,
                            marginTop: 2,
                            textAlign: isMe ? "right" : "left",
                            marginRight: isMe ? 4 : 0,
                            marginLeft: isMe ? 0 : 4,
                          }}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                <input
                  className="fi2"
                  placeholder="Message this committee…"
                  value={messageInput}
                  disabled={sendingMessage}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-p"
                  disabled={!messageInput.trim() || sendingMessage}
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>'''

src = src.replace(old_panel, new_panel, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- real committee chat wired up (list, send, realtime updates).")
print("Next: npm run build")
