#!/usr/bin/env python3
"""
Stage 1: PDF upload + pdf.js rendering for E-Signatures.
Run this from inside ~/scp-final (the frontend repo root).
Usage: python3 apply_stage1_pdf.py
"""
import re
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

original = src

# ── Insert 1: PdfPageImages component, right before the ESignatures comment ──
anchor1 = '// ── Main E-Signatures page ────────────────────────────────────────────────────\nfunction ESignatures({ toast, user }) {'

if anchor1 not in src:
    print("ERROR: Could not find anchor 1 (ESignatures function header). Aborting — no changes made.")
    sys.exit(1)

component_block = '''// ── PDF page renderer (pdf.js) ────────────────────────────────────────────────
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PdfPageImages({ file, onPagesRendered }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setImages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const pageImages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        pageImages.push({
          dataUrl: canvas.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
        });
      }
      if (!cancelled) {
        setImages(pageImages);
        onPagesRendered && onPagesRendered(pageImages);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) return null;
  if (loading)
    return (
      <div style={{ padding: 20, color: T.muted, fontSize: 12 }}>
        Rendering PDF…
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            border: "1px solid var(--border)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <img src={img.dataUrl} alt={`Page ${i + 1}`} style={{ width: "100%", display: "block" }} />
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,.6)",
              color: "#fff",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Page {i + 1} / {images.length}
          </div>
        </div>
      ))}
    </div>
  );
}

'''

src = src.replace(anchor1, component_block + anchor1, 1)

# ── Insert 2: pdfFile state, right after docs state ───────────────────────────
anchor2 = '  const [docs, setDocs] = useState([]);\n'
if anchor2 not in src:
    print("ERROR: Could not find anchor 2 (docs state line). Aborting — reverting.")
    sys.exit(1)

src = src.replace(
    anchor2,
    anchor2 + '  const [pdfFile, setPdfFile] = useState(null);\n',
    1,
)

# ── Insert 3: upload field, right before "Document name" field ───────────────
anchor3 = '          <div className="ff">\n            <label className="fl">Document name</label>'
if anchor3 not in src:
    print("ERROR: Could not find anchor 3 (Document name field). Aborting — reverting.")
    sys.exit(1)

upload_block = '''          <div className="ff">
            <label className="fl">Upload PDF document</label>
            <input
              type="file"
              accept="application/pdf"
              className="fi2"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            {pdfFile && (
              <div className="fhint">
                {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
          <PdfPageImages file={pdfFile} />
'''

src = src.replace(anchor3, upload_block + anchor3, 1)

if src == original:
    print("ERROR: No changes were made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — all 3 insertions applied to", PATH)
print("Next: run `npm install pdfjs-dist react-rnd` then `npm run build` to verify.")
