#!/usr/bin/env python3
"""
Pass C: replaces the legacy SignDocumentModal flow with SignerFillScreen —
a real review -> tap-to-fill -> done flow using the actual esign_fields
backend. Also fixes the 4 leftover mock uid/role signer-matching checks to
use the real user_id link.
Run from ~/scp-final. Usage: python3 apply_signing_pass_c.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Insert SignerFillScreen component before ESignatures ──────────────────
component_anchor = (
    '// ── Main E-Signatures page ────────────────────────────────────────────────────\n'
    'function ESignatures({ toast, user }) {'
)
count = src.count(component_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the ESignatures function anchor, found {count}. Aborting.")
    sys.exit(1)

fill_component = '''// ── Signer fill screen (review -> tap pre-placed fields to sign -> done) ────
function SignerFillScreen({ doc, user, mySignature, onClose, onSigned, toast, getToken }) {
  const [step, setStep] = useState("review"); // review | fill | done
  const [agreed, setAgreed] = useState(false);
  const [pages, setPages] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fillingId, setFillingId] = useState(null);

  const mySigner = (doc.signers || []).find((s) => s.user_id === user?.id);

  useEffect(() => {
    if (!doc.source_file_url) {
      setLoadingPdf(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(doc.source_file_url).promise;
        const out = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = PLACEMENT_PAGE_WIDTH / unscaled.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          out.push({ dataUrl: canvas.toDataURL("image/png"), width: viewport.width, height: viewport.height });
        }
        if (!cancelled) setPages(out);
      } catch (e) {
        console.error("Failed to render PDF for signing:", e);
        toast("Failed to load document", "error");
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc.source_file_url]);

  const loadFields = async () => {
    if (!mySigner) return;
    setLoadingFields(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents/${doc.id}/fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const mine = (json.data || []).filter((f) => f.signer_id === mySigner.id);
      setFields(mine);
    } catch (e) {
      console.error("Failed to load fields:", e);
      toast("Failed to load your signature fields", "error");
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    if (step === "fill") loadFields();
  }, [step]);

  const allFilled = fields.length > 0 && fields.every((f) => f.filled);

  useEffect(() => {
    if (step === "fill" && allFilled) {
      setStep("done");
      onSigned && onSigned();
    }
  }, [allFilled, step]);

  const fillField = async (field) => {
    if (field.filled || fillingId) return;
    let value;
    if (field.type === "signature") {
      if (!mySignature) {
        toast("Set up your signature first, then come back to sign", "warn");
        return;
      }
      value = mySignature.signature_image;
    } else {
      value = new Date().toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    setFillingId(field.id);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signer_id: mySigner.id, value }),
      });
      if (!res.ok) throw new Error("Fill failed");
      const json = await res.json();
      setFields((prev) => prev.map((f) => (f.id === field.id ? json.data : f)));
    } catch (e) {
      console.error("Fill field failed:", e);
      toast("Failed to sign this field", "error");
    } finally {
      setFillingId(null);
    }
  };

  const fieldsOnPage = fields.filter((f) => f.page === activePage + 1);
  const currentPageData = pages[activePage];

  return (
    <Modal
      title={step === "done" ? "Document signed ✓" : "Sign document"}
      sub={doc.name}
      onClose={onClose}
      footer={
        step === "review" ? (
          <>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-p" disabled={!agreed} onClick={() => setStep("fill")}>
              Continue to sign →
            </button>
          </>
        ) : step === "done" ? (
          <button className="btn btn-p" onClick={onClose}>
            Done ✓
          </button>
        ) : (
          <button className="btn" onClick={onClose}>
            Close (finish later)
          </button>
        )
      }
    >
      {step === "review" && (
        <>
          <div className="doc-preview">
            <h3>{doc.name}</h3>
            <p>
              This agreement is between{" "}
              <b style={{ color: T.text }}>SCP-STK (Sawyer Culberson Project of Save the Kids)</b>, a
              501(c)(3) nonprofit registered in Washington State, and the signatory named below.
            </p>
            <p style={{ marginTop: 12, fontSize: 11, color: T.muted }}>
              Document ID: {doc.id} · {(doc.signers || []).length} signer
              {(doc.signers || []).length !== 1 ? "s" : ""}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              background: "rgba(242,7,133,.05)",
              border: "1px solid rgba(242,7,133,.2)",
              borderRadius: "var(--r)",
              padding: "11px 13px",
              cursor: "pointer",
            }}
            onClick={() => setAgreed((a) => !a)}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `2px solid ${agreed ? T.pink : "var(--border2)"}`,
                background: agreed ? "var(--p)" : "transparent",
                flexShrink: 0,
                marginTop: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agreed && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              I, <b style={{ color: T.text }}>{user?.name || "User"}</b>, confirm I have read this
              document and agree to sign electronically. My electronic signature is legally binding
              under the ESIGN Act.
            </div>
          </div>
        </>
      )}

      {step === "fill" && (
        <>
          {(loadingPdf || loadingFields) && (
            <div style={{ padding: 20, color: T.muted, fontSize: 12 }}>Loading document…</div>
          )}
          {!loadingPdf && !loadingFields && !mySigner && (
            <div style={{ padding: 20, color: T.muted, fontSize: 12 }}>
              You are not listed as a signer on this document.
            </div>
          )}
          {!loadingPdf && !loadingFields && mySigner && fields.length === 0 && (
            <div style={{ padding: 20, color: T.muted, fontSize: 12 }}>
              No signature fields have been placed for you yet.
            </div>
          )}
          {!loadingPdf && !loadingFields && currentPageData && fields.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setActivePage((p) => Math.max(0, p - 1))}
                  disabled={activePage === 0}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 12, color: T.muted }}>
                  Page {activePage + 1} / {pages.length}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setActivePage((p) => Math.min(pages.length - 1, p + 1))}
                  disabled={activePage === pages.length - 1}
                >
                  Next →
                </button>
              </div>
              <div
                style={{
                  position: "relative",
                  width: PLACEMENT_PAGE_WIDTH,
                  height: currentPageData.height,
                  maxWidth: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <img
                  src={currentPageData.dataUrl}
                  alt={`Page ${activePage + 1}`}
                  style={{ width: PLACEMENT_PAGE_WIDTH, height: currentPageData.height, display: "block" }}
                />
                {fieldsOnPage.map((f) => {
                  const left = (f.x / 100) * PLACEMENT_PAGE_WIDTH;
                  const top = (f.y / 100) * currentPageData.height;
                  const width = (f.width / 100) * PLACEMENT_PAGE_WIDTH;
                  const height = (f.height / 100) * currentPageData.height;
                  return (
                    <div
                      key={f.id}
                      onClick={() => fillField(f)}
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width,
                        height,
                        border: `2px ${f.filled ? "solid" : "dashed"} #f20785`,
                        background: f.filled ? "rgba(34,211,160,.12)" : "rgba(242,7,133,.08)",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: f.filled ? T.green : "#f20785",
                        fontWeight: 600,
                        cursor: f.filled ? "default" : "pointer",
                        textAlign: "center",
                        padding: 2,
                        overflow: "hidden",
                      }}
                    >
                      {fillingId === f.id
                        ? "…"
                        : f.filled
                        ? f.type === "signature"
                          ? "✓ Signed"
                          : f.filled_value
                        : f.type === "signature"
                        ? "Tap to sign"
                        : "Tap for date"}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>
                {fields.filter((f) => f.filled).length} / {fields.length} of your fields completed
              </div>
            </>
          )}
        </>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(34,211,160,.12)",
              border: "1px solid rgba(34,211,160,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              margin: "0 auto 12px",
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>
            All your fields signed
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            The document will move to Complete once every signer has finished.
          </div>
        </div>
      )}
    </Modal>
  );
}

'''

src = src.replace(component_anchor, fill_component + component_anchor, 1)

# ── 2. Replace the activeModal/SignDocumentModal usage block ─────────────────
old_active_modal = (
    '      {activeModal && (\n'
    '        <SignDocumentModal\n'
    '          doc={activeModal.doc}\n'
    '          signerName={user?.name || "User"}\n'
    '          signerRole={user?.role || "staff"}\n'
    '          onClose={() => setActiveModal(null)}\n'
    '          onComplete={(sigData, signedAt) => {\n'
    '            // Find which signer slot matches this user\n'
    '            const signer = activeModal.doc.signers.find(\n'
    '              (s) => s.uid === user?.uid || s.role === user?.role\n'
    '            );\n'
    '            if (signer)\n'
    '              signDoc(activeModal.doc.id, signer.uid, sigData, signedAt);\n'
    '          }}\n'
    '          toast={toast}\n'
    '        />\n'
    '      )}'
)

count = src.count(old_active_modal)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the old activeModal/SignDocumentModal block, found {count}. Aborting.")
    sys.exit(1)

new_active_modal = (
    '      {activeModal && (\n'
    '        <SignerFillScreen\n'
    '          doc={activeModal.doc}\n'
    '          user={user}\n'
    '          mySignature={mySignature}\n'
    '          onClose={() => setActiveModal(null)}\n'
    '          onSigned={() => loadDocuments()}\n'
    '          toast={toast}\n'
    '          getToken={getToken}\n'
    '        />\n'
    '      )}'
)

src = src.replace(old_active_modal, new_active_modal, 1)

# ── 3. Fix the remaining mock uid/role matching (2x pattern A, 1x pattern B) ──
pattern_a_old = '(s) => !s.signed && (s.uid === user?.uid || s.role === user?.role)'
pattern_a_new = '(s) => !s.signed && s.user_id === user?.id'
count_a = src.count(pattern_a_old)
if count_a != 2:
    print(f"ERROR: expected exactly 2 occurrences of pattern A (!s.signed matching), found {count_a}. Aborting.")
    sys.exit(1)
src = src.replace(pattern_a_old, pattern_a_new)

pattern_b_old = '(s) => s.uid === user?.uid || s.role === user?.role'
pattern_b_new = '(s) => s.user_id === user?.id'
count_b = src.count(pattern_b_old)
if count_b != 1:
    print(f"ERROR: expected exactly 1 remaining occurrence of pattern B, found {count_b}. Aborting.")
    sys.exit(1)
src = src.replace(pattern_b_old, pattern_b_new)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — Pass C applied: real signing flow (review -> tap-to-fill -> done), signer matching fixed.")
print("Next: npm run build")
