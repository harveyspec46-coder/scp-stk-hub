#!/usr/bin/env python3
"""
Adds a client-side signed-PDF export: renders each page, draws every filled
field (signature image or date text) at its stored position, and exports
via jsPDF. Wires this to the "PDF" button shown on completed documents.
Run from ~/scp-final. Usage: python3 apply_signed_pdf_export.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Add jsPDF import next to the react-rnd import ──────────────────────────
anchor_import = 'import { Rnd } from "react-rnd";\n'
count = src.count(anchor_import)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the react-rnd import, found {count}. Aborting.")
    sys.exit(1)

src = src.replace(anchor_import, anchor_import + 'import jsPDF from "jspdf";\n', 1)

# ── 2. Add exportSignedPdf helper function, right after PLACEMENT_PAGE_WIDTH ──
anchor_const = 'const PLACEMENT_PAGE_WIDTH = 600;\n'
count2 = src.count(anchor_const)
if count2 != 1:
    print(f"ERROR: expected exactly 1 occurrence of the PLACEMENT_PAGE_WIDTH const, found {count2}. Aborting.")
    sys.exit(1)

export_fn = '''
// ── Export a signed PDF client-side: render every page, draw each filled
// field (signature image or date text) at its stored position, output via
// jsPDF. This avoids needing any server-side PDF library — everything here
// reuses the same pdf.js rendering already proven in the placement/signing
// screens. ────────────────────────────────────────────────────────────────
async function exportSignedPdf(doc, toast) {
  try {
    const pdf = await pdfjsLib.getDocument({ url: doc.source_file_url }).promise;

    const token = await (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    })();
    const fieldsRes = await fetch(
      `${import.meta.env.VITE_API_URL}/api/esign/documents/${doc.id}/fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const fieldsJson = await fieldsRes.json();
    const allFields = fieldsJson.data || [];

    let outPdf = null;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 }); // render at 2x for crisper output
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Draw each filled field belonging to this page on top of the canvas
      const fieldsOnPage = allFields.filter((f) => f.page === i && f.filled);
      for (const f of fieldsOnPage) {
        const left = (f.x / 100) * canvas.width;
        const top = (f.y / 100) * canvas.height;
        const width = (f.width / 100) * canvas.width;
        const height = (f.height / 100) * canvas.height;

        if (f.type === "signature" && f.filled_value) {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = f.filled_value;
          });
          ctx.drawImage(img, left, top, width, height);
        } else if (f.type === "date" && f.filled_value) {
          ctx.fillStyle = "#000000";
          ctx.font = `${Math.round(height * 0.7)}px sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(f.filled_value, left, top + height / 2);
        }
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pageWidthPt = viewport.width / 2; // undo the 2x render scale for PDF point size
      const pageHeightPt = viewport.height / 2;

      if (!outPdf) {
        outPdf = new jsPDF({
          orientation: pageWidthPt > pageHeightPt ? "landscape" : "portrait",
          unit: "pt",
          format: [pageWidthPt, pageHeightPt],
        });
      } else {
        outPdf.addPage([pageWidthPt, pageHeightPt]);
      }
      outPdf.addImage(imgData, "JPEG", 0, 0, pageWidthPt, pageHeightPt);
    }

    outPdf.save(`${doc.name || "signed-document"}.pdf`);
  } catch (e) {
    console.error("Export signed PDF failed:", e);
    toast("Failed to export signed PDF", "error");
  }
}

'''

src = src.replace(anchor_const, anchor_const + export_fn, 1)

# ── 3. Wire the "PDF" button (allSigned case) to call exportSignedPdf ────────
old_button = (
    '              {allSigned && (\n'
    '                <button\n'
    '                  className="btn btn-sm"\n'
    '                  style={{ marginLeft: 6 }}\n'
    '                  onClick={(e) => {\n'
    '                    e.stopPropagation();\n'
    '                    toast("Download — PDF export via backend in Phase 1");\n'
    '                  }}\n'
    '                >\n'
    '                  📄 PDF\n'
    '                </button>\n'
    '              )}\n'
)

count3 = src.count(old_button)
if count3 != 1:
    print(f"ERROR: expected exactly 1 occurrence of the old PDF button, found {count3}. Aborting.")
    sys.exit(1)

new_button = (
    '              {allSigned && (\n'
    '                <button\n'
    '                  className="btn btn-sm"\n'
    '                  style={{ marginLeft: 6 }}\n'
    '                  onClick={(e) => {\n'
    '                    e.stopPropagation();\n'
    '                    toast("Preparing signed PDF…");\n'
    '                    exportSignedPdf(doc, toast);\n'
    '                  }}\n'
    '                >\n'
    '                  📄 PDF\n'
    '                </button>\n'
    '              )}\n'
)

src = src.replace(old_button, new_button, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — signed PDF export wired to the PDF button on completed documents.")
print("Next: npm run build")
