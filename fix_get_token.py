#!/usr/bin/env python3
"""
Fixes "getToken is not defined" by adding a local getToken function inside
ESignatures (matching the pattern used elsewhere in the app) and passing it
down into MySignatureSetup as a prop.
Run from ~/scp-final. Usage: python3 fix_get_token.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# ── 1. Add local getToken() inside ESignatures, right after the mySignature
#      fetch useEffect block we added earlier ─────────────────────────────────
anchor = '''  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/my-signature`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setMySignature(json.data || null);
      } catch (e) {
        /* silent — banner just stays in "set up" state */
      } finally {
        setSigLoading(false);
      }
    })();
  }, []);
'''

count = src.count(anchor)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the my-signature useEffect block, found {count}. Aborting.")
    sys.exit(1)

new_block = '''  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

''' + anchor

src = src.replace(anchor, new_block, 1)

# ── 2. Pass getToken down into MySignatureSetup as a prop ────────────────────
old_usage = '''      {sigSetupOpen && (
        <MySignatureSetup
          user={user}
          existing={mySignature}
          onClose={() => setSigSetupOpen(false)}
          onSaved={(sig) => setMySignature(sig)}
          toast={toast}
        />
      )}'''

count = src.count(old_usage)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the MySignatureSetup usage block, found {count}. Aborting.")
    sys.exit(1)

new_usage = '''      {sigSetupOpen && (
        <MySignatureSetup
          user={user}
          existing={mySignature}
          onClose={() => setSigSetupOpen(false)}
          onSaved={(sig) => setMySignature(sig)}
          toast={toast}
          getToken={getToken}
        />
      )}'''

src = src.replace(old_usage, new_usage, 1)

# ── 3. Update MySignatureSetup's function signature to accept getToken prop ──
old_sig = 'function MySignatureSetup({ user, existing, onClose, onSaved, toast }) {'
count = src.count(old_sig)
if count != 1:
    print(f"ERROR: expected exactly 1 occurrence of the MySignatureSetup function signature, found {count}. Aborting.")
    sys.exit(1)

new_sig = 'function MySignatureSetup({ user, existing, onClose, onSaved, toast, getToken }) {'
src = src.replace(old_sig, new_sig, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success — getToken defined locally in ESignatures and passed into MySignatureSetup.")
print("Next: npm run build")
