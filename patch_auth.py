#!/usr/bin/env python3
"""
Automatically patches src/App.jsx with real Supabase auth.
Run from inside the scp-final folder: python3 patch_auth.py
"""

import re

path = "src/App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

changed = 0

# 1) Fix import capitalization (in case it's lowercase)
new_content = content.replace(
    'import { supabase } from "./supabaseclient";',
    'import { supabase } from "./supabaseClient";'
)
if new_content != content:
    changed += 1
content = new_content

# 2) Replace handleLogin
old_login = '''  const handleLogin = async () => {
    setLErr(""); setLLoad(true);
    await new Promise(r => setTimeout(r, 750));
    if (!lEmail || !lPass) { setLErr("Please enter your email and password."); setLLoad(false); return; }
    const name = lEmail.split("@")[0].split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    // Placeholder until Supabase auth is wired (see backend README): role is
    // simulated from the email domain only. Once connected, the real role,
    // office, and display_id come back from `users` via the admin_allowlist
    // + handle_new_user() trigger — admins on that allowlist are recognized
    // automatically the moment they sign up, no hardcoding needed here.
    if (isSCP(lEmail)) {
      onAuth({ name, email: lEmail, role:"manager", uid:"", office:"north" });
    } else {
      onAuth({ name, email: lEmail, role:"staff", uid:"", office:"south" });
    }
    setLLoad(false);
  };'''

new_login = '''  const handleLogin = async () => {
    setLErr(""); setLLoad(true);
    if (!lEmail || !lPass) { setLErr("Please enter your email and password."); setLLoad(false); return; }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: lEmail,
      password: lPass,
    });

    if (error) { setLErr(error.message); setLLoad(false); return; }

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("full_name, role, office, display_id")
      .eq("id", data.user.id)
      .single();

    if (profileErr) {
      setLErr("Logged in, but couldn't load your profile. Try again shortly.");
      setLLoad(false);
      return;
    }

    onAuth({
      id: data.user.id,
      name: profile.full_name,
      email: data.user.email,
      role: profile.role,
      office: profile.office,
      uid: profile.display_id || "",
    });
    setLLoad(false);
  };'''

if old_login in content:
    content = content.replace(old_login, new_login)
    changed += 1
else:
    print("WARNING: handleLogin block not found exactly — skipped. Check manually.")

# 3) Replace handleSignup
old_signup = '''  const handleSignup = async () => {
    setSErr("");
    if (!sName.trim())         { setSErr("Full name is required."); return; }
    if (!domainTyped)          { setSErr("Enter a valid email address."); return; }
    if (!sRole)                { setSErr("Please select a role."); return; }
    if (sRole !== "staff" && !scpEmail) { setSErr(`${sRole.charAt(0).toUpperCase()+sRole.slice(1)} role requires an @${SCP_DOMAIN} email.`); return; }
    if (sRole === "staff" && scpEmail)  { setSErr("SCP email accounts must be Admin or Manager. Use a personal email for Staff."); return; }
    if (sPass.length < 8)      { setSErr("Password must be at least 8 characters."); return; }
    if (sPass !== sPass2)      { setSErr("Passwords do not match."); return; }
    setSLoad(true);
    await new Promise(r => setTimeout(r, 900));
    setSLoad(false);
    setSOk(true);
  };'''

new_signup = '''  const handleSignup = async () => {
    setSErr("");
    if (!sName.trim())         { setSErr("Full name is required."); return; }
    if (!domainTyped)          { setSErr("Enter a valid email address."); return; }
    if (!sRole)                { setSErr("Please select a role."); return; }
    if (sRole !== "staff" && !scpEmail) { setSErr(`${sRole.charAt(0).toUpperCase()+sRole.slice(1)} role requires an @${SCP_DOMAIN} email.`); return; }
    if (sRole === "staff" && scpEmail)  { setSErr("SCP email accounts must be Admin or Manager. Use a personal email for Staff."); return; }
    if (sPass.length < 8)      { setSErr("Password must be at least 8 characters."); return; }
    if (sPass !== sPass2)      { setSErr("Passwords do not match."); return; }

    setSLoad(true);

    const { data, error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPass,
      options: { data: { full_name: sName } },
    });

    if (error) { setSErr(error.message); setSLoad(false); return; }

    setSLoad(false);
    setSOk(true);
  };'''

if old_signup in content:
    content = content.replace(old_signup, new_signup)
    changed += 1
else:
    print("WARNING: handleSignup block not found exactly — skipped. Check manually.")

# 4) Replace handleLogout in root App()
old_logout = "  const handleLogout = () => setUser(null);"
new_logout = '''  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };'''

if old_logout in content:
    content = content.replace(old_logout, new_logout)
    changed += 1
else:
    print("WARNING: handleLogout line not found exactly — skipped. Check manually.")

# 5) Add session-restore useEffect right after `const handleAuth = (userData) => setUser(userData);`
anchor = "  const handleAuth = (userData) => setUser(userData);"
session_effect = '''  const handleAuth = (userData) => setUser(userData);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("users")
        .select("full_name, role, office, display_id")
        .eq("id", data.session.user.id)
        .single();
      if (profile) {
        setUser({
          id: data.session.user.id,
          name: profile.full_name,
          email: data.session.user.email,
          role: profile.role,
          office: profile.office,
          uid: profile.display_id || "",
        });
      }
    });
  }, []);'''

if anchor in content:
    content = content.replace(anchor, session_effect, 1)
    changed += 1
else:
    print("WARNING: handleAuth anchor not found exactly — skipped. Check manually.")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nDone. {changed}/5 patches applied successfully.")
print("If any WARNING appeared above, that specific piece needs manual review.")
