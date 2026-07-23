#!/usr/bin/env python3
"""
Adds "Committees" to BOARD_NAV (under Operations, board-only since it's not
in STAFF_NAV at all) and wires the render switch case.
Run from ~/scp-final. Usage: python3 apply_committees_nav.py
"""
import sys

PATH = "src/App.jsx"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
original = src

nav_anchor = (
    '  {\n'
    '    key: "finance",\n'
    '    label: "Finance & Payroll",\n'
    '    icon: "\U0001F4B0",\n'
    '    section: "Operations",\n'
    '    adminOnly: true,\n'
    '  },\n'
)

count1 = src.count(nav_anchor)
if count1 != 1:
    print("ERROR: expected exactly 1 occurrence of the finance nav entry, found " + str(count1) + ". Aborting.")
    sys.exit(1)

new_nav_entry = (
    '  {\n'
    '    key: "committees",\n'
    '    label: "Committees",\n'
    '    icon: "\U0001F465",\n'
    '    section: "Operations",\n'
    '  },\n'
)

src = src.replace(nav_anchor, nav_anchor + new_nav_entry, 1)

switch_anchor = (
    '      case "esignatures":\n'
    '        return <ESignatures {...p} />;\n'
)

count2 = src.count(switch_anchor)
if count2 != 1:
    print("ERROR: expected exactly 1 occurrence of the esignatures switch case, found " + str(count2) + ". Aborting.")
    sys.exit(1)

new_case = (
    '      case "committees":\n'
    '        return <Committees {...p} />;\n'
)

src = src.replace(switch_anchor, switch_anchor + new_case, 1)

if src == original:
    print("ERROR: no changes made (unexpected). Aborting.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("Success -- Committees nav entry and render case added.")
print("Note: the <Committees /> component itself doesn't exist yet -- that's next.")
