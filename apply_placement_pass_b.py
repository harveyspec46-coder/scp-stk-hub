#!/usr/bin/env python3
"""
Pass B: adds FieldPlacementScreen (drag/resize signature+date marker
placement on the rendered PDF) and wires it in place of the placement stub.
Run from ~/scp-final. Usage: python3 apply_placement_pass_b.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Add react-rnd import next to the pdfjsLib worker setup ────────────────
import_anchor = (
    'import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";\n'
    'pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;\n'
)
count = src.count(import_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the pdfjsWorker import block, found {count}. Aborting.")
    sys.exit(1)

src = src.replace(
    import_anchor,
    import_anchor + 'import { Rnd } from "react-rnd";\n',
    1,
)

# ── 2. Insert FieldPlacementScreen component before ESignatures ──────────────
component_anchor = (
    '// ── Main E-Signatures page ────────────────────────────────────────────────────\n'
    'function ESignatures({ toast, user }) {'
)
count = src.count(component_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the ESignatures function anchor, found {count}. Aborting.")
    sys.exit(1)

PAGE_WIDTH = 600

placement_component = '''// ── Field placement screen (admin marks where each signer's Signature/Date
// goes, drag + resize via react-rnd) ───────────────────────────────────────
const PLACEMENT_PAGE_WIDTH = ''' + str(PAGE_WIDTH) + ''';

function FieldPlacementScreen({ doc, pdfFile, onClose, onSaved, toast, getToken }) {
  const [pages, setPages] = useState([]); // [{ dataUrl, width, height }]
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [activePage, setActivePage] = useState(0); // 0-indexed
  const [activeSignerId, setActiveSignerId] = useState(doc.signers?.[0]?.id || "");
  const [fields, setFields] = useState([]); // [{ id, signerId, type, page(1-indexed), x, y, width, height }]
  const [saving, setSaving] = useState(false);
  const nextFieldId = useRef(1);

  useEffect(() => {
    if (!pdfFile) {
      setLoadingPdf(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const buf = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
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
      if (!cancelled) {
        setPages(out);
        setLoadingPdf(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfFile]);

  const activeSigner = (doc.signers || []).find((s) => s.id === activeSignerId);
  const currentPageData = pages[activePage];
  const fieldsOnPage = fields.filter((f) => f.page === activePage + 1);

  const addField = (type) => {
    if (!activeSignerId) {
      toast("Select a signer first", "warn");
      return;
    }
    if (!currentPageData) return;
    const id = nextFieldId.current++;
    const defaultWidth = type === "signature" ? 160 : 120;
    const defaultHeight = type === "signature" ? 50 : 36;
    const offset = (fieldsOnPage.length % 5) * 14;
    setFields((prev) => [
      ...prev,
      {
        id,
        signerId: activeSignerId,
        type,
        page: activePage + 1,
        x: 24 + offset,
        y: 24 + offset,
        width: defaultWidth,
        height: defaultHeight,
      },
    ]);
  };

  const updateField = (id, patch) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const signerLabel = (signerId) => {
    const s = (doc.signers || []).find((x) => x.id === signerId);
    return s ? s.name : "Unknown";
  };

  const finishAndSend = async () => {
    if (fields.length === 0) {
      toast("Place at least one field before sending", "warn");
      return;
    }
    setSaving(true);
    try {
      const payload = fields.map((f) => {
        const pageData = pages[f.page - 1];
        return {
          signer_id: f.signerId,
          type: f.type,
          page: f.page,
          x: (f.x / PLACEMENT_PAGE_WIDTH) * 100,
          y: (f.y / pageData.height) * 100,
          width: (f.width / PLACEMENT_PAGE_WIDTH) * 100,
          height: (f.height / pageData.height) * 100,
        };
      });

      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents/${doc.id}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: payload }),
      });
      if (!res.ok) throw new Error("Save fields failed");

      toast("Signature fields placed — document sent ✓", "success");
      onSaved && onSaved();
    } catch (e) {
      console.error("Save fields failed:", e);
      toast("Failed to save field placement", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Place signature fields"
      sub={doc.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            Close (finish later)
          </button>
          <button className="btn btn-p" onClick={finishAndSend} disabled={saving || loadingPdf}>
            {saving ? "Saving…" : "Finish & Send"}
          </button>
        </>
      }
    >
      {loadingPdf && (
        <div style={{ padding: 20, color: T.muted, fontSize: 12 }}>Rendering PDF…</div>
      )}

      {!loadingPdf && currentPageData && (
        <div style={{ display: "flex", gap: 14 }}>
          {/* Left toolbar */}
          <div style={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label className="fl">Placing for</label>
              <select
                className="fsel"
                value={activeSignerId}
                onChange={(e) => setActiveSignerId(e.target.value)}
                style={{ width: "100%" }}
              >
                {(doc.signers || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-sm" onClick={() => addField("signature")}>
              ✍️ + Signature
            </button>
            <button className="btn btn-sm" onClick={() => addField("date")}>
              📅 + Date
            </button>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
              {fields.length} field{fields.length !== 1 ? "s" : ""} placed total
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
              {fields.map((f) => (
                <div
                  key={f.id}
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>
                    P{f.page} · {f.type} · {signerLabel(f.signerId)}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ padding: "1px 6px" }}
                    onClick={() => removeField(f.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Page + placement area */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
              {fieldsOnPage.map((f) => (
                <Rnd
                  key={f.id}
                  size={{ width: f.width, height: f.height }}
                  position={{ x: f.x, y: f.y }}
                  bounds="parent"
                  onDragStop={(e, d) => updateField(f.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) =>
                    updateField(f.id, {
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      x: pos.x,
                      y: pos.y,
                    })
                  }
                  style={{
                    border: "2px solid #f20785",
                    background: "rgba(242,7,133,.08)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#f20785",
                    fontWeight: 600,
                    textAlign: "center",
                    padding: 2,
                  }}
                >
                  {f.type === "signature" ? "✍️ Signature" : "📅 Date"}
                  <br />
                  {signerLabel(f.signerId)}
                </Rnd>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

'''

src = src.replace(component_anchor, placement_component + component_anchor, 1)

# ── 3. Replace the placement stub with real FieldPlacementScreen usage ───────
stub_anchor = (
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
)

count = src.count(stub_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the placement stub block, found {count}. Aborting.")
    sys.exit(1)

new_usage = (
    '      {placementDoc && (\n'
    '        <FieldPlacementScreen\n'
    '          doc={placementDoc}\n'
    '          pdfFile={pdfFile}\n'
    '          onClose={() => setPlacementDoc(null)}\n'
    '          onSaved={() => {\n'
    '            setPlacementDoc(null);\n'
    '            loadDocuments();\n'
    '          }}\n'
    '          toast={toast}\n'
    '          getToken={getToken}\n'
    '        />\n'
    '      )}\n'
)

src = src.replace(stub_anchor, new_usage, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — FieldPlacementScreen added and wired in place of the stub.")
print("Next: npm run build")
