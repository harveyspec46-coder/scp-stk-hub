#!/usr/bin/env python3
"""
Adds "My Signature" setup (type name -> pick cursive style -> save) to the
E-Signatures page.
Run from ~/scp-final. Usage: python3 apply_my_signature_frontend.py
"""
import re
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Extend the existing Google Fonts @import with cursive signature fonts ─
font_import_pattern = re.compile(
    r"@import url\('https://fonts\.googleapis\.com/css2\?family=DM\+Serif\+Display:ital@0;1&family=DM\+Sans:opsz,wght@9\.\.40,300;9\.\.40,400;9\.\.40,500;9\.\.40,600&display=swap'\);"
)
matches = font_import_pattern.findall(src)
if len(matches) != 1:
    print(f"ERROR: expected exactly 1 occurrence of the existing font @import line, found {len(matches)}. Aborting — no changes made.")
    sys.exit(1)

new_import = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Dancing+Script:wght@500;700&family=Sacramento&family=Great+Vibes&family=Pacifico&display=swap');"
src = font_import_pattern.sub(new_import, src, count=1)

# ── 2. Insert MySignatureSetup component before the ESignatures page comment ─
anchor = '// ── Main E-Signatures page ────────────────────────────────────────────────────\nfunction ESignatures({ toast, user }) {'
count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the ESignatures function anchor, found {count}. Aborting.")
    sys.exit(1)

signature_component = '''// ── My Signature setup (type name -> pick cursive style -> save) ─────────────
const SIGNATURE_FONTS = [
  { key: "dancing", label: "Dancing Script", family: "'Dancing Script', cursive" },
  { key: "sacramento", label: "Sacramento", family: "'Sacramento', cursive" },
  { key: "vibes", label: "Great Vibes", family: "'Great Vibes', cursive" },
  { key: "pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
];

function renderSignatureImage(name, fontFamily) {
  const width = 420;
  const height = 140;
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f20785";
  ctx.font = `48px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, width / 2, height / 2);
  return canvas.toDataURL("image/png");
}

function MySignatureSetup({ user, existing, onClose, onSaved, toast }) {
  const [name, setName] = useState(existing?.full_name || user?.name || "");
  const [selected, setSelected] = useState(existing?.font_style || SIGNATURE_FONTS[0].key);
  const [saving, setSaving] = useState(false);

  const selectedFont = SIGNATURE_FONTS.find((f) => f.key === selected) || SIGNATURE_FONTS[0];

  const save = async () => {
    if (!name.trim()) {
      toast("Enter your name first", "warn");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const signatureImage = renderSignatureImage(name.trim(), selectedFont.family);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/my-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: name.trim(),
          font_style: selectedFont.key,
          signature_image: signatureImage,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      toast("Signature saved ✓", "success");
      onSaved && onSaved(json.data);
      onClose();
    } catch (e) {
      toast("Failed to save signature", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Set up your signature"
      sub="Type your name and pick a style — this will be used on every document you sign"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save signature"}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Full name</label>
        <input
          className="fi2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daniyal Siddiqui"
        />
      </div>

      <div className="ff">
        <label className="fl">Choose a style</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          {SIGNATURE_FONTS.map((f) => (
            <div
              key={f.key}
              onClick={() => setSelected(f.key)}
              style={{
                border: `2px solid ${selected === f.key ? "#f20785" : "var(--border)"}`,
                borderRadius: 8,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: selected === f.key ? "rgba(242,7,133,.06)" : "transparent",
                transition: "border-color .13s",
              }}
            >
              <span
                style={{
                  fontFamily: f.family,
                  fontSize: 28,
                  color: "#f20785",
                  lineHeight: 1,
                }}
              >
                {name.trim() || "Your name"}
              </span>
              {selected === f.key && <span style={{ fontSize: 16 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

'''

src = src.replace(anchor, signature_component + anchor, 1)

# ── 3. Wire into ESignatures: fetch on mount + banner + button ───────────────
# 3a. Add state right after pdfFile state (added in Stage 1 fix)
state_anchor = '  const [pdfFile, setPdfFile] = useState(null);\n'
count = src.count(state_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the pdfFile state line (from the earlier Stage 1 fix), found {count}. Aborting.")
    sys.exit(1)

new_state = (
    state_anchor
    + '  const [mySignature, setMySignature] = useState(null);\n'
    + '  const [sigSetupOpen, setSigSetupOpen] = useState(false);\n'
    + '  const [sigLoading, setSigLoading] = useState(true);\n\n'
    + '  useEffect(() => {\n'
    + '    (async () => {\n'
    + '      try {\n'
    + '        const token = await getToken();\n'
    + '        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/my-signature`, {\n'
    + '          headers: { Authorization: `Bearer ${token}` },\n'
    + '        });\n'
    + '        const json = await res.json();\n'
    + '        setMySignature(json.data || null);\n'
    + '      } catch (e) {\n'
    + '        /* silent — banner just stays in "set up" state */\n'
    + '      } finally {\n'
    + '        setSigLoading(false);\n'
    + '      }\n'
    + '    })();\n'
    + '  }, []);\n'
)
src = src.replace(state_anchor, new_state, 1)

# 3b. Insert the modal render + banner right after the sendModal block closes,
# using the myPendingDocs alert block as the anchor (unique, comes right after).
banner_anchor = '      {/* Awaiting your signature alert */}'
count = src.count(banner_anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the 'Awaiting your signature alert' comment, found {count}. Aborting.")
    sys.exit(1)

signature_banner = '''      {sigSetupOpen && (
        <MySignatureSetup
          user={user}
          existing={mySignature}
          onClose={() => setSigSetupOpen(false)}
          onSaved={(sig) => setMySignature(sig)}
          toast={toast}
        />
      )}

      {!sigLoading && !mySignature && (
        <div
          style={{
            background: "rgba(34,211,160,.06)",
            border: "1px solid rgba(34,211,160,.25)",
            borderRadius: "var(--r)",
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>✍️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
              Set up your signature to start signing documents
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              Takes a few seconds — type your name and pick a style
            </div>
          </div>
          <button className="btn btn-sm btn-p" onClick={() => setSigSetupOpen(true)}>
            Set up now
          </button>
        </div>
      )}

      {!sigLoading && mySignature && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            fontSize: 11,
            color: T.muted,
          }}
        >
          <span style={{ color: T.green }}>✓ Signature ready</span>
          <button
            className="btn btn-sm"
            onClick={() => setSigSetupOpen(true)}
            style={{ padding: "2px 8px" }}
          >
            Edit signature
          </button>
        </div>
      )}

''' + banner_anchor

src = src.replace(banner_anchor, signature_banner, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — My Signature setup added: fonts, modal component, and banner wired into ESignatures.")
print("Next: npm run build")
