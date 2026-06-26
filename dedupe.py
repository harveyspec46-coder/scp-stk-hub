#!/usr/bin/env python3
path = "src/App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

block = '''  useEffect(() => {
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
  }, []);
'''

count = content.count(block)
print(f"Found {count} occurrence(s) of the block.")

if count == 2:
    # Replace the double occurrence with a single one
    content = content.replace(block + block, block, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Removed the duplicate. File saved.")
elif count == 1:
    print("Only one copy found — nothing to do.")
else:
    print("Unexpected count — please check manually, no changes made.")
