#!/usr/bin/env python3
"""
Fixes FieldPlacementScreen's PDF-render effect getting stuck on "Rendering
PDF..." forever when an error occurs mid-render, by wrapping it in
try/catch/finally and logging the real error to console.
Run from ~/scp-final. Usage: python3 fix_placement_pdf_stuck.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

old_effect = (
    '  useEffect(() => {\n'
    '    if (!pdfFile) {\n'
    '      setLoadingPdf(false);\n'
    '      return;\n'
    '    }\n'
    '    let cancelled = false;\n'
    '    (async () => {\n'
    '      const buf = await pdfFile.arrayBuffer();\n'
    '      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;\n'
    '      const out = [];\n'
    '      for (let i = 1; i <= pdf.numPages; i++) {\n'
    '        const page = await pdf.getPage(i);\n'
    '        const unscaled = page.getViewport({ scale: 1 });\n'
    '        const scale = PLACEMENT_PAGE_WIDTH / unscaled.width;\n'
    '        const viewport = page.getViewport({ scale });\n'
    '        const canvas = document.createElement("canvas");\n'
    '        canvas.width = viewport.width;\n'
    '        canvas.height = viewport.height;\n'
    '        const ctx = canvas.getContext("2d");\n'
    '        await page.render({ canvasContext: ctx, viewport }).promise;\n'
    '        out.push({ dataUrl: canvas.toDataURL("image/png"), width: viewport.width, height: viewport.height });\n'
    '      }\n'
    '      if (!cancelled) {\n'
    '        setPages(out);\n'
    '        setLoadingPdf(false);\n'
    '      }\n'
    '    })();\n'
    '    return () => {\n'
    '      cancelled = true;\n'
    '    };\n'
    '  }, [pdfFile]);\n'
)

count = src.count(old_effect)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the FieldPlacementScreen render effect, found {count}. Aborting.")
    sys.exit(1)

new_effect = (
    '  useEffect(() => {\n'
    '    if (!pdfFile) {\n'
    '      setLoadingPdf(false);\n'
    '      return;\n'
    '    }\n'
    '    let cancelled = false;\n'
    '    (async () => {\n'
    '      try {\n'
    '        const buf = await pdfFile.arrayBuffer();\n'
    '        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;\n'
    '        const out = [];\n'
    '        for (let i = 1; i <= pdf.numPages; i++) {\n'
    '          const page = await pdf.getPage(i);\n'
    '          const unscaled = page.getViewport({ scale: 1 });\n'
    '          const scale = PLACEMENT_PAGE_WIDTH / unscaled.width;\n'
    '          const viewport = page.getViewport({ scale });\n'
    '          const canvas = document.createElement("canvas");\n'
    '          canvas.width = viewport.width;\n'
    '          canvas.height = viewport.height;\n'
    '          const ctx = canvas.getContext("2d");\n'
    '          await page.render({ canvasContext: ctx, viewport }).promise;\n'
    '          out.push({ dataUrl: canvas.toDataURL("image/png"), width: viewport.width, height: viewport.height });\n'
    '        }\n'
    '        if (!cancelled) setPages(out);\n'
    '      } catch (e) {\n'
    '        console.error("Failed to render PDF for placement:", e);\n'
    '        if (!cancelled) toast("Failed to render PDF", "error");\n'
    '      } finally {\n'
    '        if (!cancelled) setLoadingPdf(false);\n'
    '      }\n'
    '    })();\n'
    '    return () => {\n'
    '      cancelled = true;\n'
    '    };\n'
    '  }, [pdfFile]);\n'
)

src = src.replace(old_effect, new_effect, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — FieldPlacementScreen render effect now has proper error handling.")
print("Next: npm run build, push, reproduce, and check the Console tab for the real error.")
