import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = "daniyal@scproject17.onmicrosoft.com";

// Fetch the user profile from public.users and build the app user object
async function fetchUserProfile(authUser, accessToken) {
  const headers = {
    "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=id,full_name,role,office,active,display_id&id=eq.${authUser.id}&limit=1`,
    { headers }
  );
  const rows = await res.json();
  if (!res.ok) return null;
  if (!rows || rows.length === 0) return null;
  const data = rows[0];
  const email = authUser.email.toLowerCase();
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  return {
    id: data.id,
    name: data.full_name,
    email: authUser.email,
    role: data.role,
    superAdmin: isSuperAdmin,
    office: data.office,
    active: data.active,
    displayId: data.display_id || "",
  };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SCP_DOMAIN = "scproject17.onmicrosoft.com";
const T = {
  pink: "#f20785",
  pink2: "#c4006a",
  black: "#08080d",
  dark: "#0e0e16",
  card: "#13131d",
  card2: "#181825",
  border: "#252535",
  border2: "#32324a",
  muted: "#6e6e8a",
  sub: "#9898b8",
  text: "#e2e2f0",
  white: "#ffffff",
  green: "#22d3a0",
  amber: "#f59e0b",
  red: "#f43f5e",
  blue: "#818cf8",
  purple: "#a78bfa",
};


// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Dancing+Script:wght@500;700&family=Sacramento&family=Great+Vibes&family=Pacifico&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --p:#f20785;--p2:#c4006a;--bl:#08080d;--dk:#0e0e16;--cd:#13131d;--cd2:#181825;
  --br:#252535;--br2:#32324a;--mu:#6e6e8a;--su:#9898b8;--tx:#e2e2f0;
  --gn:#22d3a0;--am:#f59e0b;--rd:#f43f5e;--bu:#818cf8;--pu:#a78bfa;
  --fd:'DM Serif Display',Georgia,serif;--fb:'DM Sans',system-ui,sans-serif;
  --r:8px;--rl:14px;--rxl:20px;--sw:238px;--th:52px;
}
html,body,#root{height:100%;height:-webkit-fill-available;background:var(--bl);color:var(--tx);font-family:var(--fb);font-size:13px;line-height:1.5;}html{height:-webkit-fill-available;}
::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:var(--br2);border-radius:2px;}
input,select,textarea,button{font-family:var(--fb);}button{cursor:pointer;}a{color:inherit;}

/* AUTH */
.auth-bg{min-height:100vh;min-height:-webkit-fill-available;display:flex;align-items:center;justify-content:center;background:var(--bl);overflow-y:auto;
  background-image:radial-gradient(ellipse 700px 500px at 65% 10%,rgba(242,7,133,.11) 0%,transparent 65%),
  radial-gradient(ellipse 400px 300px at 20% 90%,rgba(196,0,106,.07) 0%,transparent 65%);}
.auth-card{width:430px;background:var(--cd);border:1px solid var(--br);border-radius:var(--rxl);padding:40px 36px;position:relative;overflow:hidden;}
.auth-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--p),transparent);}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
.auth-mark{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--p2),var(--p));display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:16px;color:#fff;flex-shrink:0;}
.auth-name{font-family:var(--fd);font-size:20px;color:#fff;line-height:1.1;}
.auth-name span{color:var(--p);}
.auth-org{font-size:11px;color:var(--mu);}
.auth-tabs{display:flex;border-bottom:1px solid var(--br);margin-bottom:22px;}
.auth-tab{flex:1;padding:8px 4px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--mu);font-size:12px;font-weight:500;font-family:var(--fb);cursor:pointer;transition:all .14s;}
.auth-tab.active{color:#fff;border-bottom-color:var(--p);font-weight:700;}
.auth-lbl{display:block;font-size:10px;font-weight:700;color:var(--su);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;}
.auth-inp{width:100%;background:var(--dk);border:1px solid var(--br);border-radius:var(--r);padding:9px 12px;color:var(--tx);font-size:13px;outline:none;transition:border-color .18s;}
.auth-inp:focus{border-color:var(--p);}
.auth-inp.valid{border-color:var(--gn);}
.auth-inp.invalid{border-color:var(--rd);}
.auth-field{margin-bottom:14px;}
.domain-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:3px 9px;border-radius:20px;margin-top:5px;font-weight:500;}
.domain-scp{background:rgba(242,7,133,.12);color:#ff6ec7;}
.domain-ext{background:rgba(245,158,11,.12);color:#f59e0b;}
.role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:6px;}
.role-opt{padding:9px 6px;background:var(--dk);border:1px solid var(--br);border-radius:var(--r);color:var(--su);font-size:11px;font-weight:500;cursor:pointer;transition:all .14s;text-align:center;line-height:1.3;}
.role-opt:hover:not(:disabled){border-color:var(--br2);color:var(--tx);}
.role-opt.sel{border-color:var(--p);background:rgba(242,7,133,.1);color:#fff;font-weight:700;}
.role-opt:disabled{opacity:.25;cursor:not-allowed;}
.role-hint{font-size:9px;color:var(--mu);margin-top:3px;}
.role-opt.sel .role-hint{color:rgba(255,255,255,.5);}
.auth-btn{width:100%;padding:11px;margin-top:6px;background:linear-gradient(135deg,var(--p2),var(--p));border:none;border-radius:var(--r);color:#fff;font-weight:600;font-size:13px;cursor:pointer;transition:opacity .18s,transform .1s;letter-spacing:.02em;}
.auth-btn:hover{opacity:.9;}.auth-btn:active{transform:scale(.98);}.auth-btn:disabled{opacity:.45;cursor:not-allowed;}
.auth-msg-err{background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.3);border-radius:var(--r);padding:9px 12px;font-size:12px;color:var(--rd);margin-bottom:12px;line-height:1.6;}
.auth-msg-ok{background:rgba(34,211,160,.08);border:1px solid rgba(34,211,160,.3);border-radius:var(--r);padding:9px 12px;font-size:12px;color:var(--gn);margin-bottom:12px;line-height:1.6;}
.auth-note{margin-top:14px;font-size:11px;color:var(--mu);text-align:center;line-height:1.8;}
.auth-note .lnk{color:var(--p);cursor:pointer;text-decoration:underline;}
.id-pending-note{display:flex;align-items:flex-start;gap:8px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);border-radius:var(--r);padding:9px 12px;font-size:11px;color:var(--sub);line-height:1.6;margin-top:12px;}

/* SHELL */
.shell{display:flex;height:100vh;height:100dvh;overflow:hidden;}
.sidebar{width:var(--sw);flex-shrink:0;background:var(--dk);border-right:1px solid var(--br);display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;height:100%;height:100dvh;}
.sb-head{padding:15px 14px 12px;border-bottom:1px solid var(--br);display:flex;align-items:center;gap:9px;flex-shrink:0;}
.sb-mark{width:28px;height:28px;border-radius:7px;flex-shrink:0;background:linear-gradient(135deg,var(--p2),var(--p));display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:11px;color:#fff;}
.sb-appname{font-family:var(--fd);font-size:14px;color:#fff;line-height:1.1;}
.sb-appname span{color:var(--p);}
.sb-apporg{font-size:9px;color:var(--mu);margin-top:1px;}
.sb-user{padding:10px 14px;border-bottom:1px solid var(--br);flex-shrink:0;}
.sb-user-row{display:flex;align-items:center;gap:9px;margin-bottom:5px;}
.av{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--p2),var(--p));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;}
.av-md{width:36px;height:36px;font-size:12px;border-radius:9px;}
.sb-uname{font-size:12px;font-weight:600;color:var(--tx);}
.sb-urole{font-size:10px;color:var(--mu);}
.id-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:3px;letter-spacing:.02em;}
.id-adm{background:rgba(242,7,133,.15);color:#ff6ec7;}
.id-mgr{background:rgba(167,139,250,.15);color:var(--pu);}
.id-stf{background:rgba(245,158,11,.15);color:var(--am);}
.id-par{background:rgba(129,140,248,.15);color:var(--bu);}
.id-none{background:rgba(255,255,255,.06);color:var(--mu);}
.sb-nav{flex:1;padding:8px 0;overflow-y:auto;}
.sb-section{font-size:9px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.1em;padding:13px 14px 4px;}
.ni{display:flex;align-items:center;gap:9px;padding:9px 14px;font-size:12px;color:var(--su);cursor:pointer;border-left:2px solid transparent;transition:all .13s;user-select:none;}
.ni:hover{color:var(--tx);background:rgba(255,255,255,.025);}
.ni.on{color:#fff;border-left-color:var(--p);background:rgba(242,7,133,.08);font-weight:600;}
.ni-ic{width:16px;text-align:center;flex-shrink:0;opacity:.7;font-size:13px;}
.ni.on .ni-ic{opacity:1;}
.ni-badge{margin-left:auto;background:var(--p);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:9px;min-width:17px;text-align:center;}
.ni-new{margin-left:auto;font-size:9px;color:var(--p);font-weight:700;}
.sb-foot{padding:9px 12px;border-top:1px solid var(--br);flex-shrink:0;}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.topbar{height:var(--th);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0;background:var(--dk);position:relative;}
.topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(242,7,133,.28),transparent);}
.tb-title{font-size:14px;font-weight:700;color:#fff;}
.tb-right{display:flex;gap:7px;align-items:center;}
.page-body{flex:1;overflow-y:auto;padding:20px;-webkit-overflow-scrolling:touch;}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;font-size:12px;font-weight:500;border:1px solid var(--br2);border-radius:var(--r);background:transparent;color:var(--tx);transition:all .13s;min-height:36px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
.btn:hover{background:rgba(255,255,255,.05);border-color:var(--su);}
.btn:active{transform:scale(.97);}
.btn-p{background:var(--p);border-color:var(--p);color:#fff;font-weight:600;}
.btn-p:hover{background:var(--p2);border-color:var(--p2);}
.btn-g{background:rgba(34,211,160,.12);border-color:rgba(34,211,160,.3);color:var(--gn);}
.btn-g:hover{background:rgba(34,211,160,.2);}
.btn-ghost{border-color:transparent;color:var(--su);}
.btn-ghost:hover{color:var(--tx);background:rgba(255,255,255,.04);}
.btn-sm{padding:4px 9px;font-size:11px;}
.btn-xs{padding:2px 7px;font-size:10px;}

/* CARDS */
.card{background:var(--cd);border:1px solid var(--br);border-radius:var(--rl);padding:15px 17px;}
.card-hover{transition:border-color .13s,transform .13s;cursor:pointer;}
.card-hover:hover{border-color:var(--p);transform:translateY(-1px);}

/* TYPOGRAPHY HELPERS */
.page-title{font-family:var(--fd);font-size:20px;color:#fff;margin-bottom:3px;}
.page-sub{font-size:12px;color:var(--mu);margin-bottom:16px;}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sec-title{font-size:13px;font-weight:700;color:#fff;}
.divider{height:1px;background:var(--br);margin:11px 0;}

/* LAYOUT */
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;}
.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px;}
.sc{background:var(--cd);border:1px solid var(--br);border-radius:var(--rl);padding:15px 17px;position:relative;overflow:hidden;}
.sc::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(242,7,133,.07) 0%,transparent 70%);pointer-events:none;}
.sc-lbl{font-size:10px;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px;}
.sc-val{font-size:28px;font-weight:700;color:#fff;line-height:1;margin-bottom:4px;}
.sc-d{font-size:11px;color:var(--su);}
.sc-d.up{color:var(--gn);}

/* BADGES */
.badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;}
.b-p{background:rgba(242,7,133,.15);color:#ff6ec7;}
.b-g{background:rgba(34,211,160,.12);color:#22d3a0;}
.b-a{background:rgba(245,158,11,.12);color:#f59e0b;}
.b-r{background:rgba(244,63,94,.12);color:#f43f5e;}
.b-b{background:rgba(129,140,248,.12);color:#818cf8;}
.b-v{background:rgba(167,139,250,.12);color:#a78bfa;}
.b-gr{background:rgba(255,255,255,.07);color:var(--su);}
.off-n{background:rgba(129,140,248,.12);color:#818cf8;font-size:9px;padding:1px 6px;border-radius:20px;font-weight:600;}
.off-s{background:rgba(34,211,238,.12);color:#22d3ee;font-size:9px;padding:1px 6px;border-radius:20px;font-weight:600;}
.off-b{background:rgba(242,7,133,.1);color:#ff6ec7;font-size:9px;padding:1px 6px;border-radius:20px;font-weight:600;}

/* TABLES */
.tbl{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
thead tr{border-bottom:1px solid var(--br);}
th{font-size:10px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;padding:8px 11px;text-align:left;white-space:nowrap;}
td{padding:9px 11px;font-size:12px;color:var(--su);border-bottom:1px solid rgba(37,37,53,.7);}
tbody tr{transition:background .11s;cursor:pointer;}
tbody tr:hover td{background:rgba(255,255,255,.022);color:var(--tx);}
td.nm{color:var(--tx);font-weight:600;}
tr:last-child td{border-bottom:none;}

/* TABS */
.tabs{display:flex;border-bottom:1px solid var(--br);margin-bottom:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}.tabs::-webkit-scrollbar{display:none;}
.tab{padding:7px 12px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--mu);font-size:12px;font-weight:500;font-family:var(--fb);cursor:pointer;transition:all .13s;display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;}
.tab:hover{color:var(--tx);}
.tab.on{color:#fff;border-bottom-color:var(--p);font-weight:700;}
.tab-n{font-size:9px;background:rgba(255,255,255,.07);padding:1px 5px;border-radius:9px;color:var(--mu);}

/* FILTERS */
.frow{display:flex;gap:7px;margin-bottom:12px;align-items:center;flex-wrap:wrap;}.frow>.fi{min-width:0;}
.fi{background:var(--cd);border:1px solid var(--br);border-radius:var(--r);padding:6px 10px;color:var(--tx);font-size:12px;font-family:var(--fb);outline:none;transition:border-color .14s;}
.fi:focus{border-color:var(--p);}

/* MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .14s ease;}
.modal{background:var(--cd);border:1px solid var(--br2);border-radius:var(--rxl);width:520px;max-width:95vw;max-height:88vh;overflow-y:auto;animation:slideUp .17s ease;}
.modal-hdr{padding:16px 20px 13px;border-bottom:1px solid var(--br);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:0;background:var(--cd);z-index:1;}
.modal-t{font-size:15px;font-weight:700;color:#fff;}
.modal-s{font-size:11px;color:var(--mu);margin-top:2px;}
.modal-body{padding:16px 20px;}
.modal-foot{padding:12px 20px;border-top:1px solid var(--br);display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;position:sticky;bottom:0;background:var(--cd);}
.mclose{background:none;border:none;color:var(--mu);font-size:17px;line-height:1;padding:2px;}
.mclose:hover{color:var(--tx);}

/* FORMS */
.ff{margin-bottom:13px;}
.frow2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.fl{display:block;font-size:10px;font-weight:700;color:var(--su);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.fi2,.fsel,.ftxt{width:100%;background:var(--dk);border:1px solid var(--br);border-radius:var(--r);padding:8px 11px;color:var(--tx);font-size:12px;font-family:var(--fb);outline:none;transition:border-color .14s;}
.fi2:focus,.fsel:focus,.ftxt:focus{border-color:var(--p);}
.ftxt{resize:vertical;min-height:70px;}
.fhint{font-size:10px;color:var(--mu);margin-top:4px;}
.info-box{background:rgba(255,255,255,.03);border:1px solid var(--br);border-radius:var(--r);padding:9px 12px;font-size:11px;color:var(--su);line-height:1.7;}
.info-box.pink{background:rgba(242,7,133,.05);border-color:rgba(242,7,133,.2);}
.info-box.amber{background:rgba(245,158,11,.06);border-color:rgba(245,158,11,.2);}

/* AUTOCOMPLETE */
.ac-wrap{position:relative;}
.ac-list{position:absolute;top:100%;left:0;right:0;background:var(--cd2);border:1px solid var(--br2);border-radius:var(--r);z-index:50;max-height:160px;overflow-y:auto;margin-top:3px;}
.ac-item{padding:7px 11px;font-size:12px;color:var(--su);cursor:pointer;transition:background .11s;}
.ac-item:hover{background:rgba(255,255,255,.05);color:var(--tx);}

/* TAG INPUT */
.tag-wrap{display:flex;flex-wrap:wrap;gap:5px;padding:6px 8px;background:var(--dk);border:1px solid var(--br);border-radius:var(--r);min-height:38px;align-items:center;cursor:text;transition:border-color .14s;}
.tag-wrap:focus-within{border-color:var(--p);}
.tag-chip{display:inline-flex;align-items:center;gap:4px;background:rgba(242,7,133,.12);color:#ff6ec7;font-size:11px;padding:2px 7px;border-radius:20px;}
.tag-x{background:none;border:none;color:#ff6ec7;font-size:11px;padding:0;cursor:pointer;line-height:1;}
.tag-inp{background:transparent;border:none;outline:none;color:var(--tx);font-size:12px;font-family:var(--fb);min-width:80px;flex:1;}

/* KANBAN */
.kanban{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;}
.kb-col{background:var(--dk);border:1px solid var(--br);border-radius:var(--rl);overflow:hidden;}
.kb-hdr{padding:9px 11px 8px;border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;}
.kb-ht{font-size:10px;font-weight:700;color:var(--su);text-transform:uppercase;letter-spacing:.06em;}
.kb-n{font-size:9px;background:rgba(255,255,255,.07);color:var(--mu);padding:1px 6px;border-radius:8px;}
.kb-body{padding:7px;display:flex;flex-direction:column;gap:6px;min-height:80px;}
.kbc{background:var(--cd2);border:1px solid var(--br);border-radius:var(--r);padding:9px 10px;cursor:pointer;transition:all .13s;position:relative;overflow:hidden;}
.kbc::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--p);}
.kbc:hover{border-color:var(--p);transform:translateY(-1px);}
.kbc-t{font-size:12px;font-weight:600;color:#fff;margin-bottom:2px;}
.kbc-c{font-size:10px;color:var(--mu);margin-bottom:4px;}
.kbc-m{display:flex;gap:4px;flex-wrap:wrap;}

/* PROGRAMS GRID */
.prog-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;}
.prog-card{background:var(--cd);border:1px solid var(--br);border-radius:var(--rl);padding:13px;cursor:pointer;transition:all .13s;position:relative;overflow:hidden;}
.prog-card:hover{border-color:var(--p);transform:translateY(-1px);}
.prog-bar{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--p2),var(--p));}
.prog-icon{width:32px;height:32px;border-radius:9px;background:rgba(242,7,133,.12);display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:14px;}
.prog-name{font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;}
.prog-sub{font-size:10px;color:var(--mu);margin-bottom:8px;line-height:1.4;}
.prog-meta{display:flex;gap:4px;flex-wrap:wrap;}
.prog-tag{font-size:9px;color:var(--su);background:rgba(255,255,255,.05);padding:1px 6px;border-radius:20px;}

/* ACTIVITY FEED */
.act-feed{display:flex;flex-direction:column;gap:1px;}
.act-row{display:flex;align-items:flex-start;gap:9px;padding:7px 9px;border-radius:var(--r);transition:background .11s;cursor:pointer;}
.act-row:hover{background:rgba(255,255,255,.025);}
.act-ic{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;margin-top:1px;}
.act-text{font-size:12px;color:var(--tx);line-height:1.4;}
.act-time{font-size:10px;color:var(--mu);margin-top:1px;}

/* VOTE BARS */
.vbw{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
.vbl{font-size:10px;color:var(--mu);width:46px;}
.vbb{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden;}
.vbf{height:100%;border-radius:3px;transition:width .4s ease;}
.vbc{font-size:10px;color:var(--su);width:20px;text-align:right;}

/* FINANCE */
.fin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:16px;}
.fin-card{background:var(--cd);border:1px solid var(--br);border-radius:var(--rl);padding:13px 15px;text-align:center;}
.fin-val{font-size:20px;font-weight:700;color:#fff;margin:5px 0 2px;}
.fin-lbl{font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.04em;}

/* PROD RING */
.prod-ring{width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;background:conic-gradient(var(--p) var(--pct,0%),rgba(255,255,255,.07) var(--pct,0%));}
.prod-ring::before{content:'';position:absolute;inset:5px;border-radius:50%;background:var(--cd);}
.prod-ring-v{position:relative;z-index:1;font-size:11px;font-weight:700;color:#fff;}

/* NOTIFICATIONS */
.notif-row{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;border-radius:var(--r);background:var(--cd2);border:1px solid var(--br);cursor:pointer;margin-bottom:5px;transition:border-color .13s;}
.task-row-highlight{animation:taskFlash 2.5s ease-out;}
@keyframes taskFlash{0%{background:rgba(236,72,153,.25);}100%{background:transparent;}}
.notif-row:hover{border-color:var(--br2);}
.notif-row.unread{border-left:2px solid var(--p);}
.notif-dot{width:6px;height:6px;border-radius:50%;background:var(--p);flex-shrink:0;margin-top:4px;}

/* STAFF SHELL SPECIFIC */
.my-job-card{background:var(--cd);border:1px solid var(--br);border-radius:var(--rl);padding:14px 15px;margin-bottom:10px;position:relative;overflow:hidden;transition:border-color .13s;word-break:break-word;}
.my-job-card.active-job{border-color:rgba(34,211,160,.4);}
.my-job-card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--p);}
.my-job-card.active-job::before{background:var(--gn);}
.checkin-btn{width:100%;padding:11px;border:none;border-radius:var(--r);font-weight:700;font-size:13px;font-family:var(--fb);cursor:pointer;transition:all .2s;margin-top:10px;letter-spacing:.02em;}
.ci-in{background:linear-gradient(135deg,var(--p2),var(--p));color:#fff;}
.ci-in:hover{opacity:.9;}
.ci-out{background:rgba(34,211,160,.14);border:1px solid rgba(34,211,160,.4);color:var(--gn);}
.ci-out:hover{background:rgba(34,211,160,.22);}
.timer-display{font-size:28px;font-weight:700;color:var(--p);font-variant-numeric:tabular-nums;letter-spacing:.04em;margin:8px 0;}
.complete-modal-actions{display:flex;gap:8px;margin-top:10px;}

/* USERS & IDs */
.uid-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);border:1px solid var(--br);background:var(--cd2);margin-bottom:6px;transition:border-color .13s;}
.uid-row:hover{border-color:var(--br2);}
.uid-input{background:var(--dk);border:1px solid var(--br);border-radius:6px;padding:4px 8px;color:var(--tx);font-size:11px;font-family:var(--fb);outline:none;width:88px;font-weight:700;letter-spacing:.03em;}
.uid-input:focus{border-color:var(--p);}

/* GRANT PIPELINE */
.grant-pipe{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;}
.grant-col{background:var(--dk);border:1px solid var(--br);border-radius:var(--rl);overflow:hidden;}
.grant-col-h{padding:9px 11px;border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;}
.grant-col-t{font-size:10px;font-weight:700;color:var(--su);text-transform:uppercase;letter-spacing:.06em;}
.grant-col-body{padding:7px;display:flex;flex-direction:column;gap:6px;min-height:70px;}
.grant-card{background:var(--cd2);border:1px solid var(--br);border-radius:var(--r);padding:10px 11px;cursor:pointer;transition:border-color .13s;position:relative;overflow:hidden;}
.grant-card:hover{border-color:var(--gn);}

/* PARTICIPANT INTAKE MODES */
.mode-pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;}
.mode-digital{background:rgba(129,140,248,.12);color:var(--bu);}
.mode-physical{background:rgba(245,158,11,.12);color:var(--am);}
.mode-link{background:rgba(34,211,160,.12);color:var(--gn);}
.upload-zone{border:1px dashed var(--br2);border-radius:var(--rl);padding:22px;text-align:center;cursor:pointer;transition:all .14s;margin-bottom:11px;}
.upload-zone:hover{border-color:var(--p);background:rgba(242,7,133,.02);}

/* TOASTS */
.toast-wrap{position:fixed;bottom:18px;right:18px;z-index:500;display:flex;flex-direction:column;gap:6px;}
.toast{background:var(--cd2);border:1px solid var(--br2);border-left:3px solid var(--p);border-radius:var(--r);padding:9px 13px;min-width:230px;max-width:310px;font-size:12px;color:var(--tx);display:flex;align-items:center;gap:8px;animation:slideRight .18s ease;}
.toast.success{border-left-color:var(--gn);}
.toast.warn{border-left-color:var(--am);}
.toast.error{border-left-color:var(--rd);}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(11px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}

/* ── MOBILE SIDEBAR OVERLAY ── */
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;animation:fadeIn .18s ease;}
.hamburger{display:none;background:none;border:none;color:var(--tx);font-size:20px;line-height:1;padding:6px;cursor:pointer;flex-shrink:0;}
.sidebar-close{display:none;background:none;border:none;color:var(--mu);font-size:22px;padding:0 2px;cursor:pointer;margin-left:auto;}

/* ── BOTTOM NAV (mobile staff shell) ── */
.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--dk);border-top:1px solid var(--br);z-index:90;padding:0 4px env(safe-area-inset-bottom,0);}
.bottom-nav-inner{display:flex;align-items:stretch;}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px;font-size:9px;font-weight:500;color:var(--mu);cursor:pointer;transition:color .13s;border:none;background:none;font-family:var(--fb);position:relative;min-height:52px;}
.bn-item.on{color:var(--p);}
.bn-item span:first-child{font-size:19px;line-height:1;}
.bn-dot{position:absolute;top:6px;right:calc(50% - 12px);width:6px;height:6px;border-radius:50%;background:var(--p);}

/* ── RESPONSIVE TABLE WRAPPERS ── */
.tbl{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tbl table{min-width:520px;}

/* ── KANBAN MOBILE SCROLL ── */
.kanban-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;margin:0 -20px;padding-left:20px;padding-right:20px;}
.kanban{display:flex;gap:9px;min-width:max-content;}
.kb-col{width:200px;flex-shrink:0;}
.kb-col.drag-over{border-color:var(--p) !important;background:rgba(242,7,133,.05);}
.kbc[draggable]{cursor:grab;transition:opacity .15s,transform .15s;}
.kbc[draggable]:active{cursor:grabbing;}
.kbc.dragging{opacity:.35;transform:scale(.96);}

/* ── FORM ROWS STACK ON MOBILE ── */


/* ── E-SIGNATURE MODULE ── */
.esign-doc-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);background:var(--cd2);border:1px solid var(--br);margin-bottom:6px;cursor:pointer;transition:border-color .13s;}
.esign-doc-row:hover{border-color:var(--br2);}
.esign-doc-icon{width:34px;height:40px;border-radius:6px;background:var(--dk);border:1px solid var(--br2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.esign-doc-meta{flex:1;min-width:0;}
.esign-doc-name{font-size:13px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.esign-doc-sub{font-size:11px;color:var(--mu);margin-top:2px;}
.esign-status{display:flex;align-items:center;gap:5px;flex-shrink:0;}
.sign-canvas-wrap{border:1px solid var(--br2);border-radius:var(--r);background:rgba(255,255,255,.04);overflow:hidden;cursor:crosshair;position:relative;touch-action:none;}
.sign-canvas-label{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--mu);pointer-events:none;user-select:none;white-space:nowrap;}
.sign-slot{background:var(--cd2);border:1px dashed var(--br2);border-radius:var(--r);padding:11px 14px;display:flex;align-items:center;gap:10px;transition:border-color .13s;}
.sign-slot.completed{border-style:solid;border-color:rgba(34,211,160,.3);background:rgba(34,211,160,.05);}
.sign-slot.mine{border-color:rgba(242,7,133,.4);background:rgba(242,7,133,.04);}
.doc-preview{background:var(--dk);border:1px solid var(--br);border-radius:var(--r);padding:20px 22px;margin-bottom:14px;min-height:220px;font-size:12px;color:var(--su);line-height:1.8;}
.doc-preview h3{font-size:15px;font-weight:700;color:var(--tx);margin-bottom:12px;font-family:var(--fd);}
.doc-preview p{margin-bottom:8px;}
.doc-preview .doc-clause{border-left:2px solid var(--br2);padding-left:11px;margin:10px 0;font-size:11px;color:var(--mu);line-height:1.7;}
.sign-placed{display:inline-flex;align-items:center;gap:5px;background:rgba(34,211,160,.1);border:1px solid rgba(34,211,160,.3);border-radius:var(--r);padding:4px 10px;font-size:11px;color:var(--gn);font-style:italic;}

/* ─── TABLET 1024px ─── */
@media(max-width:1024px){
  .stats-grid{grid-template-columns:1fr 1fr;}
  .fin-grid{grid-template-columns:1fr 1fr;}
  .prog-grid{grid-template-columns:1fr 1fr;}
  .grant-pipe{grid-template-columns:1fr 1fr;}
  .g3{grid-template-columns:1fr 1fr;}
}

/* ─── SMALL TABLET 768px ─── */
@media(max-width:768px){
  :root{--sw:280px;--th:50px;}
  /* Sidebar becomes overlay drawer */
  .sidebar{position:fixed;top:0;left:0;bottom:0;z-index:100;transform:translateX(-100%);transition:transform .26s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 24px rgba(0,0,0,.5);}
  .sidebar.open{transform:translateX(0);}
  .sidebar-overlay{display:block;}
  .hamburger{display:flex;align-items:center;justify-content:center;}
  .sidebar-close{display:block;}
  /* Main fills full width */
  .main{width:100%;min-width:0;}
  /* Stats 2-col */
  .stats-grid{grid-template-columns:1fr 1fr;}
  .fin-grid{grid-template-columns:1fr 1fr;}
  /* All grids single col */
  .g2,.g3,.g4{grid-template-columns:1fr;}
  .prog-grid{grid-template-columns:1fr 1fr;}
  .grant-pipe{grid-template-columns:1fr 1fr;}
  /* Page padding */
  .page-body{padding:14px;}
  /* Auth card full width */
  .auth-card{width:100%;max-width:430px;padding:28px 20px;}
  .auth-bg{align-items:flex-start;padding:20px 14px;}
  /* Modals full screen */
  .modal{width:100%;max-width:100%;max-height:100vh;border-radius:var(--rxl) var(--rxl) 0 0;position:fixed;bottom:0;left:0;right:0;animation:slideUp .22s ease;}
  .modal-bg{align-items:flex-end;}
  /* Toast full width */
  .toast-wrap{left:12px;right:12px;bottom:14px;}
  .toast{min-width:0;max-width:100%;}
}

/* ─── MOBILE 480px ─── */
@media(max-width:480px){
  :root{--th:48px;}
  .stats-grid{grid-template-columns:1fr 1fr;}
  .fin-grid{grid-template-columns:1fr 1fr;}
  .prog-grid{grid-template-columns:1fr;}
  .grant-pipe{grid-template-columns:1fr 1fr;}
  .g2,.g3,.g4{grid-template-columns:1fr;}
  /* Topbar title smaller */
  .tb-title{font-size:13px;}
  .page-title{font-size:18px;}
  /* Page padding tighter */
  .page-body{padding:12px;}
  /* Form rows stack */
  .frow2{grid-template-columns:1fr;}
  /* Role grid 2-col on small screens */
  .role-grid{grid-template-columns:1fr 1fr;}
  /* Auth */
  .auth-bg{padding:12px 12px 80px;}
  .auth-card{border-radius:var(--rl);}
  /* Bottom nav visible for staff */
  .bottom-nav{display:block;}
  .page-body.has-bottom-nav{padding-bottom:72px;}
  /* Hide sidebar text on very small, just icons — handled via JS open/close */
  .sb-section{padding-top:10px;}
  /* Stat values slightly smaller */
  .sc-val{font-size:24px;}
  .fin-val{font-size:18px;}
  /* Timer bigger touch targets */
  .ci-in,.ci-out{padding:14px;}
  .checkin-btn{font-size:14px;}
}

/* ─── EXTRA SMALL 360px ─── */
@media(max-width:360px){
  .stats-grid{grid-template-columns:1fr;}
  .fin-grid{grid-template-columns:1fr;}
  .frow2{grid-template-columns:1fr;}
  .role-grid{grid-template-columns:1fr;}
  .auth-card{padding:22px 14px;}
  .page-body{padding:10px;}
}

/* ─── iOS safe area ─── */
@supports(padding-bottom:env(safe-area-inset-bottom)){
  .bottom-nav{padding-bottom:env(safe-area-inset-bottom);}
  .auth-bg{padding-bottom:calc(20px + env(safe-area-inset-bottom));}
}

/* ─── Tall landscape phone ─── */
@media(max-width:768px) and (orientation:landscape){
  .auth-bg{align-items:center;padding:10px 20px;}
  .auth-card{max-height:90vh;overflow-y:auto;}
}
`;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PROGRAMS = [
  {
    id: 1,
    name: "I Am 1 / Me2",
    sub: "Street Outreach",
    off: "both",
    icon: "🌍",
  },
  {
    id: 2,
    name: "LELN",
    sub: "Legal Navigation",
    off: "both",
    icon: "⚖️",
  },
  {
    id: 3,
    name: "FSURP + Stabilize 72",
    sub: "Relational Infrastructure",
    off: "both",
    icon: "🌱",
  },
  {
    id: 4,
    name: "AVP + Trauma Healing",
    sub: "Healing & Safety",
    off: "both",
    icon: "💙",
  },
  {
    id: 5,
    name: "Pay It Forward",
    sub: "Vocational Pathway (6–12mo)",
    off: "both",
    icon: "💼",
  },
  {
    id: 6,
    name: "Discovery Bay",
    sub: "Ecofarm Respite",
    off: "both",
    icon: "🌾",
  },
  {
    id: 7,
    name: "Lynn Dancer Squad",
    sub: "Personal Assistant Program",
    off: "both",
    icon: "🤝",
  },
  {
    id: 8,
    name: "Family Pathways",
    sub: "WYFF-Aligned",
    off: "both",
    icon: "🏠",
  },
];

const MOCK_PENDING_USERS = [];

// ─── UTILITY HOOKS ────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

function useTimer(running) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      clearInterval(ref.current);
      setSecs(0);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const fmt = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return fmt(secs);
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const isSCP = (email) => email.toLowerCase().endsWith("@" + SCP_DOMAIN);

function OfficePill({ o }) {
  if (o === "north") return <span className="off-n">Woodinville (N)</span>;
  if (o === "south") return <span className="off-s">Tacoma (S)</span>;
  return <span className="off-b">Both offices</span>;
}

function IdBadge({ uid }) {
  if (!uid || uid === "") return <span className="id-badge id-none">⏳ ID pending</span>;
  const cls = (uid || "").startsWith("ADM")
    ? "id-adm"
    : (uid || "").startsWith("MGR")
    ? "id-mgr"
    : (uid || "").startsWith("STF")
    ? "id-stf"
    : "id-par";
  return <span className={`id-badge ${cls}`}>{uid}</span>;
}

const stageLabelEN = {
  job_scheduled: "Scheduled",
  staff_assigned: "Assigned",
  arrived_at_site: "On Site",
  completed: "Completed",
  invoiced: "Invoiced",
};
const stageLabel = (s) => s ? (stageLabelEN[s] || s) : "";
const stageColor = (s) =>
  ({
    job_scheduled: "b-gr",
    staff_assigned: "b-b",
    arrived_at_site: "b-a",
    completed: "b-g",
    invoiced: "b-p",
  }[s] || "b-gr");
const statusColor = (s) =>
  ({
    open: "b-a",
    in_progress: "b-b",
    done: "b-g",
    passed: "b-g",
    failed: "b-r",
  }[s] || "b-gr");

function Toasts({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span
            style={{
              color:
                t.type === "success"
                  ? T.green
                  : t.type === "warn"
                  ? T.amber
                  : t.type === "error"
                  ? T.red
                  : T.pink,
              fontSize: 14,
            }}
          >
            ✦
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({ title, sub, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-t">{title}</div>
            {sub && <div className="modal-s">{sub}</div>}
          </div>
          <button className="mclose" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// Free-text service type with autocomplete
function ServiceInput({ value, onChange, suggestions }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="ac-wrap" ref={ref}>
      <input
        className="fi2"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFiltered(
            suggestions
              .filter(
                (s) =>
                  s.toLowerCase().includes(e.target.value.toLowerCase()) &&
                  s !== e.target.value
              )
              .slice(0, 7)
          );
          setOpen(true);
        }}
        onFocus={() => {
          setFiltered(
            suggestions
              .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
              .slice(0, 7)
          );
          setOpen(true);
        }}
        placeholder="Type any job type — remembered for next time"
      />
      {open && filtered.length > 0 && (
        <div className="ac-list">
          {filtered.map((s, i) => (
            <div
              key={i}
              className="ac-item"
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TagInput({ value, onChange, placeholder }) {
  const [inp, setInp] = useState("");
  return (
    <div
      className="tag-wrap"
      onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
    >
      {value.map((t, i) => (
        <span key={i} className="tag-chip">
          {t}
          <button
            className="tag-x"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-inp"
        value={inp}
        onChange={(e) => setInp(e.target.value)}
        placeholder={value.length ? "" : placeholder || "Add…"}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && inp.trim()) {
            e.preventDefault();
            if (!value.includes(inp.trim())) onChange([...value, inp.trim()]);
            setInp("");
          } else if (e.key === "Backspace" && !inp)
            onChange(value.slice(0, -1));
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN — Login + Signup with live domain detection
// ═══════════════════════════════════════════════════════════════════════════════
function ResetPasswordScreen({ onDone }) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async () => {
    setErr("");
    if (pass.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pass !== pass2) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setOk(true);
      await supabase.auth.signOut();
    } catch (e) {
      setErr(e?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo" style={{ marginBottom: 20 }}>
          <div className="auth-mark">S</div>
          <div>
            <div className="auth-name">SCP-<span>STK</span> Hub</div>
            <div className="auth-org">Set a new password</div>
          </div>
        </div>
        {ok ? (
          <div className="auth-msg-ok">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Password updated</div>
            You can now sign in with your new password.
            <div style={{ marginTop: 12 }}>
              <button className="auth-btn" style={{ marginTop: 0 }} onClick={onDone}>
                Go to sign in →
              </button>
            </div>
          </div>
        ) : (
          <>
            {err && <div className="auth-msg-err">{err}</div>}
            <div className="auth-field">
              <label className="auth-lbl">New password</label>
              <input
                className="auth-inp"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="auth-field">
              <label className="auth-lbl">Confirm new password</label>
              <input
                className={`auth-inp${pass2.length > 0 ? (pass === pass2 ? " valid" : " invalid") : ""}`}
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="Re-enter password"
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
            </div>
            <button className="auth-btn" onClick={handleSetPassword} disabled={loading}>
              {loading ? "Updating…" : "Update password →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function AuthScreen({ onAuth }) {
  const [tab, setTab]       = useState("login");
  const { toasts, toast }   = useToast();

  // ── Login state ──────────────────────────────────────────
  const [lEmail, setLEmail] = useState("");
  const [lPass,  setLPass]  = useState("");
  const [lErr,   setLErr]   = useState("");
  const [lLoad,  setLLoad]  = useState(false);

  // ── Forgot password state ────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [fEmail, setFEmail] = useState("");
  const [fErr, setFErr] = useState("");
  const [fSent, setFSent] = useState(false);
  const [fLoad, setFLoad] = useState(false);

  const handleForgotPassword = async () => {
    setFErr("");
    if (!fEmail.trim()) { setFErr("Enter your email address."); return; }
    setFLoad(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(fEmail.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setFSent(true);
    } catch (err) {
      setFErr(err?.message || "Failed to send reset email. Please try again.");
    } finally {
      setFLoad(false);
    }
  };

  // ── Signup state ─────────────────────────────────────────
  const [sName,  setSName]  = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass,  setSPass]  = useState("");
  const [sPass2, setSPass2] = useState("");
  const [sErr,   setSErr]   = useState("");
  const [sOk,    setSOk]    = useState(false);
  const [sLoad,  setSLoad]  = useState(false);

  const domainTyped = sEmail.includes("@");
  const scpEmail    = domainTyped && isSCP(sEmail);
  const otherEmail  = domainTyped && !isSCP(sEmail);

  // ── Role is inferred — never chosen by the user ──────────
  // SCP domain  → "manager" by default (super admin upgrades later)
  // Other email → "staff"
  const inferredRole = scpEmail ? "manager" : "staff";

  // ── LOGIN ─────────────────────────────────────────────────
  const handleLogin = async () => {
    setLErr("");
    if (!lEmail.trim() || !lPass) {
      setLErr("Please enter your email and password.");
      return;
    }
    setLLoad(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: lEmail.trim(),
        password: lPass,
      });
      if (error) throw error;

      const profile = await fetchUserProfile(data.user, data.session?.access_token);
      if (!profile) throw new Error("Profile not found. Please contact an admin.");
      onAuth(profile);
    } catch (err) {
      setLErr(typeof err === "string" ? err : err?.message || "Login failed. Check your email and password.");
    } finally {
      setLLoad(false);
    }
  };

  // ── SIGNUP ────────────────────────────────────────────────
  const handleSignup = async () => {
    setSErr("");
    if (!sName.trim()) { setSErr("Full name is required."); return; }
    if (!domainTyped)  { setSErr("Enter a valid email address."); return; }
    if (sPass.length < 8) { setSErr("Password must be at least 8 characters."); return; }
    if (sPass !== sPass2) { setSErr("Passwords do not match."); return; }

    setSLoad(true);
    try {
      // 1. Create auth user — Supabase trigger creates the public.users row
      const { data, error } = await supabase.auth.signUp({
        email: sEmail.trim(),
        password: sPass,
        options: {
          data: { full_name: sName.trim() },
        },
      });
      if (error) {
        // Give a human-readable message for common errors
        if (error.status === 500)
          throw new Error("Server error — make sure 'Confirm email' is disabled in Supabase Auth settings.");
        if (error.message?.toLowerCase().includes("already registered"))
          throw new Error("An account with this email already exists. Please sign in.");
        throw new Error(error.message || "Signup failed. Please try again.");
      }

      // 2. Set the correct role in public.users based on email domain
      //    (trigger creates the row with default "staff"; we update it for SCP emails)
      if (scpEmail && data.user) {
        await supabase
          .from("users")
          .update({ role: "manager", full_name: sName.trim() })
          .eq("id", data.user.id);
      } else if (data.user) {
        await supabase
          .from("users")
          .update({ full_name: sName.trim() })
          .eq("id", data.user.id);
      }

      setSOk(true);
    } catch (err) {
      // Always render a string, never an object
      setSErr(typeof err === "string" ? err : err?.message || "Signup failed. Please try again.");
    } finally {
      setSLoad(false);
    }
  };

  const resetForms = () => {
    setLErr(""); setSErr(""); setSOk(false);
    setLEmail(""); setLPass("");
    setSName(""); setSEmail(""); setSPass(""); setSPass2("");
    setShowForgot(false); setFEmail(""); setFErr(""); setFSent(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-logo" style={{ marginBottom: 20 }}>
          <div className="auth-mark">S</div>
          <div>
            <div className="auth-name">SCP-<span>STK</span> Hub</div>
            <div className="auth-org">Sawyer Culberson Project · Save the Kids</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => { setTab("login");  resetForms(); }}
          >
            Sign in
          </button>
          <button
            className={`auth-tab${tab === "signup" ? " active" : ""}`}
            onClick={() => { setTab("signup"); resetForms(); }}
          >
            Create account
          </button>
        </div>

        {/* ── LOGIN PANEL ── */}
        {tab === "login" && (
          <>
            {lErr && <div className="auth-msg-err">{lErr}</div>}
            <div className="auth-field">
              <label className="auth-lbl">Email address</label>
              <input
                className="auth-inp"
                type="email"
                value={lEmail}
                onChange={(e) => setLEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="auth-field">
              <label className="auth-lbl">Password</label>
              <input
                className="auth-inp"
                type="password"
                value={lPass}
                onChange={(e) => setLPass(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <button className="auth-btn" onClick={handleLogin} disabled={lLoad}>
              {lLoad ? "Signing in…" : "Sign in →"}
            </button>
            <div className="auth-note" style={{ marginBottom: 4 }}>
              <span className="lnk" onClick={() => { setShowForgot(true); setFErr(""); setFSent(false); }}>
                Forgot password?
              </span>
            </div>
            <div className="auth-note">
              New here?{" "}
              <span className="lnk" onClick={() => { setTab("signup"); resetForms(); }}>
                Create an account
              </span>
            </div>

            {showForgot && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                {fSent ? (
                  <div className="auth-msg-ok">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Reset link sent</div>
                    Check {fEmail} for a link to reset your password.
                    <div style={{ marginTop: 10 }}>
                      <span className="lnk" onClick={() => { setShowForgot(false); setFSent(false); setFEmail(""); }}>
                        Back to sign in
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {fErr && <div className="auth-msg-err">{fErr}</div>}
                    <div className="auth-field">
                      <label className="auth-lbl">Reset password for</label>
                      <input
                        className="auth-inp"
                        type="email"
                        value={fEmail}
                        onChange={(e) => setFEmail(e.target.value)}
                        placeholder="your@email.com"
                        onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                      />
                    </div>
                    <button className="auth-btn" onClick={handleForgotPassword} disabled={fLoad}>
                      {fLoad ? "Sending…" : "Send reset link →"}
                    </button>
                    <div className="auth-note">
                      <span className="lnk" onClick={() => setShowForgot(false)}>
                        Cancel
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── SIGNUP PANEL ── */}
        {tab === "signup" && (
          <>
            {sOk ? (
              <div className="auth-msg-ok">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  ✓ Account created!
                </div>
                {scpEmail
                  ? "You're registered as a Board Member. A super admin will assign your access level. You can log in now."
                  : "You're registered as Workforce Staff. A super admin will assign your ID badge once they review your account. You can log in now."}
                <div style={{ marginTop: 12 }}>
                  <button
                    className="auth-btn"
                    style={{ marginTop: 0 }}
                    onClick={() => { setSOk(false); setTab("login"); resetForms(); }}
                  >
                    Go to sign in →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {sErr && <div className="auth-msg-err">{sErr}</div>}

                <div className="auth-field">
                  <label className="auth-lbl">Full name</label>
                  <input
                    className="auth-inp"
                    type="text"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-lbl">Email address</label>
                  <input
                    className={`auth-inp${domainTyped ? " valid" : ""}`}
                    type="email"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  {scpEmail && (
                    <div className="domain-pill domain-scp">
                      🏛️ SCP org email — Board Member account
                    </div>
                  )}
                  {otherEmail && (
                    <div className="domain-pill domain-ext">
                      🔧 External email — Workforce Staff account
                    </div>
                  )}
                </div>

                <div className="auth-field">
                  <label className="auth-lbl">Password</label>
                  <input
                    className="auth-inp"
                    type="password"
                    value={sPass}
                    onChange={(e) => setSPass(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-lbl">Confirm password</label>
                  <input
                    className={`auth-inp${
                      sPass2.length > 0 ? (sPass === sPass2 ? " valid" : " invalid") : ""
                    }`}
                    type="password"
                    value={sPass2}
                    onChange={(e) => setSPass2(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>

                <div className="info-box" style={{ marginBottom: 12 }}>
                  <span style={{ color: T.pink, fontWeight: 600 }}>After signup: </span>
                  {scpEmail
                    ? "A super admin will assign your board access level."
                    : "A super admin will assign your staff ID (e.g. STF-007). You can log in right away."}
                </div>

                <button
                  className="auth-btn"
                  onClick={handleSignup}
                  disabled={sLoad || !domainTyped || !sName.trim() || sPass.length < 8 || sPass !== sPass2}
                >
                  {sLoad ? "Creating account…" : "Create account →"}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <Toasts toasts={toasts} />
    </div>
  );
}

// ─── COLLAPSIBLE SIDEBAR NAV ──────────────────────────────────────────────────
// Clean grouped navigation with collapsible sections.
// Sections default open if they contain the active page, otherwise collapsed.
function CollapsibleNav({ nav, page, navTo, userRole }) {
  const sections = [...new Set(nav.map((n) => n.section))];

  // Default: section is open if it contains active page
  const initOpen = {};
  sections.forEach((sec) => {
    initOpen[sec] = nav
      .filter((n) => n.section === sec)
      .some((n) => n.key === page);
  });
  // Overview always open
  initOpen["Overview"] = true;

  const [openSecs, setOpenSecs] = useState(initOpen);

  // When page changes, open that section
  useEffect(() => {
    sections.forEach((sec) => {
      const hasActive = nav
        .filter((item) => item.section === sec)
        .some((item) => item.key === page);
      if (hasActive) {
        setOpenSecs((prev) => ({ ...prev, [sec]: true }));
      }
    });
  }, [page]);
  const toggle = (sec) => setOpenSecs((p) => ({ ...p, [sec]: !p[sec] }));

  const sectionIcons = {
    Overview: "🗳",
    Programs: "P",
    Operations: "O",
    Channels: "C",
    Governance: "G",
    Admin: "A",
  };
  return (
    <div className="sb-nav">
      {sections.map((sec) => {
        if (sec === "Admin" && userRole !== "admin") return null;
        const items = nav.filter(
          (n) => n.section === sec && (!n.adminOnly || userRole === "admin")
        );
        const isOpen = openSecs[sec];
        const hasActive = items.some((n) => n.key === page);
        const totalBadge = items.reduce((a, n) => a + (n.badge || 0), 0);

        return (
          <div key={sec}>
            {/* Section header — clickable to collapse */}
            {sec === "Overview" ? (
              // Overview has no toggle, just a spacer
              <div style={{ height: 4 }} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 14px 5px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => toggle(sec)}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: hasActive ? T.pink : T.muted,
                    flex: 1,
                    fontWeight: hasActive ? 700 : 600,
                    textTransform: "uppercase",
                    letterSpacing: ".07em",
                  }}
                >
                  {sec}
                </span>
                {!isOpen && totalBadge > 0 && (
                  <span
                    style={{
                      background: T.pink,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "0 5px",
                      borderRadius: 9,
                      minWidth: 17,
                      textAlign: "center",
                    }}
                  >
                    {totalBadge}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 9,
                    color: T.muted,
                    transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform .18s",
                    lineHeight: 1,
                  }}
                >
                  ▾
                </span>
              </div>
            )}

            {/* Items — shown when open */}
            {isOpen &&
              items.map((n) => (
                <div
                  key={n.key}
                  className={`ni${page === n.key ? " on" : ""}`}
                  onClick={() => navTo(n.key)}
                >
                  <span className="ni-ic">{n.icon}</span>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.label}
                  </span>
                  {n.badge && <span className="ni-badge">{n.badge}</span>}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOARD SHELL — Admin & Manager full access
// ═══════════════════════════════════════════════════════════════════════════════
const BOARD_NAV = [
  { key: "dashboard", label: "Dashboard", icon: "⬛", section: "Overview" },
  // Programs
  { key: "programs", label: "Programs", icon: "🏛️", section: "Programs" },
  {
    key: "participants",
    label: "Participants",
    icon: "🎓",
    section: "Programs",
  },
  // Operations
  { key: "tasks", label: "Tasks & Roles", icon: "✅", section: "Operations" },
  {
    key: "crm",
    label: "Job Funnel",
    icon: "📋",
    section: "Operations",
    adminOnly: true,
  },
  {
    key: "finance",
    label: "Finance & Payroll",
    icon: "💰",
    section: "Operations",
    adminOnly: true,
  },
  // Channels
  { key: "orgdocs", label: "Org Documents", icon: "📁", section: "Channels" },
  { key: "resources", label: "Resources", icon: "📚", section: "Channels" },
  { key: "workshops", label: "Workshops", icon: "🎓", section: "Channels" },
  { key: "mou", label: "MOUs & Contracts", icon: "🗂️", section: "Channels" },
  { key: "grants", label: "Grants & Funding", icon: "💼", section: "Channels" },
  // Governance
  {
    key: "voting",
    label: "Voting",
    icon: "🗳️",
    section: "Governance",
  },
  {
    key: "esignatures",
    label: "E-Signatures",
    icon: "✍️",
    section: "Governance",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: "🔔",
    section: "Governance",
  },
  // Admin
  { key: "users", label: "Users & IDs", icon: "🪪", section: "Admin" },
  { key: "auditlog", label: "Audit Log", icon: "📜", section: "Admin" },
];

function useNotifications(user) {
  const [notifs, setNotifs] = useState([]);
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };
  const load = async () => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setNotifs(json.data || []);
    } catch (e) { /* silent */ }
  };
  useEffect(() => { load(); }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notif-bell-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifs((p) => [payload.new, ...p])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);
  const markRead = async (id) => {
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { /* silent */ }
  };
  const markAllRead = async () => {
    const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    const token = await getToken();
    await Promise.all(
      unreadIds.map((id) =>
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      )
    );
  };
  const unread = notifs.filter((n) => !n.read).length;
  return { notifs, unread, markRead, markAllRead };
}
function BoardShell({ user, onLogout, toast }) {
  const { notifs, unread, markRead, markAllRead } = useNotifications(user);
  const [page, setPage] = useState("dashboard");
  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sections = [...new Set(BOARD_NAV.map((n) => n.section))];
  const pageLabel = BOARD_NAV.find((n) => n.key === page)?.label || "Dashboard";

  const navTo = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const h = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const renderPage = () => {
    const p = {
      toast, onNav: navTo, user, notifs, markRead, markAllRead,
      pendingTaskId,
      onTaskClick: setPendingTaskId,
      clearPendingTask: () => setPendingTaskId(null),
    };
    switch (page) {
      case "dashboard":
        return <BoardDashboard {...p} />;
      case "programs":
        return <Programs {...p} />;
      case "participants":
        return <Participants {...p} />;
      case "crm":
        return user?.role === "admin" ? (
          <CRMBoard {...p} />
        ) : (
          <BoardDashboard {...p} />
        );
      case "tasks":
        return <Tasks {...p} />;
      case "finance":
        return user?.role === "admin" ? (
          <Finance {...p} />
        ) : (
          <BoardDashboard {...p} />
        );
      case "grants":
        return <Grants {...p} />;
      case "voting":
        return <Voting {...p} />;
      case "notifications":
        return <Notifications {...p} />;
      case "esignatures":
        return <ESignatures {...p} />;
      case "mou":
        return <MOUTracker {...p} />;
      case "auditlog":
        return <AuditLog {...p} />;
      case "orgdocs":
        return <OrgDocuments {...p} />;
      case "resources":
        return <Resources {...p} />;
      case "workshops":
        return <Workshops {...p} />;
      case "users":
        return <UsersAndIDs toast={p.toast} user={p.user} />;
      default:
        return <BoardDashboard {...p} />;
    }
  };

  return (
    <div className="shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sb-head">
          <div className="sb-mark">S</div>
          <div style={{ flex: 1 }}>
            <div className="sb-appname">
              SCP-<span>STK</span> Hub
            </div>
            <div className="sb-apporg">Save the Kids</div>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="sb-user">
          <div className="sb-user-row">
            <div className="av">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="sb-uname">{user.name}</div>
              <div className="sb-urole">
                {user.role === "admin" ? "Admin" : "Manager"} ·{" "}
                {user.office === "north" ? "Woodinville" : "Tacoma"}
              </div>
            </div>
          </div>
          <IdBadge uid={user.displayId || user.uid} />
        </div>
        <CollapsibleNav
          nav={BOARD_NAV}
          page={page}
          navTo={navTo}
          userRole={user.role}
        />
        <div className="sb-foot">
          <div
            className="ni"
            style={{ padding: "7px 0", color: T.muted, fontSize: 11 }}
            onClick={onLogout}
          >
            <span className="ni-ic">→</span>
            Sign out
          </div>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div
              className="tb-title"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pageLabel}
            </div>
          </div>
          <div className="tb-right">
            
            <button
              className="btn btn-sm"
              onClick={() => navTo("notifications")}
              style={{ position: "relative" }}
            >
              🔔
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.pink,
                    border: "1px solid var(--dk)",
                  }}
                />
              )}
            </button>
            <button
              className="btn btn-p btn-sm"
              onClick={() =>
                toast("Navigate to the relevant module to add")
              }
            >
              "+ New"
            </button>
          </div>
        </div>
        <div className="page-body">{renderPage()}</div>
      </div>
    </div>
  );
}

// ── Board Dashboard ──────────────────────────────────────────────────────────
function BoardDashboard({ onNav, toast, user }) {
  const [stats, setStats] = React.useState({ jobs: 0, participants: 0, grants: 0, votes: 0, boardMembers: 0, staff: 0, idPending: 0 });
  const activity = [];

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const h = { Authorization: `Bearer ${token}` };
        const base = import.meta.env.VITE_API_URL;
        const [usersRes, grantsRes, votesRes, partsRes] = await Promise.all([
          fetch(`${base}/api/admin/users`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/grants`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/resolutions`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/participants`, { headers: h }).then(r => r.json()),
        ]);
        const users = usersRes.data || [];
        setStats({
          jobs: 0,
          participants: (partsRes.data || []).length,
          grants: (grantsRes.data || []).filter(g => g.stage !== "awarded").length,
          votes: (votesRes.data || []).filter(v => v.status === "open").length,
          boardMembers: users.filter(u => u.role === "admin" || u.role === "manager").length,
          staff: users.filter(u => u.role === "staff").length,
          idPending: users.filter(u => !u.display_id).length,
        });
      } catch(e) { console.error(e); }
    };
    load();
  }, []);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontFamily: "var(--fd)",
            fontSize: 21,
            color: T.white,
            marginBottom: 3,
          }}
        >
          Good morning ✦
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          SCP-STK Hub — all operations at a glance
        </div>
      </div>
      <div className="stats-grid">
        {[
          { l: "Active jobs", v: stats.jobs, d: "", up: true },
          { l: "Participants", v: stats.participants, d: "" },
          { l: "Open grants", v: stats.grants, d: "" },
          { l: "Pending votes", v: stats.votes, d: "" },
        ].map((s, i) => (
          <div key={i} className="sc">
            <div className="sc-lbl">{s.l}</div>
            <div className="sc-val">{s.v}</div>
            <div className={`sc-d${s.up ? " up" : ""}`}>{s.d}</div>
          </div>
        ))}
      </div>
      <div className="g2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="sec-hdr">
            <div className="sec-title">Recent activity</div>
            <button
              className="btn btn-sm"
              onClick={() => onNav("notifications")}
            >
              All
            </button>
          </div>
          <div className="act-feed">
            {activity.map((a, i) => (
              <div key={i} className="act-row">
                <div
                  className="act-ic"
                  style={{ background: a.color + "22", color: a.color }}
                >
                  {a.type}
                </div>
                <div>
                  <div className="act-text">{a.text}</div>
                  <div className="act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="sec-hdr">
            <div className="sec-title">Org snapshot</div>
          </div>
          {[
            {
              icon: "🏛️",
              l: "Board members",
              v: stats.boardMembers,
              sub: "Admin & Manager",
              color: T.pink,
              page: "users",
            },
            {
              icon: "🔧",
              l: "Workforce staff",
              v: stats.staff,
              sub: "Active jobs",
              color: T.green,
              page: "crm",
            },
            {
              icon: "🎓",
              l: "Program participants",
              v: stats.participants,
              sub: "Across programs",
              color: T.blue,
              page: "participants",
            },
            {
              icon: "⏳",
              l: "ID pending",
              v: "3",
              sub: "New signups",
              color: T.amber,
              page: "users",
            },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={() => onNav(r.page)}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                  {r.l}
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>{r.sub}</div>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: r.color }}>
                {r.v}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ marginBottom: 11 }}>
          Quick access
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))",
            gap: 7,
          }}
        >
          {[
            { l: "New job", i: "🔧", p: "crm" },
            { l: "Participants", i: "🎓", p: "participants" },
            { l: "Programs", i: "🏛️", p: "programs" },
            { l: "Grants", i: "💰", p: "grants" },
            { l: "Votes", i: "🗳️", p: "voting", b: stats.votes },
            { l: "Users & IDs", i: "🪪", p: "users", b: stats.idPending },
          ].map((q, i) => (
            <button
              key={i}
              className="btn"
              style={{
                flexDirection: "column",
                padding: "11px 6px",
                gap: 5,
                height: "auto",
                position: "relative",
              }}
              onClick={() => onNav(q.p)}
            >
              <span style={{ fontSize: 17 }}>{q.i}</span>
              <span style={{ fontSize: 10 }}>{q.l}</span>
              {q.b && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: T.pink,
                    color: "#fff",
                    fontSize: 8,
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: 7,
                  }}
                >
                  {q.b}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Programs ─────────────────────────────────────────────────────────────────
function Programs({ toast }) {
  const [programs, setPrograms] = useState([]);
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("all");
  const [docs, setDocs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [showAddProg, setShowAddProg] = useState(false);
  const [showAddLedger, setShowAddLedger] = useState(false);
  const [progForm, setProgForm] = useState({ name: "", sub: "", off: "both", icon: "🌟" });
  const [lf, setLf] = useState({
    full_name: "", phone: "", address: "", help_needed: "",
    helped_on: new Date().toISOString().slice(0, 10), notes: "", program_ids: [],
  });

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadPrograms = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setPrograms(json.data || []);
    } catch (e) {
      toast("Failed to load programs", "error");
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadDocs = async (programId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programs/${programId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setDocs(json.data || []);
    } catch (e) { /* silent */ }
  };

  const loadLedger = async (programId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programs/${programId}/ledger`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setLedger(json.data || []);
    } catch (e) { /* silent */ }
  };

  const openProgram = (id) => {
    setSel(id);
    loadDocs(id);
    loadLedger(id);
  };

  const createProgram = async () => {
    if (!progForm.name) {
      toast("Program name required", "warn");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: progForm.name, sub: progForm.sub, office: progForm.off, icon: progForm.icon }),
      });
      if (!res.ok) throw new Error();
      setShowAddProg(false);
      setProgForm({ name: "", sub: "", off: "both", icon: "🌟" });
      toast("Program added ✓", "success");
      loadPrograms();
    } catch (e) {
      toast("Failed to add program", "error");
    }
  };

  const uploadDocument = async (programId, file) => {
    if (!file) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const path = `${session.user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("Organization Document").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("Organization Document").getPublicUrl(path);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/programs/${programId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, url: urlData.publicUrl, file_type: file.name.split(".").pop() || "" }),
      });
      if (!res.ok) throw new Error();
      toast("Document uploaded ✓", "success");
      loadDocs(programId);
      loadPrograms();
    } catch (e) {
      toast("Failed to upload document", "error");
    }
  };

  const toggleLedgerProgram = (pid) => {
    setLf((f) => ({
      ...f,
      program_ids: f.program_ids.includes(pid)
        ? f.program_ids.filter((x) => x !== pid)
        : [...f.program_ids, pid],
    }));
  };

  const submitLedgerEntry = async () => {
    if (!lf.full_name) {
      toast("Name required", "warn");
      return;
    }
    if (lf.program_ids.length === 0) {
      toast("Select at least one program", "warn");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/program-ledger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(lf),
      });
      if (!res.ok) throw new Error();
      toast("Person added to ledger ✓", "success");
      setShowAddLedger(false);
      setLf({ full_name: "", phone: "", address: "", help_needed: "", helped_on: new Date().toISOString().slice(0, 10), notes: "", program_ids: [] });
      loadLedger(sel);
    } catch (e) {
      toast("Failed to add ledger entry", "error");
    }
  };

  const shown = programs.filter((p) => filter === "all" || p.office === filter || p.office === "both");

  if (sel) {
    const p = programs.find((x) => x.id === sel);
    if (!p) return null;
    return (
      <div>
        {showAddLedger && (
          <Modal
            title="Add person helped"
            sub={p.name}
            onClose={() => setShowAddLedger(false)}
            footer={
              <>
                <button className="btn" onClick={() => setShowAddLedger(false)}>
                  Cancel
                </button>
                <button className="btn btn-p" onClick={submitLedgerEntry}>
                  Save
                </button>
              </>
            }
          >
            <div className="ff">
              <label className="fl">Full name</label>
              <input
                className="fi2"
                value={lf.full_name}
                onChange={(e) => setLf((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Person's name"
              />
            </div>
            <div className="frow2">
              <div className="ff">
                <label className="fl">Phone</label>
                <input
                  className="fi2"
                  value={lf.phone}
                  onChange={(e) => setLf((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="206-555-0100"
                />
              </div>
              <div className="ff">
                <label className="fl">Date helped</label>
                <input
                  className="fi2"
                  type="date"
                  value={lf.helped_on}
                  onChange={(e) => setLf((f) => ({ ...f, helped_on: e.target.value }))}
                />
              </div>
            </div>
            <div className="ff">
              <label className="fl">Address</label>
              <input
                className="fi2"
                value={lf.address}
                onChange={(e) => setLf((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, city"
              />
            </div>
            <div className="ff">
              <label className="fl">What they need help with</label>
              <textarea
                className="ftxt"
                value={lf.help_needed}
                onChange={(e) => setLf((f) => ({ ...f, help_needed: e.target.value }))}
                placeholder="e.g. Food assistance, housing referral…"
              />
            </div>
            <div className="ff">
              <label className="fl">Notes (optional)</label>
              <textarea
                className="ftxt"
                value={lf.notes}
                onChange={(e) => setLf((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="ff">
              <label className="fl">Associated programs</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 4 }}>
                {programs.map((prog) => {
                  const checked = lf.program_ids.includes(prog.id);
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      className={`btn btn-sm${checked ? " btn-p" : ""}`}
                      onClick={() => toggleLedgerProgram(prog.id)}
                    >
                      {prog.icon} {prog.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </Modal>
        )}

        <button className="btn btn-ghost" style={{ marginBottom: 12 }} onClick={() => setSel(null)}>
          ← All programs
        </button>
        <div className="card" style={{ marginBottom: 13, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 4,
              background: `linear-gradient(180deg,${T.pink2},${T.pink})`,
            }}
          />
          <div style={{ paddingLeft: 14 }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 21, color: T.white, marginBottom: 3 }}>
              {p.icon} {p.name}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 11 }}>{p.sub}</div>
            <div style={{ display: "flex", gap: 18 }}>
              <span style={{ fontSize: 12, color: T.sub }}>
                <b style={{ color: T.white }}>{ledger.length}</b> people helped
              </span>
              <span style={{ fontSize: 12, color: T.sub }}>
                <b style={{ color: T.white }}>{docs.length}</b> documents
              </span>
              <OfficePill o={p.office} />
            </div>
          </div>
        </div>
        <div className="g2">
          <div className="card">
            <div className="sec-hdr">
              <div className="sec-title">Documents</div>
              <label className="btn btn-sm btn-p" style={{ cursor: "pointer" }}>
                + Upload
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDocument(sel, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {docs.map((d) => (
                <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                  borderRadius: 6, textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>📄</span>
                <span style={{ flex: 1, fontSize: 12, color: T.text }}>{d.name}</span>
                <span className="badge b-gr">{(d.file_type || "").toUpperCase()}</span>
              </a>
            ))}
            {!docs.length && (
              <div style={{ fontSize: 12, color: T.muted, padding: "8px 0" }}>No documents yet.</div>
            )}
          </div>
          <div className="card">
            <div className="sec-hdr">
              <div className="sec-title">People Helped ({ledger.length})</div>
              <button className="btn btn-sm btn-p" onClick={() => setShowAddLedger(true)}>
                + Add
              </button>
            </div>
            {ledger.length === 0 ? (
              <div style={{ fontSize: 12, color: T.muted }}>No records yet.</div>
            ) : (
              ledger.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0",
                    borderBottom: i < ledger.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div className="av" style={{ width: 25, height: 25, fontSize: 9, flexShrink: 0 }}>
                    {e.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{e.full_name}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>
                      {e.help_needed || "—"} · {new Date(e.helped_on).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showAddProg && (
        <Modal
          title="Add new program"
          sub="Program will appear in the grid immediately"
          onClose={() => setShowAddProg(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAddProg(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={createProgram}>
                Add program
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Program name</label>
            <input
              className="fi2"
              value={progForm.name}
              onChange={(e) => setProgForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Youth Leadership Initiative"
            />
          </div>
          <div className="ff">
            <label className="fl">Description / subtitle</label>
            <input
              className="fi2"
              value={progForm.sub}
              onChange={(e) => setProgForm((f) => ({ ...f, sub: e.target.value }))}
              placeholder="e.g. Mentorship and leadership training"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Office</label>
              <select
                className="fsel"
                value={progForm.off}
                onChange={(e) => setProgForm((f) => ({ ...f, off: e.target.value }))}
              >
                <option value="both">Both offices</option>
                <option value="north">Woodinville (North)</option>
                <option value="south">Tacoma (South)</option>
              </select>
            </div>
            <div className="ff">
              <label className="fl">Icon</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {["🌟", "🌍", "⚖️", "🌱", "💙", "💼", "🌾", "🤝", "🏠", "📚", "🎯", "💡"].map((ic) => (
                  <button
                    key={ic}
                    className={`btn btn-xs${progForm.icon === ic ? " btn-p" : ""}`}
                    style={{ fontSize: 16, padding: "4px 8px" }}
                    onClick={() => setProgForm((f) => ({ ...f, icon: ic }))}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="page-title">Programs</div>
        <button className="btn btn-p" onClick={() => setShowAddProg(true)}>
          + Add program
        </button>
      </div>
      <div className="page-sub">
        {programs.length} active programs · click to manage documents and people helped
      </div>
      <div className="frow" style={{ marginBottom: 14 }}>
        {["all", "north", "south"].map((f) => (
          <button key={f} className={`btn${filter === f ? " btn-p" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All offices" : f === "north" ? "Woodinville (N)" : "Tacoma (S)"}
          </button>
        ))}
      </div>
      <div className="prog-grid">
        {shown.map((p) => (
          <div key={p.id} className="prog-card" onClick={() => openProgram(p.id)}>
            <div className="prog-bar" />
            <div className="prog-icon">{p.icon}</div>
            <div className="prog-name">{p.name}</div>
            <div className="prog-sub">{p.sub}</div>
            <div className="prog-meta">
              <span className="prog-tag">{p.document_count || 0} docs</span>
              <OfficePill o={p.office} />
            </div>
          </div>
        ))}
        {!shown.length && (
          <div style={{ fontSize: 12, color: T.muted, gridColumn: "1 / -1", textAlign: "center", padding: "30px 0" }}>
            No programs yet — click "+ Add program" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function Participants({ toast }) {
  const [selPart, setSelPart] = useState(null);
  const [tab, setTab] = useState("list");
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadParticipants = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) setParts(json.data.map(p => ({
        id: p.id,
        pid: p.display_id || "",
        type: p.type || "participant",
        name: p.full_name,
        city: p.city || "",
        language: p.language || "English",
        mode: p.intake_mode || "digital",
        submitted: new Date(p.created_at).toLocaleDateString(),
        phone: p.phone || "",
        notes: p.notes || "",
      })));
    } catch(e) { toast("Failed to load participants", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadParticipants(); }, []);
  const [pForm, setPForm] = useState({
    name: "",
    phone: "",
    city: "",
    language: "English",
    notes: "",
    type: "participant",
  });
  const setF = (k) => (e) => setPForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = parts.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchType =
      tab === "participants"
        ? p.type === "participant"
        : tab === "volunteers"
        ? p.type === "volunteer"
        : true; // "list" shows all
    return matchSearch && matchType;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">Participants</div>
          <div className="page-sub">
            People who volunteered or worked as participants with the org
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setTab("add")}>
          + Add participant
        </button>
      </div>
      <div className="tabs">
        {[
          ["list", "All", parts.length],
          [
            "participants",
            "Participants",
            parts.filter((p) => p.type === "participant").length,
          ],
          [
            "volunteers",
            "Volunteers",
            parts.filter((p) => p.type === "volunteer").length,
          ],
        ].map(([k, l, n]) => (
          <button
            key={k}
            className={`tab${tab === k ? " on" : ""}`}
            onClick={() => setTab(k)}
          >
            {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>

      {(tab === "list" || tab === "participants" || tab === "volunteers") && (
        <>
          <div className="frow">
            <input
              className="fi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participants…"
              style={{ flex: 1, maxWidth: 240 }}
            />
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>ID</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Language</th>
                    <th>Mode</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelPart(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="nm">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>
                            {p.type === "volunteer" ? "🤝" : "🎓"}
                          </span>
                          {p.name}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge${
                            p.type === "volunteer" ? " b-g" : " b-b"
                          }`}
                          style={{ fontSize: 9 }}
                        >
                          {p.type === "volunteer"
                            ? "🤝 Volunteer"
                            : "🎓 Participant"}
                        </span>
                      </td>
                      <td>
                        <IdBadge uid={p.pid} />
                      </td>
                      <td style={{ fontSize: 11 }}>{p.phone || "—"}</td>
                      <td style={{ fontSize: 11 }}>{p.city || "—"}</td>
                      <td style={{ fontSize: 11 }}>{p.language}</td>
                      <td>
                        <span className={`mode-pill mode-${p.mode}`}>
                          {p.mode}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: T.muted }}>
                        {p.submitted}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: T.muted, padding: "20px 0" }}>
                        No participants yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "add" && (
        <div className="card">
          <div className="sec-hdr">
            <div className="sec-title">New participant intake</div>
            <button className="btn btn-ghost" onClick={() => setTab("list")}>
              ← Back to list
            </button>
          </div>
          <div className="ff">
            <label className="fl">Person type</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 9,
                marginTop: 4,
              }}
            >
              <button
                className={`btn${
                  pForm.type === "participant" ? " btn-p" : ""
                }`}
                style={{
                  flexDirection: "column",
                  padding: "14px 10px",
                  gap: 6,
                  height: "auto",
                  borderColor:
                    pForm.type === "participant" ? T.pink : undefined,
                }}
                onClick={() =>
                  setPForm((f) => ({ ...f, type: "participant" }))
                }
              >
                <span style={{ fontSize: 22 }}>🎓</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Participant
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      pForm.type === "participant"
                        ? "rgba(255,255,255,.7)"
                        : T.muted,
                    lineHeight: 1.4,
                  }}
                >
                  Someone who has gone through or is enrolled in our
                  programs
                </span>
              </button>
              <button
                className={`btn${
                  pForm.type === "volunteer" ? " btn-p" : ""
                }`}
                style={{
                  flexDirection: "column",
                  padding: "14px 10px",
                  gap: 6,
                  height: "auto",
                  borderColor:
                    pForm.type === "volunteer" ? T.pink : undefined,
                }}
                onClick={() =>
                  setPForm((f) => ({ ...f, type: "volunteer" }))
                }
              >
                <span style={{ fontSize: 22 }}>🤝</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Volunteer
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      pForm.type === "volunteer"
                        ? "rgba(255,255,255,.7)"
                        : T.muted,
                    lineHeight: 1.4,
                  }}
                >
                  Someone willing to volunteer in tasks and programs for the
                  org
                </span>
              </button>
            </div>
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Full name</label>
              <input
                className="fi2"
                value={pForm.name}
                onChange={setF("name")}
                placeholder="First Last"
              />
            </div>
            <div className="ff">
              <label className="fl">Phone / WhatsApp</label>
              <input
                className="fi2"
                value={pForm.phone}
                onChange={setF("phone")}
                placeholder="206-555-0100"
              />
            </div>
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">City</label>
              <input
                className="fi2"
                value={pForm.city}
                onChange={setF("city")}
                placeholder="e.g. Woodinville"
              />
            </div>
            <div className="ff">
              <label className="fl">Language</label>
              <select
                className="fsel"
                value={pForm.language}
                onChange={setF("language")}
              >
                <option>English</option>
                <option>Spanish</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="ff">
            <label className="fl">Notes</label>
            <textarea
              className="ftxt"
              value={pForm.notes}
              onChange={setF("notes")}
              placeholder="Barriers, referral source, preferences…"
            />
          </div>
          <button
            className="btn btn-p"
            onClick={async () => {
              if (!pForm.name || !pForm.phone) {
                toast("Name and phone required", "warn");
                return;
              }
              try {
                const token = await getToken();
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/participants`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    full_name: pForm.name,
                    phone: pForm.phone,
                    type: pForm.type,
                    city: pForm.city,
                    notes: pForm.notes,
                    intake_mode: "digital",
                    language: pForm.language || "English",
                  })
                });
                if (!res.ok) throw new Error();
                toast("Participant added ✓", "success");
                setTab("list");
                loadParticipants();
              } catch {
                toast("Failed to save participant", "error");
              }
            }}
          >
            Save participant
          </button>
        </div>
      )}

    </div>
  );
}

function ShiftScheduleTab({ toast, allJobs, allUsers, loadJobs }) {
  const [editing, setEditing] = useState({}); // { [jobId]: "2026-07-08T14:00" }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const toLocalInputValue = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const saveSchedule = async (jobId) => {
    const value = editing[jobId];
    if (!value) {
      toast("Pick a date and time first", "warn");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${jobId}/reschedule`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: new Date(value).toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast("Schedule saved ✓", "success");
      setEditing((p) => {
        const n = { ...p };
        delete n[jobId];
        return n;
      });
      loadJobs();
    } catch (e) {
      toast("Failed to save schedule", "error");
    }
  };

  const activeJobs = allJobs
    .filter((j) => j.stage !== "invoiced")
    .sort((a, b) => {
      const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return at - bt;
    });

  return (
    <div>
      <div className="page-title">Shift & Schedule</div>
      <div className="page-sub">
        Set or change when each job happens · Staff are assigned at job creation
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Client</th>
                <th>Assigned staff</th>
                <th>Stage</th>
                <th>Scheduled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeJobs.map((j) => {
                const currentValue = editing[j.id] ?? toLocalInputValue(j.scheduled_at);
                const hasChange = editing[j.id] !== undefined;
                return (
                  <tr key={j.id}>
                    <td className="nm">{j.service_type}</td>
                    <td style={{ fontSize: 11 }}>{j.client?.full_name || "—"}</td>
                    <td style={{ fontSize: 11 }}>
                      {(j.assignments || []).length
                        ? j.assignments.map((a) => a.user?.full_name || "?").join(", ")
                        : <span style={{ color: T.red }}>Unassigned</span>}
                    </td>
                    <td>
                      <span className={`badge ${stageColor(j.stage)}`}>
                        {stageLabel(j.stage)}
                      </span>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        className="fi"
                        style={{ fontSize: 11, padding: "4px 6px" }}
                        value={currentValue}
                        onChange={(e) =>
                          setEditing((p) => ({ ...p, [j.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      {hasChange && (
                        <button className="btn btn-xs btn-p" onClick={() => saveSchedule(j.id)}>
                          Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!activeJobs.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: T.muted, padding: "20px 0" }}>
                    No active jobs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CRMBoard({ toast }) {
  const [tab, setTab] = useState("jobs");
  const [board, setBoard] = useState({ job_scheduled: [], staff_assigned: [], arrived_at_site: [], completed: [], invoiced: [] });
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sugg, setSugg] = useState([]);
  const [search, setSearch] = useState("");
  const [svcF, setSvcF] = useState("");
  const [selJob, setSelJob] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [af, setAF] = useState({
    client: "",
    phone: "",
    address: "",
    service: "",
    desc: "",
    tools: [],
    price: "",
    estHours: "",
    scheduled: "",
    assignedTo: [],
  });
  const setA = (k) => (v) => setAF((f) => ({ ...f, [k]: v }));
  const setAe = (k) => (e) => setAF((f) => ({ ...f, [k]: e.target.value }));

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadJobs = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBoard(json.data || { job_scheduled: [], staff_assigned: [], arrived_at_site: [], completed: [], invoiced: [] });
    } catch (e) {
      toast("Failed to load jobs", "error");
    }
  };

  const loadClients = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setClients(json.data || []);
    } catch (e) { /* silent */ }
  };

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setAllUsers(json.data || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    loadJobs();
    loadClients();
    loadUsers();
  }, []);

  
  // Real-time: refresh the board the moment a job or assignment changes
  // anywhere (stage advance, new assignment, reschedule) — no manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel("crm-jobs-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_jobs" }, () => loadJobs())
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_job_assignments" }, () => loadJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const allJobs = Object.values(board).flat().filter(Boolean);
  const STAGES = [
    "job_scheduled",
    "staff_assigned",
    "arrived_at_site",
    "completed",
    "invoiced",
  ];
  const SCOLORS = {
    job_scheduled: T.muted,
    staff_assigned: T.blue,
    arrived_at_site: T.amber,
    completed: T.green,
    invoiced: T.pink,
  };
  const SICONS = {
    job_scheduled: "📅",
    staff_assigned: "👷",
    arrived_at_site: "📍",
    completed: "✅",
    invoiced: "🧾",
  };

  const advance = async (jobId, newStage) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${jobId}/stage`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
      await loadJobs();
      if (selJob?.id === jobId) {
        setSelJob((prev) => (prev ? { ...prev, stage: newStage } : prev));
      }
    } catch (e) {
      toast("Failed to advance stage", "error");
    }
  };

  const saveJob = async () => {
    if (!af.client || !af.address || !af.service) {
      toast("Client, address, and job type required", "warn");
      return;
    }
    if (!af.assignedTo || af.assignedTo.length === 0) {
      toast("Assign at least one staff member", "warn");
      return;
    }
    try {
      const token = await getToken();
      const clientRes = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/clients`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: af.client, phone: af.phone, address: af.address, email: "", notes: "" }),
      });
      if (!clientRes.ok) throw new Error("client");
      const client = (await clientRes.json()).data;

      const jobRes = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          service_type: af.service,
          address: af.address,
          description: af.desc,
          tools_used: af.tools,
          scheduled_at: af.scheduled ? new Date(af.scheduled).toISOString() : null,
          price: parseFloat(af.price) || 0,
          estimated_hours: parseFloat(af.estHours) || 0,
          notes: "",
          assigned_to: af.assignedTo,
        }),
      });
      if (!jobRes.ok) throw new Error("job");

      if (af.service && !sugg.includes(af.service)) setSugg((p) => [af.service, ...p]);
      setShowAdd(false);
      setAF({ client: "", phone: "", address: "", service: "", desc: "", tools: [], price: "", estHours: "", scheduled: "", assignedTo: [] });
      toast("Job created ✓", "success");
      loadJobs();
      loadClients();
    } catch (e) {
      toast("Failed to create job", "error");
    }
  };

  const startEdit = (job) => {
    setEditForm({
      service_type: job.service_type,
      address: job.address,
      description: job.description || "",
      tools_used: job.tools_used || [],
      price: job.price,
    });
    setEditMode(true);
  };

  const saveJobEdit = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${selJob.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: editForm.service_type,
          address: editForm.address,
          description: editForm.description,
          tools_used: editForm.tools_used,
          price: parseFloat(editForm.price) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()).data;
      toast("Job updated ✓", "success");
      setEditMode(false);
      setEditForm(null);
      await loadJobs();
      setSelJob((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (e) {
      toast("Failed to update job", "error");
    }
  };

  const deleteJob = async (jobId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast("Job deleted", "success");
      setSelJob(null);
      loadJobs();
    } catch (e) {
      toast("Failed to delete job", "error");
    }
  };

  const toggleAssign = async (job, u) => {
    const alreadyAssigned = (job.assignments || []).some((a) => a.user_id === u.id);
    try {
      const token = await getToken();
      if (alreadyAssigned) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${job.id}/assign/${u.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${job.id}/assign`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: u.id, role_on_job: "support" }),
        });
        if (!res.ok) throw new Error();
      }
      toast((alreadyAssigned ? "Removed " : "Assigned ") + u.full_name + " ✓", "success");
      const token2 = await getToken();
      const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      const json2 = await res2.json();
      const freshBoard = json2.data || {};
      setBoard(freshBoard);
      const flat = Object.values(freshBoard).flat();
      const fresh = flat.find((j) => j.id === job.id);
      if (fresh) setSelJob(fresh);
    } catch (e) {
      toast("Failed to update assignment", "error");
    }
  };

  const fList = (list) =>
    list.filter(
      (j) =>
        (!search ||
          (j.client?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
          j.service_type.toLowerCase().includes(search.toLowerCase())) &&
        (!svcF || j.service_type.toLowerCase().includes(svcF.toLowerCase()))
    );

  const staffJobCounts = React.useMemo(() => {
    const m = {};
    allJobs.forEach((j) => {
      if (j.stage === "completed" || j.stage === "invoiced") return;
      (j.assignments || []).forEach((a) => {
        m[a.user_id] = (m[a.user_id] || 0) + 1;
      });
    });
    return m;
  }, [allJobs]);

  return (
    <div>
      {selJob && (
        <Modal
          title={editMode ? "Edit job" : selJob.service_type}
          sub={(selJob.client?.full_name || "Client") + " · " + selJob.address}
          onClose={() => { setSelJob(null); setEditMode(false); setEditForm(null); }}
          footer={
            editMode ? (
              <>
                <button className="btn" onClick={() => { setEditMode(false); setEditForm(null); }}>
                  Cancel
                </button>
                <button className="btn btn-p" onClick={saveJobEdit}>
                  Save changes
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn"
                  style={{ color: T.red, borderColor: T.red + "44" }}
                  onClick={() => {
                    if (window.confirm("Delete this job permanently? This cannot be undone.")) {
                      deleteJob(selJob.id);
                    }
                  }}
                >
                  Delete
                </button>
                <button className="btn" onClick={() => setSelJob(null)}>
                  Close
                </button>
                <button className="btn" onClick={() => startEdit(selJob)}>
                  Edit
                </button>
                {selJob.stage === "completed" && (
                  <button
                    className="btn btn-p"
                    onClick={() => {
                      advance(selJob.id, "invoiced");
                      toast("Moved to Invoiced ✓", "success");
                    }}
                  >
                    Advance → Invoiced
                  </button>
                )}
              </>
            )
          }
        >
          {editMode && editForm ? (
            <>
              <div className="ff">
                <label className="fl">Job type</label>
                <input
                  className="fi2"
                  value={editForm.service_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, service_type: e.target.value }))}
                />
              </div>
              <div className="ff">
                <label className="fl">Job site address</label>
                <input
                  className="fi2"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="ff">
                <label className="fl">Quoted price ($)</label>
                <input
                  className="fi2"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="ff">
                <label className="fl">Tools / equipment</label>
                <TagInput
                  value={editForm.tools_used}
                  onChange={(v) => setEditForm((f) => ({ ...f, tools_used: v }))}
                  placeholder="Type a tool, press Enter…"
                />
              </div>
              <div className="ff">
                <label className="fl">Job description</label>
                <textarea
                  className="ftxt"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </>
          ) : (
          <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              [
                "Stage",
                <span className={`badge ${stageColor(selJob.stage)}`}>
                  {stageLabel(selJob.stage || "")}
                </span>,
              ],
              ["Price", "$" + (Number(selJob.price)?.toFixed(2) || "0.00")],
              ["Client phone", selJob.client?.phone || "—"],
              ["Scheduled", selJob.scheduled_at ? new Date(selJob.scheduled_at).toLocaleString() : "—"],
              [
                "Assigned staff",
                (selJob.assignments || []).length ? (
                  selJob.assignments.map((a) => a.user?.full_name || a.user_id).join(", ")
                ) : (
                  <span style={{ color: T.red }}>Unassigned</span>
                ),
              ],
            ].map(([k, v], i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          {selJob.description && (
            <>
              <div className="divider" />
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
                {selJob.description}
              </div>
            </>
          )}
          {selJob.tools_used?.length > 0 && (
            <>
              <div className="divider" />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selJob.tools_used.map((t, i) => (
                  <span key={i} className="badge b-gr">
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
          <div className="divider" />
          <div style={{ marginBottom: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: ".05em",
                marginBottom: 7,
              }}
            >
              Assign staff to this job
            </div>
            <div
              style={{
                display: "flex",
                gap: 7,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {allUsers.filter((u) => u.role === "staff").map((u) => {
                const assigned = (selJob.assignments || []).some((a) => a.user_id === u.id);
                const activeCount = staffJobCounts[u.id] || 0;
                return (
                  <button
                    key={u.id}
                    className={`btn btn-sm${assigned ? " btn-p" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() => toggleAssign(selJob, u)}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: assigned
                          ? T.pink2 + "66"
                          : "rgba(255,255,255,.08)",
                        border: `1px solid ${
                          assigned ? T.pink : "var(--border2)"
                        }`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        flexShrink: 0,
                      }}
                    >
                      {assigned ? "✓" : ""}
                    </span>
                    <span>{u.full_name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: assigned ? "rgba(255,255,255,.6)" : T.muted,
                        fontFamily: "monospace",
                      }}
                    >
                      {u.display_id || "ID pending"}
                    </span>
                    {activeCount >= 3 && (
                      <span style={{ fontSize: 8, color: T.amber }}>⚠</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>
              ⚠ orange = already at 3+ active jobs · Click to toggle assignment
            </div>
          </div>
        </>
          )}
        </Modal>
      )}

      {showAdd && (
        <Modal
          title="New job"
          sub="Starts at Scheduled stage"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={saveJob}>
                Create job
              </button>
            </>
          }
        >
          <div className="frow2">
            <div className="ff">
              <label className="fl">Client name</label>
              <input
                className="fi2"
                value={af.client}
                onChange={setAe("client")}
                placeholder="Client or company"
              />
            </div>
            <div className="ff">
              <label className="fl">Phone</label>
              <input
                className="fi2"
                value={af.phone}
                onChange={setAe("phone")}
                placeholder="206-555-0100"
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Job site address</label>
            <input
              className="fi2"
              value={af.address}
              onChange={setAe("address")}
              placeholder="123 Main St, Seattle WA"
            />
          </div>
          <div className="ff">
            <label className="fl">
              Job type{" "}
              <span style={{ color: T.pink, fontWeight: 400 }}>
                — type freely, no fixed list, suggestions auto-save
              </span>
            </label>
            <ServiceInput
              value={af.service}
              onChange={setA("service")}
              suggestions={sugg}
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Quoted price ($)</label>
              <input
                className="fi2"
                type="number"
                value={af.price}
                onChange={setAe("price")}
                placeholder="150.00"
              />
            </div>
            <div className="ff">
              <label className="fl">
                Estimated hours{" "}
                <span style={{ color: T.amber, fontWeight: 400 }}>
                  — used for staff payroll
                </span>
              </label>
              <input
                className="fi2"
                type="number"
                step="0.5"
                value={af.estHours}
                onChange={setAe("estHours")}
                placeholder="e.g. 3"
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">
              Assign staff{" "}
              <span style={{ color: T.pink, fontWeight: 400 }}>
                — select one or more, required
              </span>
            </label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 4 }}>
              {allUsers.filter((u) => u.role === "staff").map((u) => {
                const checked = af.assignedTo.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`btn btn-sm${checked ? " btn-p" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                    onClick={() =>
                      setAF((f) => ({
                        ...f,
                        assignedTo: checked
                          ? f.assignedTo.filter((id) => id !== u.id)
                          : [...f.assignedTo, u.id],
                      }))
                    }
                  >
                    <span
                      style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: checked ? T.pink2 + "66" : "rgba(255,255,255,.08)",
                        border: `1px solid ${checked ? T.pink : "var(--border2)"}`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                      }}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    {u.full_name}
                  </button>
                );
              })}
              {allUsers.filter((u) => u.role === "staff").length === 0 && (
                <div style={{ fontSize: 11, color: T.muted }}>No staff accounts yet.</div>
              )}
            </div>
          </div>
          <div className="ff">
            <label className="fl">Tools / equipment</label>
            <TagInput
              value={af.tools}
              onChange={setA("tools")}
              placeholder="Type a tool, press Enter…"
            />
          </div>
          <div className="ff">
            <label className="fl">Job description</label>
            <textarea
              className="ftxt"
              value={af.desc}
              onChange={setAe("desc")}
              placeholder="Details, special instructions…"
            />
          </div>
          <div className="ff">
            <label className="fl">Scheduled date & time</label>
            <input
              className="fi2"
              type="datetime-local"
              value={af.scheduled}
              onChange={setAe("scheduled")}
            />
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 3,
        }}
      >
        <div className="page-title" style={{ marginBottom: 0 }}>
          CRM · Job Funnel
        </div>
        <span className="badge b-p" style={{ fontSize: 10 }}>
          🔐 Admin only
        </span>
      </div>
      <div className="page-sub">
        Free-text job types · Staff IDs · Visible to Admins only
      </div>
      <div className="tabs">
        {[
          ["jobs", "Job Board", allJobs.length],
          ["clients", "Clients", clients.length],
          ["staff", "Staff & Workload", allUsers.filter((u) => u.role === "staff").length],
          ["schedule", "Shift & Schedule", allJobs.filter((j) => j.scheduled_at).length],
        ].map(([k, l, n]) => (
          <button
            key={k}
            className={`tab${tab === k ? " on" : ""}`}
            onClick={() => setTab(k)}
          >
            {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>

      {tab === "jobs" && (
        <>
          <div className="frow">
            <input
              className="fi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or clients…"
              style={{ flex: 1, maxWidth: 240 }}
            />
            <input
              className="fi"
              value={svcF}
              onChange={(e) => setSvcF(e.target.value)}
              placeholder="Filter by job type…"
              style={{ maxWidth: 200 }}
            />
            <button className="btn btn-p" onClick={() => setShowAdd(true)}>
              + New job
            </button>
          </div>
          <div className="kanban-scroll">
            <div className="kanban">
              {STAGES.map((stage) => {
                const list = fList(board[stage] || []);
                return (
                  <div
                    key={stage}
                    className={`kb-col${
                      dragOver === stage ? " drag-over" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(stage);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      if (dragItem && dragItem.fromStage !== stage) {
                        advance(dragItem.job.id, stage);
                        toast(
                          `${dragItem.job.service_type} → ${stageLabel(stage)} ✓`,
                          "success"
                        );
                      }
                      setDragItem(null);
                    }}
                  >
                    <div className="kb-hdr">
                      <span className="kb-ht" style={{ color: SCOLORS[stage] }}>
                        {SICONS[stage]} {stageLabel(stage)}
                      </span>
                      <span className="kb-n">{list.length}</span>
                    </div>
                    <div className="kb-body">
                      {list.map((job) => (
                        <div
                          key={job.id}
                          className={`kbc${
                            dragItem?.job?.id === job.id ? " dragging" : ""
                          }`}
                          draggable
                          onDragStart={() => setDragItem({ job, fromStage: stage })}
                          onDragEnd={() => setDragItem(null)}
                          onClick={() => setSelJob(job)}
                        >
                          <div className="kbc-t">{job.service_type}</div>
                          <div className="kbc-c">👤 {job.client?.full_name || "—"}</div>
                          <div
                            style={{
                              fontSize: 10,
                              color: T.muted,
                              marginBottom: 4,
                            }}
                          >
                            📍 {job.address.split(",")[0]}
                          </div>
                          <div className="kbc-m">
                            <span className="badge b-gr">${job.price}</span>
                            {(job.assignments || []).length ? (
                              <span className="badge b-g">
                                {job.assignments.length} staff
                              </span>
                            ) : (
                              <span className="badge b-r">Unassigned</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {!list.length && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--border2)",
                            padding: "6px 3px",
                            textAlign: "center",
                          }}
                        >
                          No jobs
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "clients" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Jobs</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} onClick={() => toast("Client: " + c.full_name)}>
                    <td className="nm">{c.full_name}</td>
                    <td>{c.phone}</td>
                    <td style={{ fontSize: 11 }}>{c.address}</td>
                    <td>
                      <span className="badge b-p">
                        {allJobs.filter((j) => j.client_id === c.id).length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="g3">
          {allUsers.filter((u) => u.role === "staff").map((u) => {
            const activeCount = staffJobCounts[u.id] || 0;
            return (
              <div key={u.id} className="card card-hover">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 11,
                  }}
                >
                  <div className="av av-md">
                    {(u.full_name || "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
                      {u.full_name}
                    </div>
                    <IdBadge uid={u.display_id} />
                  </div>
                  {u.office && <OfficePill o={u.office} />}
                </div>
                <div style={{ textAlign: "center", marginBottom: 9 }}>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: activeCount >= 3 ? T.amber : T.white,
                    }}
                  >
                    {activeCount}
                  </div>
                  <div style={{ fontSize: 9, color: T.muted }}>Active jobs</div>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "rgba(255,255,255,.07)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: Math.min(activeCount / 5, 1) * 100 + "%",
                      background:
                        activeCount >= 4 ? T.red : activeCount >= 2 ? T.amber : T.green,
                      borderRadius: 2,
                      transition: "width .3s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 5 }}>
                  ★ Multiple concurrent job assignments supported
                </div>
              </div>
            );
          })}
        </div>
      )}
    {tab === "schedule" && (
        <ShiftScheduleTab toast={toast} allJobs={allJobs} allUsers={allUsers} loadJobs={loadJobs} />
      )}
    </div>
  );
}

function Tasks({ toast, user, pendingTaskId, clearPendingTask }) {
  const [tasks, setTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [markDoneTask, setMarkDoneTask] = useState(null);
  const [doneNote, setDoneNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    to: "",
    due: "",
    pri: "normal",
    desc: "",
  });
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const usersById = React.useMemo(() => {
    const m = {};
    allUsers.forEach((u) => { m[u.id] = u; });
    return m;
  }, [allUsers]);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadTasks = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTasks(json.data || []);
    } catch (e) {
      toast("Failed to load tasks", "error");
    }
  };

  const loadAssignableUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // non-admins can't list users yet; dropdown stays empty
      const json = await res.json();
      const users = json.data || [];
      setAllUsers(users);
      setAssignableUsers(users.filter((u) => u.role === "admin" || u.role === "manager"));
    } catch (e) { /* silent — dropdown just stays empty */ }
  };

  const uploadTaskFile = async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    const path = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("Organization Document").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("Organization Document").getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name };
  };

  const attachFileToTask = async (taskId, file) => {
    setUploadingFor(taskId);
    try {
      const { url, name } = await uploadTaskFile(file);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: url, file_name: name }),
      });
      if (!res.ok) throw new Error();
      toast("File attached ✓", "success");
      loadTasks();
    } catch (e) {
      toast("Failed to attach file", "error");
    } finally {
      setUploadingFor(null);
    }
  };

  useEffect(() => {
    loadTasks();
    loadAssignableUsers();
  }, []);

  // Jump to and highlight a task when arriving via a notification click
  useEffect(() => {
    if (!pendingTaskId || tasks.length === 0) return;
    const el = document.querySelector(`[data-task-id="${pendingTaskId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("task-row-highlight");
      const t = setTimeout(() => el.classList.remove("task-row-highlight"), 2500);
      clearPendingTask && clearPendingTask();
      return () => clearTimeout(t);
    }
  }, [pendingTaskId, tasks]);

  // Real-time: push a toast + refresh the moment a task-related notification
  // lands for this user, instead of waiting for a manual refresh.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("tasks-notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new;
          if (n && ["task_assigned", "task_started", "task_ready_for_review", "task_completed"].includes(n.type)) {
            toast(n.body, "info");
            loadTasks();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const pct = tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "done").length / tasks.length) * 100
      )
    : 0;
  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);
  const isAdmin = user?.role === "admin";

  return (
    <div>
      {showAdd && (
        <Modal
          title="New task"
          sub="Assignee starts it · you mark it complete"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={async () => {
                  if (!form.title || !form.to) {
                    toast("Title and assignee required", "warn");
                    return;
                  }
                  try {
                    const token = await getToken();
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({
                        job_id: null,
                        assigned_to: form.to,
                        title: form.title,
                        description: form.desc,
                        priority: form.pri,
                        due_at: form.due ? new Date(form.due).toISOString() : null,
                      }),
                    });
                    if (!res.ok) throw new Error();
                    const created = (await res.json()).data;
                    const assigneeName = usersById[form.to]?.display_id || "assignee";
                    if (newFiles.length && created?.id) {
                      for (const file of newFiles) {
                        try {
                          const { url, name } = await uploadTaskFile(file);
                          await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${created.id}/attachments`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ file_url: url, file_name: name }),
                          });
                        } catch (e) { /* one file failing shouldn't block the rest */ }
                      }
                    }
                    toast("Task created — " + assigneeName + " notified ✓", "success");
                    setShowAdd(false);
                    setForm({ title: "", to: "", due: "", pri: "normal", desc: "" });
                    setAssignSearch("");
                    setNewFiles([]);
                    loadTasks();
                  } catch (e) {
                    toast("Failed to create task", "error");
                  }
                }}
              >
                Create task
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Task title</label>
            <input
              className="fi2"
              value={form.title}
              onChange={setF("title")}
              placeholder="What needs to be done?"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Assign to (admins/managers only)</label>
              <input
                className="fi2"
                list="task-assignee-list"
                value={assignSearch}
                onChange={(e) => {
                  const typed = e.target.value;
                  setAssignSearch(typed);
                  const match = assignableUsers.find(
                    (u) => `${u.full_name} (${u.display_id || "pending"})` === typed
                  );
                  setForm((f) => ({ ...f, to: match ? match.id : "" }));
                }}
                placeholder="Search by name…"
              />
              <datalist id="task-assignee-list">
                {assignableUsers.map((u) => (
                  <option key={u.id} value={`${u.full_name} (${u.display_id || "pending"})`} />
                ))}
              </datalist>
            </div>
            <div className="ff">
              <label className="fl">Priority</label>
              <select className="fsel" value={form.pri} onChange={setF("pri")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="ff">
            <label className="fl">Due date</label>
            <input
              className="fi2"
              type="date"
              value={form.due}
              onChange={setF("due")}
            />
          </div>
          <div className="ff">
            <label className="fl">Description</label>
            <textarea
              className="ftxt"
              value={form.desc}
              onChange={setF("desc")}
              placeholder="Context and details…"
            />
          </div>
          <div className="ff">
            <label className="fl">Attachments (optional, multiple allowed)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            />
            {newFiles.length > 0 && (
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                {newFiles.map((f) => f.name).join(", ")}
              </div>
            )}
          </div>
          <div className="info-box pink" style={{ marginTop: 6 }}>
            <span style={{ color: T.pink, fontWeight: 600 }}>
              Ownership rule:{" "}
            </span>
            The assignee moves this from Open → In Progress, and can notify
            you when it's ready without closing it. Only you (the assigner)
            can mark it Done.
          </div>
        </Modal>
      )}

      {markDoneTask && (
        <Modal
          title="Mark task as done"
          sub={markDoneTask.title}
          onClose={() => {
            setMarkDoneTask(null);
            setDoneNote("");
          }}
          footer={
            <>
              <button
                className="btn"
                onClick={() => {
                  setMarkDoneTask(null);
                  setDoneNote("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-g"
                onClick={async () => {
                  try {
                    const token = await getToken();
                    const res = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/tasks/${markDoneTask.id}/status`,
                      {
                        method: "PATCH",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "done" }),
                      }
                    );
                    if (!res.ok) throw new Error();
                    setMarkDoneTask(null);
                    setDoneNote("");
                    toast("Task done — assigner notified ✓", "success");
                    loadTasks();
                  } catch (e) {
                    toast("Failed to mark task done", "error");
                  }
                }}
              >
                Confirm done ✓
              </button>
            </>
          }
        >
          <div
            style={{
              fontSize: 12,
              color: T.sub,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Marking this complete will notify{" "}
            <b style={{ color: T.text }}>
              {usersById[markDoneTask.created_by]?.display_id || "the assigner"}
            </b>{" "}
            that you've finished.
          </div>
          <div className="ff">
            <label className="fl">Completion note (optional)</label>
            <textarea
              className="ftxt"
              value={doneNote}
              onChange={(e) => setDoneNote(e.target.value)}
              placeholder="How it was completed, any notes…"
            />
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 15,
        }}
      >
        <div>
          <div className="page-title">Tasks & Roles</div>
          <div className="page-sub">
            Admins assign to admins/managers · Assignee starts it · Assigner
            marks it done
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-p" onClick={() => setShowAdd(true)}>
            + New task
          </button>
        )}
      </div>

      <div className="g3" style={{ marginBottom: 15 }}>
        <div
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div className="prod-ring" style={{ "--pct": pct + "%" }}>
            <span className="prod-ring-v">{pct}%</span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>
              Team productivity
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.white }}>
              {tasks.filter((t) => t.status === "done").length}/{tasks.length}{" "}
              done
            </div>
          </div>
        </div>
        <div className="card">
          <div
            style={{
              fontSize: 10,
              color: T.muted,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            State ownership
          </div>
          {[
            ["Assigner", "Creates the task, marks it Done", T.blue],
            ["Assignee", "Open → In Progress, then notifies you", T.green],
            ["Files", "Either side can attach files anytime", T.pink],
          ].map(([r, d, c], i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                color: T.sub,
                padding: "4px 0",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: c, fontWeight: 600 }}>{r}:</span> {d}
            </div>
          ))}
        </div>
        <div className="card">
          {[
            ["open", T.amber, "Open"],
            ["in_progress", T.blue, "In Progress"],
            ["done", T.green, "Done"],
          ].map(([s, c, l]) => (
            <div
              key={s}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: s !== "done" ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: T.sub }}>{l}</span>
              <span className={`badge ${statusColor(s)}`}>
                {tasks.filter((t) => t.status === s).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="tabs">
        {[
          ["all", "All", tasks.length],
          ["open", "Open", tasks.filter((t) => t.status === "open").length],
          [
            "in_progress",
            "In Progress",
            tasks.filter((t) => t.status === "in_progress").length,
          ],
          ["done", "Done", tasks.filter((t) => t.status === "done").length],
        ].map(([k, l, n]) => (
          <button
            key={k}
            className={`tab${filter === k ? " on" : ""}`}
            onClick={() => setFilter(k)}
          >
            {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned by</th>
                <th>Assigned to</th>
                <th>Due</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Files</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isAssignee = t.assigned_to === user?.id;
                const isAssigner = t.created_by === user?.id;
                return (
                <tr key={t.id} data-task-id={t.id}>
                  <td className="nm">
                    {t.title}
                    {t.ready_for_review && t.status === "in_progress" && (
                      <div style={{ fontSize: 10, color: T.amber, marginTop: 2 }}>
                        ⏳ Ready for your review
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    <IdBadge uid={usersById[t.created_by]?.display_id} />
                  </td>
                  <td>
                    <IdBadge uid={usersById[t.assigned_to]?.display_id || t.assignee?.display_id} />
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {t.due_at ? new Date(t.due_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {t.priority === "urgent" ? (
                      <span className="badge b-r">Urgent</span>
                    ) : (
                      <span className="badge b-gr">Normal</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusColor(t.status)}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ fontSize: 10 }}>
                    {(t.attachments || []).map((a) => (
                      <div key={a.id}>
                        <a href={a.file_url} target="_blank" rel="noreferrer" style={{ color: T.pink }}>
                          📎 {a.file_name}
                        </a>
                      </div>
                    ))}
                    {(isAssignee || isAssigner) && (
                      <label style={{ cursor: "pointer", color: T.muted, display: "inline-block", marginTop: 2 }}>
                        {uploadingFor === t.id ? "Uploading…" : "+ Add file"}
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) attachFileToTask(t.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {t.status === "done" ? (
                      <span className="badge b-g">✓ Done</span>
                    ) : t.status === "open" && isAssignee ? (
                      <button
                        className="btn btn-xs"
                        style={{ borderColor: T.amber, color: T.amber }}
                        onClick={async () => {
                          try {
                            const token = await getToken();
                            const res = await fetch(
                              `${import.meta.env.VITE_API_URL}/api/tasks/${t.id}/status`,
                              {
                                method: "PATCH",
                                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "in_progress" }),
                              }
                            );
                            if (!res.ok) throw new Error();
                            toast("Moved to In Progress — assigner notified");
                            loadTasks();
                          } catch (e) {
                            toast("Failed to update task", "error");
                          }
                        }}
                      >
                        Start →
                      </button>
                    ) : t.status === "in_progress" && isAssignee ? (
                      <button
                        className="btn btn-xs"
                        disabled={t.ready_for_review}
                        style={{ borderColor: T.pink, color: T.pink }}
                        onClick={async () => {
                          try {
                            const token = await getToken();
                            const res = await fetch(
                              `${import.meta.env.VITE_API_URL}/api/tasks/${t.id}/notify-ready`,
                              {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            if (!res.ok) throw new Error();
                            toast("Assigner notified ✓", "success");
                            loadTasks();
                          } catch (e) {
                            toast("Failed to notify assigner", "error");
                          }
                        }}
                      >
                        {t.ready_for_review ? "Assigner notified ✓" : "I'm done — notify assigner"}
                      </button>
                    ) : t.status === "in_progress" && isAssigner ? (
                      <button
                        className="btn btn-xs btn-g"
                        onClick={() => setMarkDoneTask(t)}
                      >
                        Mark done ✓
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, color: T.muted }}>—</span>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Finance ───────────────────────────────────────────────────────────────────
function generatePayStub(p) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>Pay Stub — ${p.user?.full_name || "Staff"}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .sub { color: #666; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td { padding: 8px 0; border-bottom: 1px solid #eee; }
          td:last-child { text-align: right; font-weight: 600; }
          .net { font-size: 18px; font-weight: 700; border-top: 2px solid #111; }
        </style>
      </head>
      <body>
        <h1>SCP-STK Hub — Pay Stub</h1>
        <div class="sub">${p.user?.full_name || "Staff"} (${p.user?.display_id || "—"}) · Pay period: ${p.period || ""}</div>
        <table>
          <tr><td>Total hours</td><td>${(p.total_hours || 0).toFixed(1)}h</td></tr>
          <tr><td>Hourly rate</td><td>$${(p.hourly_rate || 0).toFixed(2)}/h</td></tr>
          <tr><td>Gross pay</td><td>$${(p.gross_pay || 0).toFixed(2)}</td></tr>
          <tr><td>Adjustment</td><td>${(p.adjustment || 0) >= 0 ? "+" : ""}$${(p.adjustment || 0).toFixed(2)}</td></tr>
          <tr class="net"><td>Net pay</td><td>$${(p.net_pay || 0).toFixed(2)}</td></tr>
          ${p.paid ? `<tr><td>Paid</td><td>$${(p.paid_amount || 0).toFixed(2)} on ${p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ""}</td></tr>` : ""}
        </table>
        <p style="margin-top:32px; color:#999; font-size:11px;">Generated ${new Date().toLocaleString()} · Use your browser's Print → Save as PDF to download.</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

function generateFinanceReport(summary, jobRevenue, ledger) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = (arr, cols) =>
    arr.map((r) => `<tr>${cols.map((c) => `<td>${c(r)}</td>`).join("")}</tr>`).join("");
  w.document.write(`
    <html>
      <head>
        <title>Financial Report — ${summary?.period || ""}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; margin-top: 28px; }
          .sub { color: #666; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
          .cards { display: flex; gap: 16px; margin-top: 16px; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; flex: 1; }
          .card .lbl { font-size: 10px; color: #888; text-transform: uppercase; }
          .card .val { font-size: 20px; font-weight: 700; margin-top: 4px; }
        </style>
      </head>
      <body>
        <h1>SCP-STK Hub — Financial Report</h1>
        <div class="sub">Period: ${summary?.period || ""} · Generated ${new Date().toLocaleString()}</div>
        <div class="cards">
          <div class="card"><div class="lbl">Invoiced Revenue</div><div class="val">$${(summary?.invoiced_revenue || 0).toFixed(2)}</div></div>
          <div class="card"><div class="lbl">Pipeline Value</div><div class="val">$${(summary?.pipeline_value || 0).toFixed(2)}</div></div>
          <div class="card"><div class="lbl">Other Revenue</div><div class="val">$${(summary?.other_revenue || 0).toFixed(2)}</div></div>
          <div class="card"><div class="lbl">Other Expenses</div><div class="val">$${(summary?.other_expenses || 0).toFixed(2)}</div></div>
          <div class="card"><div class="lbl">Payroll Due</div><div class="val">$${(summary?.payroll_due || 0).toFixed(2)}</div></div>
        </div>
        <h2>Job Revenue (${jobRevenue.length})</h2>
        <table>
          <tr><th>Service</th><th>Client</th><th>Stage</th><th>Amount</th></tr>
          ${rows(jobRevenue, [
            (r) => r.service_type,
            (r) => r.client_name,
            (r) => r.stage,
            (r) => (r.payment_amount != null ? "$" + Number(r.payment_amount).toFixed(2) : "—"),
          ])}
        </table>
        <h2>Other Revenue &amp; Expenses (${ledger.length})</h2>
        <table>
          <tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr>
          ${rows(ledger, [
            (r) => new Date(r.entry_date).toLocaleDateString(),
            (r) => r.entry_type,
            (r) => r.description,
            (r) => "$" + Number(r.amount).toFixed(2),
          ])}
        </table>
        <p style="margin-top:32px; color:#999; font-size:11px;">Use your browser's Print → Save as PDF to download this report.</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
  w.document.close();
}

function Finance({ toast }) {
  const [topTab, setTopTab] = useState("workforce");
  const [subTab, setSubTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState([]);
  const [jobRevenue, setJobRevenue] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [hoursInputs, setHoursInputs] = useState({});
  const [adjInputs, setAdjInputs] = useState({});
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [jobPayModal, setJobPayModal] = useState(null);
  const [jobPayAmount, setJobPayAmount] = useState("");
  const [jobPayFile, setJobPayFile] = useState(null);
  const [showLedgerAdd, setShowLedgerAdd] = useState(false);
  const [lf, setLf] = useState({ entry_type: "revenue", description: "", amount: "", entry_date: new Date().toISOString().slice(0, 10), file: null });

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const uploadReceipt = async (file) => {
    if (!file) return "";
    const { data: { session } } = await supabase.auth.getSession();
    const path = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("Organization Document").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("Organization Document").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const loadSummary = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSummary(json.data || null);
    } catch (e) {
      toast("Failed to load finance summary", "error");
    }
  };

  const loadPayroll = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setPayroll(json.data || []);
    } catch (e) {
      toast("Failed to load payroll", "error");
    }
  };

  const loadJobRevenue = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/job-revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setJobRevenue(json.data || []);
    } catch (e) {
      toast("Failed to load job revenue", "error");
    }
  };

  const loadLedger = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setLedger(json.data || []);
    } catch (e) {
      toast("Failed to load ledger", "error");
    }
  };

  useEffect(() => {
    loadSummary();
    loadPayroll();
    loadJobRevenue();
    loadLedger();
  }, []);

  const saveHours = async (userId) => {
    const hours = parseFloat(hoursInputs[userId]?.hours);
    const rate = parseFloat(hoursInputs[userId]?.rate);
    if (isNaN(hours) || isNaN(rate)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${userId}/hours`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hours, rate }),
      });
      if (!res.ok) throw new Error();
      toast("Hours saved ✓", "success");
      loadPayroll();
      loadSummary();
    } catch (e) {
      toast("Failed to save hours", "error");
    }
  };

  const saveAdjustment = async (userId) => {
    const value = parseFloat(adjInputs[userId]);
    if (isNaN(value)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${userId}/adjust`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: value, reason: "" }),
      });
      if (!res.ok) throw new Error();
      toast("Adjustment saved ✓", "success");
      loadPayroll();
      loadSummary();
    } catch (e) {
      toast("Failed to save adjustment", "error");
    }
  };

  const confirmLogPayment = async () => {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount < 0) {
      toast("Enter a valid amount", "warn");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${payModal.user_id}/log-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      toast("Payment logged ✓", "success");
      setPayModal(null);
      setPayAmount("");
      loadPayroll();
      loadSummary();
    } catch (e) {
      toast("Failed to log payment", "error");
    }
  };

  const confirmJobPayment = async () => {
    if (!jobPayModal) return;
    const amount = parseFloat(jobPayAmount);
    if (isNaN(amount) || amount < 0) {
      toast("Enter a valid amount", "warn");
      return;
    }
    try {
      const receiptUrl = await uploadReceipt(jobPayFile);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/crm/jobs/${jobPayModal.job_id}/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount, receipt_url: receiptUrl }),
      });
      if (!res.ok) throw new Error();
      toast("Payment recorded ✓", "success");
      setJobPayModal(null);
      setJobPayAmount("");
      setJobPayFile(null);
      loadJobRevenue();
      loadSummary();
    } catch (e) {
      toast("Failed to record payment", "error");
    }
  };

  const submitLedgerEntry = async () => {
    if (!lf.description || !lf.amount) {
      toast("Description and amount required", "warn");
      return;
    }
    try {
      const receiptUrl = await uploadReceipt(lf.file);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/ledger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_type: lf.entry_type,
          description: lf.description,
          amount: parseFloat(lf.amount) || 0,
          receipt_url: receiptUrl,
          entry_date: lf.entry_date,
        }),
      });
      if (!res.ok) throw new Error();
      toast("Entry added ✓", "success");
      setShowLedgerAdd(false);
      setLf({ entry_type: "revenue", description: "", amount: "", entry_date: new Date().toISOString().slice(0, 10), file: null });
      loadLedger();
      loadSummary();
    } catch (e) {
      toast("Failed to add entry", "error");
    }
  };

  const deleteLedgerEntry = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/ledger/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast("Entry deleted", "success");
      loadLedger();
      loadSummary();
    } catch (e) {
      toast("Failed to delete entry", "error");
    }
  };

  return (
    <div>
      {payModal && (
        <Modal
          title="Log payment"
          sub={(payModal.user?.full_name || "Staff") + " · " + (summary?.period || "")}
          onClose={() => { setPayModal(null); setPayAmount(""); }}
          footer={
            <>
              <button className="btn" onClick={() => { setPayModal(null); setPayAmount(""); }}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={confirmLogPayment}>
                Confirm payment
              </button>
            </>
          }
        >
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 12, lineHeight: 1.6 }}>
            Only log this once the payment has actually been made. Calculated net pay is{" "}
            <b style={{ color: T.text }}>${(payModal.net_pay || 0).toFixed(2)}</b>.
          </div>
          <div className="ff">
            <label className="fl">Amount paid ($)</label>
            <input
              className="fi2"
              type="number"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={(payModal.net_pay || 0).toFixed(2)}
            />
          </div>
        </Modal>
      )}

      {jobPayModal && (
        <Modal
          title="Record payment"
          sub={jobPayModal.service_type + " — " + jobPayModal.client_name}
          onClose={() => { setJobPayModal(null); setJobPayAmount(""); setJobPayFile(null); }}
          footer={
            <>
              <button className="btn" onClick={() => { setJobPayModal(null); setJobPayAmount(""); setJobPayFile(null); }}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={confirmJobPayment}>
                Save
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Amount received ($)</label>
            <input
              className="fi2"
              type="number"
              step="0.01"
              value={jobPayAmount}
              onChange={(e) => setJobPayAmount(e.target.value)}
              placeholder="150.00"
            />
          </div>
          <div className="ff">
            <label className="fl">Payment screenshot / receipt</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setJobPayFile(e.target.files?.[0] || null)} />
          </div>
        </Modal>
      )}

      {showLedgerAdd && (
        <Modal
          title="New revenue / expense entry"
          onClose={() => setShowLedgerAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowLedgerAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={submitLedgerEntry}>
                Save entry
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Type</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {["revenue", "expense"].map((t) => (
                <button
                  key={t}
                  className={`btn btn-sm${lf.entry_type === t ? " btn-p" : ""}`}
                  style={{ flex: 1, textTransform: "capitalize" }}
                  onClick={() => setLf((f) => ({ ...f, entry_type: t }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="ff">
            <label className="fl">Description</label>
            <input
              className="fi2"
              value={lf.description}
              onChange={(e) => setLf((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Grant disbursement, office supplies…"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Amount ($)</label>
              <input
                className="fi2"
                type="number"
                step="0.01"
                value={lf.amount}
                onChange={(e) => setLf((f) => ({ ...f, amount: e.target.value }))}
                placeholder="100.00"
              />
            </div>
            <div className="ff">
              <label className="fl">Date</label>
              <input
                className="fi2"
                type="date"
                value={lf.entry_date}
                onChange={(e) => setLf((f) => ({ ...f, entry_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Receipt / screenshot (optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setLf((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          Finance & Payroll
        </div>
        <span className="badge b-p" style={{ fontSize: 10 }}>
          🔐 Admin only
        </span>
      </div>
      <div className="page-sub" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Period: {summary?.period || ""}</span>
        <button className="btn btn-sm" onClick={() => generateFinanceReport(summary, jobRevenue, ledger)}>
          📄 Generate monthly report
        </button>
      </div>
      <div className="fin-grid">
        <div className="fin-card">
          <div className="fin-lbl">Invoiced revenue</div>
          <div className="fin-val" style={{ color: T.green }}>
            ${(summary?.invoiced_revenue || 0).toLocaleString()}
          </div>
        </div>
        <div className="fin-card">
          <div className="fin-lbl">Pipeline value</div>
          <div className="fin-val" style={{ color: T.amber }}>
            ${(summary?.pipeline_value || 0).toLocaleString()}
          </div>
        </div>
        <div className="fin-card">
          <div className="fin-lbl">Payroll due</div>
          <div className="fin-val" style={{ color: T.pink }}>
            ${Math.round(summary?.payroll_due || 0).toLocaleString()}
          </div>
        </div>
        <div className="fin-card">
          <div className="fin-lbl">Total jobs</div>
          <div className="fin-val">{summary?.total_jobs || 0}</div>
        </div>
      </div>

      <div className="tabs">
        {[
          ["workforce", "Workforce Revenue"],
          ["other", "Other Revenue & Expenses"],
        ].map(([k, l]) => (
          <button
            key={k}
            className={`tab${topTab === k ? " on" : ""}`}
            onClick={() => setTopTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {topTab === "workforce" && (
        <>
          <div className="tabs" style={{ marginTop: 10 }}>
            {[
              ["overview", "Overview"],
              ["payroll", "Payroll"],
            ].map(([k, l]) => (
              <button
                key={k}
                className={`tab${subTab === k ? " on" : ""}`}
                onClick={() => setSubTab(k)}
              >
                {l}
              </button>
            ))}
          </div>

          {subTab === "overview" && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Client</th>
                      <th>Stage</th>
                      <th>Payment</th>
                      <th>Receipt</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobRevenue.map((j) => (
                      <tr key={j.job_id}>
                        <td className="nm" style={{ fontSize: 11 }}>{j.service_type}</td>
                        <td style={{ fontSize: 11 }}>{j.client_name}</td>
                        <td>
                          <span className={`badge ${stageColor(j.stage)}`}>{stageLabel(j.stage)}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: j.payment_amount != null ? T.green : T.muted }}>
                          {j.payment_amount != null ? "$" + Number(j.payment_amount).toFixed(2) : "Not entered"}
                        </td>
                        <td>
                          {j.receipt_url ? (
                            <a href={j.receipt_url} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 11 }}>
                              View
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: T.muted }}>—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-xs"
                            onClick={() => {
                              setJobPayModal(j);
                              setJobPayAmount(j.payment_amount != null ? String(j.payment_amount) : "");
                            }}
                          >
                            {j.payment_amount != null ? "Edit payment" : "Enter payment"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!jobRevenue.length && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: T.muted, padding: "20px 0" }}>
                          No completed or invoiced jobs yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === "payroll" && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>ID</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Gross pay</th>
                      <th>Adjustment</th>
                      <th>Net pay</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((p) => (
                      <tr key={p.user_id}>
                        <td className="nm">{p.user?.full_name}</td>
                        <td>
                          <IdBadge uid={p.user?.display_id} />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="fi"
                            style={{ width: 60, padding: "3px 6px", fontSize: 11 }}
                            defaultValue={p.total_hours || ""}
                            placeholder="0"
                            onChange={(e) =>
                              setHoursInputs((prev) => ({
                                ...prev,
                                [p.user_id]: { ...prev[p.user_id], hours: e.target.value, rate: prev[p.user_id]?.rate ?? p.hourly_rate },
                              }))
                            }
                            onBlur={() => saveHours(p.user_id)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="fi"
                            style={{ width: 60, padding: "3px 6px", fontSize: 11 }}
                            defaultValue={p.hourly_rate || ""}
                            placeholder="0"
                            onChange={(e) =>
                              setHoursInputs((prev) => ({
                                ...prev,
                                [p.user_id]: { ...prev[p.user_id], rate: e.target.value, hours: prev[p.user_id]?.hours ?? p.total_hours },
                              }))
                            }
                            onBlur={() => saveHours(p.user_id)}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>${(p.gross_pay || 0).toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            className="fi"
                            style={{ width: 76, padding: "3px 6px", fontSize: 11 }}
                            value={adjInputs[p.user_id] ?? (p.adjustment || 0)}
                            placeholder="0.00"
                            onChange={(e) => setAdjInputs((prev) => ({ ...prev, [p.user_id]: e.target.value }))}
                            onBlur={() => saveAdjustment(p.user_id)}
                          />
                        </td>
                        <td style={{ color: T.green, fontWeight: 700 }}>
                          ${(p.net_pay || 0).toFixed(2)}
                          {p.paid && (
                            <div style={{ fontSize: 9, color: T.muted, fontWeight: 400 }}>
                              ✓ Paid ${((p.paid_amount || 0)).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td style={{ display: "flex", gap: 5 }}>
                          <button
                            className="btn btn-xs"
                            onClick={() => { setPayModal(p); setPayAmount((p.net_pay || 0).toFixed(2)); }}
                          >
                            {p.paid ? "Re-log" : "Log payment"}
                          </button>
                          <button className="btn btn-xs btn-p" onClick={() => generatePayStub(p)}>
                            Pay stub
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!payroll.length && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", color: T.muted, padding: "20px 0" }}>
                          No staff accounts yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {topTab === "other" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 10 }}>
            <button className="btn btn-p" onClick={() => setShowLedgerAdd(true)}>
              + New entry
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 11 }}>{new Date(e.entry_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${e.entry_type === "revenue" ? "b-g" : "b-r"}`} style={{ textTransform: "capitalize" }}>
                          {e.entry_type}
                        </span>
                      </td>
                      <td className="nm" style={{ fontSize: 11 }}>{e.description}</td>
                      <td style={{ fontWeight: 700, color: e.entry_type === "revenue" ? T.green : T.red }}>
                        ${Number(e.amount).toFixed(2)}
                      </td>
                      <td>
                        {e.receipt_url ? (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 11 }}>
                            View
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: T.muted }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs"
                          style={{ color: T.red, borderColor: T.red + "44" }}
                          onClick={() => {
                            if (window.confirm("Delete this entry?")) deleteLedgerEntry(e.id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!ledger.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: T.muted, padding: "20px 0" }}>
                        No entries this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Grants({ toast, user }) {
  const [grantsList, setGrantsList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selGrant, setSelGrant] = useState(null);
  const [gf, setGF] = useState({
    title: "",
    funder: "",
    amount: "",
    stage: "incoming",
    deadline: "",
    priority: "normal",
    desc: "",
    link: "",
    assigned: "",
  });

  const usersById = React.useMemo(() => {
    const m = {};
    allUsers.forEach((u) => { m[u.id] = u; });
    return m;
  }, [allUsers]);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadGrants = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/grants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setGrantsList(json.data || []);
    } catch (e) {
      toast("Failed to load grants", "error");
    }
  };

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setAllUsers(json.data || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    loadGrants();
    loadUsers();
  }, []);

  const grants = React.useMemo(() => {
    const grouped = { incoming: [], applied: [], in_progress: [], completed: [] };
    grantsList.forEach((g) => {
      if (grouped[g.stage]) grouped[g.stage].push(g);
    });
    return grouped;
  }, [grantsList]);

  const stages = [
    { key: "incoming", l: "Incoming", c: T.muted },
    { key: "applied", l: "Applied", c: T.blue },
    { key: "in_progress", l: "In Progress", c: T.amber },
    { key: "completed", l: "Completed", c: T.green },
  ];

  const advance = async (id, from) => {
    const keys = ["incoming", "applied", "in_progress", "completed"];
    const to = keys[keys.indexOf(from) + 1];
    if (!to) {
      toast("Already at completed stage");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/grants/${id}/stage`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stage: to }),
      });
      if (!res.ok) throw new Error();
      toast("Grant advanced to " + to.replace("_", " ") + " ✓", "success");
      loadGrants();
    } catch (e) {
      toast("Failed to advance grant", "error");
    }
  };

  return (
    <div>
      {showAdd && (
        <Modal
          title="New grant"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={async () => {
                  if (!gf.title || !gf.funder) {
                    toast("Title and funder required", "warn");
                    return;
                  }
                  try {
                    const token = await getToken();
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/grants`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: gf.title,
                        funder: gf.funder,
                        amount: parseFloat(gf.amount) || 0,
                        stage: gf.stage,
                        deadline: gf.deadline ? new Date(gf.deadline).toISOString() : null,
                        priority: gf.priority,
                        description: gf.desc,
                        link: gf.link,
                        assigned_to: gf.assigned || null,
                      }),
                    });
                    if (!res.ok) throw new Error();
                    setShowAdd(false);
                    setGF({
                      title: "",
                      funder: "",
                      amount: "",
                      stage: "incoming",
                      deadline: "",
                      priority: "normal",
                      desc: "",
                      link: "",
                      assigned: "",
                    });
                    toast("Grant added ✓", "success");
                    loadGrants();
                  } catch (e) {
                    toast("Failed to add grant", "error");
                  }
                }}
              >
                Add grant
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Grant title</label>
            <input
              className="fi2"
              value={gf.title}
              onChange={(e) => setGF((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. DLIR Workforce Development 2027"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Funder / Organization</label>
              <input
                className="fi2"
                value={gf.funder}
                onChange={(e) =>
                  setGF((f) => ({ ...f, funder: e.target.value }))
                }
                placeholder="e.g. WA DLIR"
              />
            </div>
            <div className="ff">
              <label className="fl">Amount ($)</label>
              <input
                className="fi2"
                type="number"
                value={gf.amount}
                onChange={(e) =>
                  setGF((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="50000"
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Description</label>
            <textarea
              className="ftxt"
              value={gf.desc}
              onChange={(e) => setGF((f) => ({ ...f, desc: e.target.value }))}
              placeholder="What this grant is for, key requirements, notes…"
              style={{ minHeight: 70 }}
            />
          </div>
          <div className="ff">
            <label className="fl">Grant link / URL (optional)</label>
            <input
              className="fi2"
              value={gf.link}
              onChange={(e) => setGF((f) => ({ ...f, link: e.target.value }))}
              placeholder="https://funder.org/grants"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Priority</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[
                  ["normal", "Normal", T.muted],
                  ["high", "High", T.amber],
                  ["urgent", "Urgent", T.red],
                ].map(([k, l, c]) => (
                  <button
                    key={k}
                    className={`btn btn-sm${gf.priority === k ? " btn-p" : ""}`}
                    style={{
                      flex: 1,
                      borderColor: gf.priority === k ? c : undefined,
                      color: gf.priority === k ? "#fff" : c,
                      background: gf.priority === k ? c + "cc" : "transparent",
                    }}
                    onClick={() => setGF((f) => ({ ...f, priority: k }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="ff">
              <label className="fl">Assign to board member</label>
              <select
                className="fsel"
                value={gf.assigned}
                onChange={(e) =>
                  setGF((f) => ({ ...f, assigned: e.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {allUsers
                  .filter((u) => u.role === "admin" || u.role === "manager")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_id || "ID pending"} · {u.full_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Initial stage</label>
              <select
                className="fsel"
                value={gf.stage}
                onChange={(e) =>
                  setGF((f) => ({ ...f, stage: e.target.value }))
                }
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="ff">
              <label className="fl">Deadline</label>
              <input
                className="fi2"
                type="date"
                value={gf.deadline}
                onChange={(e) =>
                  setGF((f) => ({ ...f, deadline: e.target.value }))
                }
              />
            </div>
          </div>
        </Modal>
      )}
      {selGrant && (
        <Modal
          title={selGrant.title}
          sub={selGrant.funder}
          onClose={() => setSelGrant(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              [
                "Amount",
                selGrant.amount ? `$${Number(selGrant.amount).toLocaleString()}` : "—",
              ],
              ["Deadline", selGrant.deadline ? new Date(selGrant.deadline).toLocaleDateString() : "—"],
              [
                "Assigned",
                selGrant.assigned_to ? (
                  <IdBadge uid={usersById[selGrant.assigned_to]?.display_id} />
                ) : (
                  <span style={{ color: T.muted }}>Unassigned</span>
                ),
              ],
              [
                "Priority",
                <span
                  className={`badge${
                    selGrant.priority === "urgent"
                      ? " b-r"
                      : selGrant.priority === "high"
                      ? " b-a"
                      : " b-gr"
                  }`}
                  style={{ textTransform: "capitalize" }}
                >
                  {selGrant.priority || "normal"}
                </span>,
              ],
            ].map(([k, v], i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          {selGrant.description && (
            <>
              <div className="divider" />
              <div
                style={{
                  fontSize: 12,
                  color: T.sub,
                  lineHeight: 1.7,
                  marginBottom: 10,
                }}
              >
                {selGrant.description}
              </div>
            </>
          )}
          {selGrant.link && (
            <>
              <div className="divider" />
                <a
                href={selGrant.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  color: T.blue,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                🔗{" "}
                <span style={{ textDecoration: "underline" }}>
                  {selGrant.link}
                </span>
              </a>
            </>
          )}
        </Modal>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 15,
        }}
      >
        <div>
          <div className="page-title">Grants & Funding</div>
          <div className="page-sub">
            Pipeline · Applications · Assignment · Tracking
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setShowAdd(true)}>
          + New grant
        </button>
      </div>
      <div className="grant-pipe">
        {stages.map(({ key, l, c }) => (
          <div key={key} className="grant-col">
            <div className="grant-col-h">
              <span className="grant-col-t" style={{ color: c }}>
                {l}
              </span>
              <span className="kb-n">{(grants[key] || []).length}</span>
            </div>
            <div className="grant-col-body">
              {(grants[key] || []).map((g) => (
                <div
                  key={g.id}
                  className="grant-card"
                  onClick={() => setSelGrant(g)}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 3,
                      borderRadius: "3px 0 0 3px",
                      background:
                        g.priority === "urgent"
                          ? T.red
                          : g.priority === "high"
                          ? T.amber
                          : "var(--border2)",
                    }}
                  />
                  <div style={{ paddingLeft: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 4,
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.white,
                          lineHeight: 1.3,
                          flex: 1,
                        }}
                      >
                        {g.title}
                      </div>
                      {g.priority && g.priority !== "normal" && (
                        <span
                          className={`badge${
                            g.priority === "urgent" ? " b-r" : " b-a"
                          }`}
                          style={{
                            fontSize: 9,
                            flexShrink: 0,
                            textTransform: "capitalize",
                          }}
                        >
                          {g.priority}
                        </span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: 10, color: T.muted, marginBottom: 5 }}
                    >
                      🏛️ {g.funder}
                    </div>
                    {g.description && (
                      <div
                        style={{
                          fontSize: 10,
                          color: T.muted,
                          lineHeight: 1.4,
                          marginBottom: 5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {g.description}
                      </div>
                    )}
                    {g.amount > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: T.green,
                          fontWeight: 700,
                          marginBottom: 5,
                        }}
                      >
                        ${Number(g.amount).toLocaleString()}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        marginBottom: key !== "completed" ? 6 : 0,
                      }}
                    >
                      {g.deadline && (
                        <span className="badge b-a" style={{ fontSize: 9 }}>
                          {new Date(g.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {g.assigned_to ? (
                        <IdBadge uid={usersById[g.assigned_to]?.display_id} />
                      ) : (
                        <span className="badge b-gr" style={{ fontSize: 9 }}>
                          Unassigned
                        </span>
                      )}
                      {g.link && (
                        <span style={{ fontSize: 9, color: T.blue }}>
                          🔗 Link
                        </span>
                      )}
                    </div>
                    {key !== "completed" && (
                      <button
                        className="btn btn-xs btn-p"
                        style={{ marginTop: 3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          advance(g.id, key);
                        }}
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!(grants[key] || []).length && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--border2)",
                    padding: "5px 3px",
                    textAlign: "center",
                  }}
                >
                  No grants
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Voting ────────────────────────────────────────────────────────────────────
function Voting({ toast, user }) {
  const [resolutions, setResolutions] = useState([]);
  const [voters, setVoters] = useState({}); // { resolutionId: [voterStatus...] }
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rf, setRF] = useState({ title: "", body: "", duration: "24", file: null });

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadResolutions = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resolutions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setResolutions(json.data || []);
    } catch (e) { toast("Failed to load resolutions", "error"); }
  };

  const loadVoters = async (resId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resolutions/${resId}/voters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setVoters((p) => ({ ...p, [resId]: json.data || [] }));
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    loadResolutions();
  }, []);

  useEffect(() => {
    resolutions.forEach((r) => loadVoters(r.id));
  }, [resolutions.length]);

  const uploadDocument = async (file) => {
    const token = await getToken();
    const { data: { session } } = await supabase.auth.getSession();
    const path = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("Organization Document")
      .upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("Organization Document")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const submitResolution = async () => {
    if (!rf.title.trim()) {
      toast("Title required", "warn");
      return;
    }
    setUploading(true);
    try {
      let documentUrl = "";
      if (rf.file) {
        documentUrl = await uploadDocument(rf.file);
      }
      const token = await getToken();
      const now = new Date();
      const closesAt = new Date(now.getTime() + parseInt(rf.duration) * 60 * 60 * 1000);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resolutions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rf.title,
          body: rf.body,
          opens_at: now.toISOString(),
          closes_at: closesAt.toISOString(),
          document_url: documentUrl,
        })
      });
      if (!res.ok) throw new Error();
      toast(`Resolution proposed — voting open for ${rf.duration}h ✓`, "success");
      setShowAdd(false);
      setRF({ title: "", body: "", duration: "24", file: null });
      loadResolutions();
    } catch (e) {
      toast("Failed to propose resolution", "error");
    } finally {
      setUploading(false);
    }
  };

  const castVote = async (resId, choice) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resolutions/${resId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ choice })
      });
      if (!res.ok) throw new Error();
      toast("Vote cast: " + choice + " ✓", "success");
      loadResolutions();
      loadVoters(resId);
    } catch (e) {
      toast("Failed to cast vote", "error");
    }
  };

  const timeLeft = (closesAt) => {
    const diff = new Date(closesAt) - new Date();
    if (diff <= 0) return "Closed";
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m left`;
  };

  return (
    <div>
      {showAdd && (
        <Modal
          title="Propose resolution"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={submitResolution} disabled={uploading}>
                {uploading ? "Submitting…" : "Propose"}
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Title</label>
            <input
              className="fi2"
              value={rf.title}
              onChange={(e) => setRF((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Approve Q3 budget amendment"
            />
          </div>
          <div className="ff">
            <label className="fl">Full description</label>
            <textarea
              className="ftxt"
              value={rf.body}
              onChange={(e) => setRF((f) => ({ ...f, body: e.target.value }))}
              placeholder="Describe the resolution in full…"
            />
          </div>
          <div className="ff">
            <label className="fl">Voting duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`btn${rf.duration === "24" ? " btn-p" : ""}`}
                onClick={() => setRF((f) => ({ ...f, duration: "24" }))}
              >
                24 hours
              </button>
              <button
                className={`btn${rf.duration === "72" ? " btn-p" : ""}`}
                onClick={() => setRF((f) => ({ ...f, duration: "72" }))}
              >
                72 hours
              </button>
            </div>
          </div>
          <div className="ff">
            <label className="fl">Attach document (optional)</label>
            <div
              className="upload-zone"
              onClick={() => document.getElementById("res-doc-input").click()}
            >
              <div style={{ fontSize: 28, marginBottom: 7 }}>📎</div>
              <div style={{ fontSize: 13, color: T.text, marginBottom: 3 }}>
                {rf.file ? rf.file.name : "Click to attach PDF"}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>PDF · Max 10MB</div>
            </div>
            <input
              id="res-doc-input"
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => setRF((f) => ({ ...f, file: e.target.files[0] }))}
            />
          </div>
        </Modal>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 17,
        }}
      >
        <div>
          <div className="page-title">Voting & Resolutions</div>
          <div className="page-sub">
            Board governance · Propose · Vote · Archive results
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setShowAdd(true)}>
          + Propose
        </button>
      </div>
      {resolutions.length === 0 && (
        <div style={{ color: T.muted, fontSize: 12, padding: "20px 0" }}>
          No resolutions yet.
        </div>
      )}
      {resolutions.map((r) => {
        const total = r.yes_count + r.no_count + r.abstain_count || 1;
        const closed = r.status !== "open" || new Date(r.closes_at) < new Date();
        const resVoters = voters[r.id] || [];
        const votedCount = resVoters.filter((v) => v.voted).length;

        return (
          <div
            key={r.id}
            className="card"
            style={{ marginBottom: 11, opacity: closed ? 0.72 : 1 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 11,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 3 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                  Proposed by {r.proposer?.full_name || "—"} ·{" "}
                  {closed ? "Closed" : timeLeft(r.closes_at)}
                </div>
                {r.document_url && (
                  <a
                    href={r.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: T.pink, textDecoration: "underline" }}
                  >
                    📄 View attached document
                  </a>
                )}
              </div>
              <span
                className={`badge${
                  r.status === "open" && !closed
                    ? " b-a"
                    : r.status === "passed"
                    ? " b-g"
                    : " b-r"
                }`}
                style={{ flexShrink: 0 }}
              >
                {closed && r.status === "open" ? "Closed" : r.status[0].toUpperCase() + r.status.slice(1)}
              </span>
            </div>

            {r.body && (
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 11, lineHeight: 1.6 }}>
                {r.body}
              </div>
            )}

            {[
              ["Yes", r.yes_count, T.green],
              ["No", r.no_count, T.red],
              ["Abstain", r.abstain_count, T.muted],
            ].map(([l, n, c]) => (
              <div key={l} className="vbw">
                <span className="vbl">{l}</span>
                <div className="vbb">
                  <div className="vbf" style={{ width: (n / total) * 100 + "%", background: c }} />
                </div>
                <span className="vbc">{n}</span>
              </div>
            ))}

            {resVoters.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
                {votedCount} of {resVoters.length} board members voted
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {resVoters.map((v) => (
                    <span
                      key={v.user_id}
                      className="badge"
                      style={{
                        background: v.voted ? "rgba(34,211,160,.12)" : "rgba(255,255,255,.06)",
                        color: v.voted ? T.green : T.muted,
                      }}
                      title={v.full_name}
                    >
                      {v.display_id || v.full_name.split(" ")[0]} {v.voted ? "✓" : "—"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!closed && (
              <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
                {["yes", "no", "abstain"].map((c) => (
                  <button
                    key={c}
                    className={`btn btn-sm${r.my_vote === c ? " btn-p" : ""}`}
                    disabled={!!r.my_vote}
                    style={{
                      textTransform: "capitalize",
                      opacity: r.my_vote && r.my_vote !== c ? 0.4 : 1,
                    }}
                    onClick={() => castVote(r.id, c)}
                  >
                    {c === "yes" ? "✓ Yes" : c === "no" ? "✗ No" : "— Abstain"}
                  </button>
                ))}
                {r.my_vote && (
                  <span style={{ fontSize: 11, color: T.green, alignSelf: "center" }}>
                    Your vote: {r.my_vote}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function Notifications({ toast, notifs, markRead, markAllRead, onNav, onTaskClick }) {
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">
            {unread} unread · Auto-triggered by job timers, task completions,
            votes, MOU alerts
          </div>
        </div>
        {unread > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => {
              markAllRead();
              toast("All marked as read ✓", "success");
            }}
          >
            Mark all read
          </button>
        )}
      </div>
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`notif-row${!n.read ? " unread" : ""}`}
          style={{ cursor: n.ref_id ? "pointer" : "default" }}
          onClick={() => {
            markRead(n.id);
            if (n.ref_id) {
              onTaskClick && onTaskClick(n.ref_id);
              onNav && onNav("tasks");
            }
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>
              {n.body}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
            </div>
          </div>
          {!n.read && <div className="notif-dot" />}
        </div>
      ))}
    </div>
  );
}

// ── Users & IDs (Admin only) ──────────────────────────────────────────────────
function UsersAndIDs({ toast, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.superAdmin === true;

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.data) setUsers(json.data);
      } catch (e) {
        toast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [idDrafts, setIdDrafts] = useState({});
  const updDraft = (id, val) =>
    setIdDrafts((p) => ({ ...p, [id]: val }));

  const saveDisplayID = async (u) => {
    const draftVal = idDrafts[u.id] ?? u.display_id ?? "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${u.id}/display-id`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ display_id: draftVal }),
        }
      );
      if (!res.ok) throw new Error();
      toast("ID " + draftVal + " assigned to " + u.full_name + " ✓", "success");
      setIdDrafts((p) => {
        const { [u.id]: _drop, ...rest } = p;
        return rest;
      });
      // Reload to reflect persisted state
      const { data: { session: s2 } } = await supabase.auth.getSession();
      const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${s2?.access_token}` }
      });
      const json2 = await res2.json();
      if (json2.data) setUsers(json2.data);
    } catch {
      toast("Failed to save ID", "error");
    }
  };

  const grantSuperAdmin = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      // Update role to admin directly in Supabase
      const { error } = await supabase
        .from("users")
        .update({ role: "admin" })
        .eq("id", userId);
      if (error) throw error;
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: "admin", superAdmin: true } : u));
      toast("Super admin access granted ✓", "success");
    } catch {
      toast("Failed to grant super admin", "error");
    }
  };

  return (
    <div>
      <div className="page-title">Users & IDs</div>
      <div className="page-sub">
        Assign ID badges to accounts after signup · Admin only
      </div>

      <div className="info-box pink" style={{ marginBottom: 15 }}>
        <span style={{ color: T.pink, fontWeight: 600 }}>How it works: </span>
        When anyone signs up, their account is created but has no ID. You assign
        the ID here (e.g. <b>ADM-001</b>, <b>MGR-003</b>, <b>STF-007</b>). The
        ID then appears in their sidebar, on job assignments, payroll, and
        resolution proposals. Format is flexible — you create and provide the
        IDs.
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 10,
            color: T.muted,
            marginBottom: 7,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            fontWeight: 700,
          }}
        >
          ID format examples
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {["ADM-001", "MGR-001", "STF-001", "PAR-001"].map((id) => (
            <IdBadge key={id} uid={id} />
          ))}
        </div>
      </div>

      <div className="sec-title" style={{ marginBottom: 10 }}>
        New signups — pending ID assignment
      </div>
      {users.filter((u) => !u.display_id || u.display_id === '').length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: T.muted,
            marginBottom: 16,
            padding: "10px 0",
          }}
        >
          No pending accounts. All users have IDs assigned.
        </div>
      ) : (
        users
          .filter((u) => !u.display_id || u.display_id === '')
          .map((u) => (
            <div key={u.id} className="uid-row">
              <div
                className="av"
                style={{ width: 32, height: 32, borderRadius: 8, fontSize: 11 }}
              >
                {(u.full_name || u.name || "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  {u.full_name || u.name}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{u.email}</div>
              </div>
              <span
                className={`badge${
                  u.role === "admin"
                    ? " b-p"
                    : u.role === "manager"
                    ? " b-v"
                    : " b-a"
                }`}
              >
                {u.role}
              </span>
              <span className="badge b-a" style={{ fontSize: 10 }}>
                No ID
              </span>
              <input
                className="uid-input"
                value={idDrafts[u.id] ?? u.display_id ?? ""}
                onChange={(e) => updDraft(u.id, e.target.value)}
                placeholder="e.g. MGR-003"
              />
              <button
                className="btn btn-sm btn-p"
                onClick={() => {
                  const draftVal = idDrafts[u.id] ?? u.display_id ?? "";
                  if (!draftVal.trim()) {
                    toast("Enter an ID first", "warn");
                    return;
                  }
                  saveDisplayID(u);
                }}
              >
                Save
              </button>
              {isSuperAdmin && !u.superAdmin && (
                <button
                  className="btn btn-sm"
                  style={{ color: T.pink, borderColor: T.pink + "44" }}
                  onClick={() => grantSuperAdmin(u.id)}
                  title="Grant super admin access (same as Daniyal)"
                >
                  ⭐ Super Admin
                </button>
              )}
            </div>
          ))
      )}

      <div className="sec-title" style={{ marginBottom: 10, marginTop: 18 }}>
        All accounts with IDs
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>ID</th>
                <th>Office</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {users
                  .filter((u) => u.display_id && u.display_id !== '')
                  .map((u) => ({
                    n: u.full_name || u.name || "—",
                    e: u.email || "—",
                    r: u.role,
                    id: u.display_id,
                    o: u.office || "—",
                    sa: u.role === "admin",
                  }))
                  .map((u, i) => (
                <tr key={i} onClick={() => toast(u.n + " · " + u.id + (u.sa ? " · Super Admin" : ""))}>
                  <td className="nm">{u.n}</td>
                  <td style={{ fontSize: 11, color: T.muted }}>{u.e}</td>
                  <td>
                    <span
                      className={`badge${
                        u.r === "admin"
                          ? " b-p"
                          : u.r === "manager"
                          ? " b-v"
                          : " b-a"
                      }`}
                    >
                      {u.r}
                    </span>
                  </td>
                  <td>
                    <IdBadge uid={u.id} />
                  </td>
                  <td>
                    {u.o !== "—" ? (
                      <OfficePill o={u.o} />
                    ) : (
                      <span style={{ color: T.muted }}>—</span>
                    )}
                  </td>
                  <td>
                    {u.sa ? <span className="badge b-p">⭐ Super Admin</span> : <span style={{ color: T.muted }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF SHELL — Workforce team only view
// ═══════════════════════════════════════════════════════════════════════════════
const STAFF_NAV = [
  { key: "myjobs", label: "My Jobs", icon: "🔧", section: "Work" },
  { key: "myhours", label: "My Hours", icon: "🕐", section: "Payroll" },
  { key: "mypaystub", label: "My Pay Stub", icon: "💵", section: "Payroll" },
  {
    key: "mynotifs",
    label: "Notifications",
    icon: "🔔",
    section: "Account",
  },
];

function StaffShell({ user, onLogout, toast }) {
  const { notifs, unread, markRead, markAllRead } = useNotifications(user);
  const [page, setPage] = useState("myjobs");
  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageLabel = STAFF_NAV.find((n) => n.key === page)?.label || "My Jobs";
  const sections = [...new Set(STAFF_NAV.map((n) => n.section))];

  const navTo = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const h = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const renderPage = () => {
    const p = {
      toast, user, notifs, markRead, markAllRead,
      onNav: navTo,
      pendingTaskId,
      onTaskClick: setPendingTaskId,
      clearPendingTask: () => setPendingTaskId(null),
    };
    switch (page) {
      case "myjobs":
        return <StaffMyJobs {...p} />;
      case "myhours":
        return <StaffMyHours {...p} />;
      case "mypaystub":
        return <StaffPayStub {...p} />;
      case "mynotifs":
        return <StaffNotifs {...p} />;
      default:
        return <StaffMyJobs {...p} />;
    }
  };

  // Bottom nav items for mobile (5 key actions)
  const bottomItems = [
    { key: "myjobs", icon: "🔧", label: "Jobs" },
    { key: "myhours", icon: "🕐", label: "Hours" },
    { key: "mypaystub", icon: "💵", label: "Pay" },
    {
      key: "mynotifs",
      icon: "🔔",
      label: "Alerts",
      dot: unread > 0,
    },
  ];

  return (
    <div className="shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sb-head">
          <div className="sb-mark">S</div>
          <div style={{ flex: 1 }}>
            <div className="sb-appname">
              SCP-<span>STK</span> Hub
            </div>
            <div className="sb-apporg">Save the Kids</div>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="sb-user">
          <div className="sb-user-row">
            <div className="av">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="sb-uname">{user.name}</div>
              <div className="sb-urole">Workforce Staff</div>
            </div>
          </div>
          <IdBadge uid={user.displayId || user.uid} />
        </div>
        <div className="sb-nav">
          {sections.map((sec) => (
            <div key={sec}>
              <div className="sb-section">{sec}</div>
              {STAFF_NAV.filter((n) => n.section === sec).map((n) => (
                <div
                  key={n.key}
                  className={`ni${page === n.key ? " on" : ""}`}
                  onClick={() => navTo(n.key)}
                >
                  <span className="ni-ic">{n.icon}</span>
                  {n.label}
                  {n.badge && <span className="ni-badge">{n.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="sb-foot">
          <div
            className="ni"
            style={{ padding: "7px 0", color: T.muted, fontSize: 11 }}
            onClick={onLogout}
          >
            <span className="ni-ic">→</span>
            Sign out
          </div>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div
              className="tb-title"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pageLabel}
            </div>
          </div>
          <div className="tb-right">
            
            <button
              className="btn btn-sm"
              onClick={() => navTo("mynotifs")}
              style={{ position: "relative" }}
            >
              🔔
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.pink,
                    border: "1px solid var(--dk)",
                  }}
                />
              )}
            </button>
          </div>
        </div>
        <div className="page-body has-bottom-nav">{renderPage()}</div>
      </div>
      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {bottomItems.map((item) => (
            <button
              key={item.key}
              className={`bn-item${page === item.key ? " on" : ""}`}
              onClick={() => navTo(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.dot && <span className="bn-dot" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Staff: My Jobs (assigned only + check-in / complete) ──────────────────────
function StaffMyJobs({ toast, user }) {
  const [jobs, setJobs] = useState([]);
  const [completeModal, setCompleteModal] = useState(null);
  const [actualHours, setActualHours] = useState("");
  const [completeNote, setCompleteNote] = useState("");
  const timer = useTimer(jobs.some((j) => j.arrived_at && j.stage === "arrived_at_site"));

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadJobs = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setJobs(json.data || []);
    } catch (e) {
      toast("Failed to load your jobs", "error");
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  
  // Real-time: refresh My Jobs the moment an admin assigns/reschedules/advances
  // a job — no manual refresh needed.
  useEffect(() => {
    const channel = supabase
      .channel("my-jobs-" + (user?.id || "anon"))
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_jobs" }, () => loadJobs())
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_job_assignments" }, () => loadJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const checkIn = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/my-jobs/${id}/checkin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast("Checked in ✓", "success");
      loadJobs();
    } catch (e) {
      toast("Failed to check in", "error");
    }
  };

  const markComplete = async () => {
    if (!actualHours) {
      toast("Enter actual hours worked", "warn");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/my-jobs/${completeModal.id}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ actual_hours: parseFloat(actualHours) || 0, note: completeNote }),
      });
      if (!res.ok) throw new Error();
      setCompleteModal(null);
      setActualHours("");
      setCompleteNote("");
      toast("Job marked complete · " + actualHours + "h logged · Admins notified ✓", "success");
      loadJobs();
    } catch (e) {
      toast("Failed to mark job complete", "error");
    }
  };

  return (
    <div>
      {completeModal && (
        <Modal
          title="Mark job complete"
          sub={completeModal.service_type + " — " + completeModal.address}
          onClose={() => {
            setCompleteModal(null);
            setActualHours("");
            setCompleteNote("");
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.sub,
              marginBottom: 13,
              lineHeight: 1.6,
            }}
          >
            Completing this job will log your actual hours and notify the admins. The job moves to Completed stage.
          </div>
          <div className="ff">
            <label className="fl">Actual hours worked</label>
            <input
              className="fi2"
              type="number"
              step="0.5"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
          <div className="ff">
            <label className="fl">Completion note (optional)</label>
            <textarea
              className="ftxt"
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              placeholder="Any notes about the job…"
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="btn"
              onClick={() => {
                setCompleteModal(null);
                setActualHours("");
              }}
            >
              Cancel
            </button>
            <button className="btn btn-g" onClick={markComplete}>
              Confirm complete ✓
            </button>
          </div>
        </Modal>
      )}

      <div className="page-title">My Jobs</div>
      <div className="page-sub">
        Your assigned jobs · Check in on arrival · Mark complete when done
      </div>

      {jobs.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "48px 20px", color: T.muted }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, color: T.text, marginBottom: 6 }}>
            All done for today
          </div>
          <div style={{ fontSize: 12 }}>
            No active jobs assigned to you right now.
          </div>
        </div>
      )}

      {jobs.map((job) => {
        const checkedIn = job.stage === "arrived_at_site";
        return (
          <div
            key={job.id}
            className={`my-job-card${checkedIn ? " active-job" : ""}`}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.white,
                    marginBottom: 3,
                  }}
                >
                  {job.service_type}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
                  📍 {job.address}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`badge ${stageColor(job.stage)}`}>
                    {stageLabel(job.stage)}
                  </span>
                </div>
              </div>
              {checkedIn && (
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>
                    Time on site
                  </div>
                  <div className="timer-display">{timer}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>
                    Arrived {job.arrived_at ? new Date(job.arrived_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: T.sub, marginBottom: 3 }}>
              <b style={{ color: T.text }}>Client:</b> {job.client?.full_name || "—"} · {job.client?.phone || "—"}
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>
              <b style={{ color: T.text }}>Scheduled:</b> {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : "—"}
            </div>

            {job.tools_used?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {job.tools_used.map((t, i) => (
                  <span key={i} className="badge b-gr">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {!checkedIn ? (
                <button
                  className="checkin-btn ci-in"
                  style={{ flex: 1 }}
                  onClick={() => checkIn(job.id)}
                >
                  📍 Check in — I've arrived
                </button>
              ) : (
                <button
                  className="btn btn-g"
                  style={{ flex: 1, padding: "11px 16px" }}
                  onClick={() => setCompleteModal(job)}
                >
                  Mark complete ✓
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StaffMyTasks({ toast }) {
  const [tasks, setTasks] = useState([]);
  const [doneModal, setDoneModal] = useState(null);
  const [note, setNote] = useState("");

  return (
    <div>
      {doneModal && (
        <Modal
          title="Mark task done"
          sub={doneModal.title}
          onClose={() => {
            setDoneModal(null);
            setNote("");
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.sub,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Completing this task will notify <IdBadge uid={doneModal.by} /> that
            you're done.
          </div>
          <div className="ff">
            <label className="fl">Completion note (optional)</label>
            <textarea
              className="ftxt"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any notes…"
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="btn"
              onClick={() => {
                setDoneModal(null);
                setNote("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-g"
              onClick={() => {
                setTasks((p) =>
                  p.map((t) =>
                    t.id === doneModal.id ? { ...t, status: "done" } : t
                  )
                );
                setDoneModal(null);
                setNote("");
                toast("Task done — assigner notified ✓", "success");
              }}
            >
              Done ✓
            </button>
          </div>
        </Modal>
      )}
      <div className="page-title">My Tasks</div>
      <div className="page-sub">
        Tasks assigned to you · Only you can mark them done
      </div>
      {tasks.map((t) => (
        <div
          key={t.id}
          className="card"
          style={{
            marginBottom: 9,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.text,
                marginBottom: 3,
              }}
            >
              {t.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Assigned by <IdBadge uid={t.by} /> · Due {t.due}
            </div>
          </div>
          <span className={`badge ${statusColor(t.status)}`}>
            {t.status.replace("_", " ")}
          </span>
          {t.status !== "done" ? (
            <button
              className="btn btn-sm btn-g"
              onClick={() => setDoneModal(t)}
            >
              Mark done ✓
            </button>
          ) : (
            <span className="badge b-g">✓ Done</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Staff: My Hours ───────────────────────────────────────────────────────────
function StaffMyHours({ toast }) {
  const entries = [];
  const total = entries.reduce((a, e) => a + e.h, 0);
  return (
    <div>
      <div className="page-title">My Hours</div>
      <div className="page-sub">
        Hours logged from completed jobs this period
      </div>
      <div className="g3" style={{ marginBottom: 16 }}>
        <div className="sc">
          <div className="sc-lbl">Total hours</div>
          <div className="sc-val">{total}</div>
          <div className="sc-d">This period</div>
        </div>
        <div className="sc">
          <div className="sc-lbl">Rate</div>
          <div className="sc-val" style={{ color: T.green }}>
            $22.50
          </div>
          <div className="sc-d">Per hour</div>
        </div>
        <div className="sc">
          <div className="sc-lbl">Gross pay</div>
          <div className="sc-val" style={{ color: T.pink }}>
            ${(total * 22.5).toFixed(2)}
          </div>
          <div className="sc-d">Before adjustments</div>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Job</th>
                <th>Service type</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} onClick={() => toast("Hours entry — " + e.d)}>
                  <td className="nm">{e.d}</td>
                  <td>
                    <span className="badge b-p">{e.h}h</span>
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    {e.job}
                  </td>
                  <td style={{ fontSize: 11 }}>{e.svc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Staff: Pay Stub ───────────────────────────────────────────────────────────
function StaffPayStub({ toast, user }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const periodLabel = p?.period || "";

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setP(json.data || null);
    } catch (e) {
      toast("Failed to load your pay stub", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live-update if an admin logs a payment or adjusts pay while this is open
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("my-payroll-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_adjustments" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (loading) {
    return (
      <div>
        <div className="page-title">My Pay Stub</div>
        <div className="page-sub">Loading…</div>
      </div>
    );
  }

  const hours = p?.total_hours || 0;
  const rate = p?.hourly_rate || 0;
  const gross = p?.gross_pay || 0;
  const adjustment = p?.adjustment || 0;
  const net = p?.net_pay || 0;

  return (
    <div>
      <div className="page-title">My Pay Stub</div>
      <div className="page-sub">
        {periodLabel} · Read-only — contact Admin for adjustments
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--fd)",
                fontSize: 18,
                color: T.white,
                marginBottom: 3,
              }}
            >
              Pay Stub
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              Period: {periodLabel}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
              {user?.full_name || "Staff Member"}
            </div>
            <IdBadge uid={user?.display_id} />
          </div>
        </div>
        {[
          ["Jobs this period", p?.job_count || 0],
          ["Hours worked", hours.toFixed(1) + "h"],
          ["Hourly rate", "$" + rate.toFixed(2) + "/hr"],
          ["Gross pay", "$" + gross.toFixed(2)],
          ["Adjustments", (adjustment >= 0 ? "+" : "") + "$" + adjustment.toFixed(2)],
        ].map(([k, v], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 12, color: T.sub }}>{k}</span>
            <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
              {v}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>
            Net pay
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
            ${net.toFixed(2)}
          </span>
        </div>
        {p?.paid ? (
          <div className="info-box" style={{ marginTop: 8 }}>
            <span style={{ color: T.green, fontWeight: 600 }}>✓ Paid: </span>
            ${(p.paid_amount || 0).toFixed(2)}
            {p.paid_at ? " on " + new Date(p.paid_at).toLocaleDateString() : ""}
          </div>
        ) : (
          <div className="info-box amber" style={{ marginTop: 8 }}>
            Payment not yet logged by admin for this period.
          </div>
        )}
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => generatePayStub(p)}
        >
          📄 Download PDF
        </button>
      </div>
    </div>
  );
}

function StaffNotifs({ toast, notifs, markRead, markAllRead, onNav, onTaskClick }) {
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">{unread} unread</div>
        </div>
        {unread > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => {
              markAllRead();
              toast("All read ✓", "success");
            }}
          >
            Mark all read
          </button>
        )}
      </div>
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`notif-row${!n.read ? " unread" : ""}`}
          style={{ cursor: n.ref_id ? "pointer" : "default" }}
          onClick={() => {
            markRead(n.id);
            if (n.ref_id) {
              onTaskClick && onTaskClick(n.ref_id);
              onNav && onNav("myjobs");
            }
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>
              {n.body}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
            </div>
          </div>
          {!n.read && <div className="notif-dot" />}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT SCHEDULE — Weekly calendar, drag staff onto job slots
// ═══════════════════════════════════════════════════════════════════════════════
function ShiftSchedule({ toast, user }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const hours = [
    "8am",
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
  ];

  const [shifts, setShifts] = useState({});

  const [showAssign, setShowAssign] = useState(null); // {day, hour}
  const [dragShift, setDragShift] = useState(null); // { key, shift }
  const [dragOverCell, setDragOverCell] = useState(null); // "Day-hour"
  const [selStaff, setSelStaff] = useState("");
  const [selJob, setSelJob] = useState("");
  const [view, setView] = useState("week"); // week | staff

  const staffList = [];
  const jobOptions = [
    "Deep House Cleaning",
    "Full Yard Maintenance",
    "Interior Painting",
    "Apartment Move",
    "Office Cleaning",
    "Pressure Washing",
    "Gutter Cleaning",
    "Snow Removal",
  ];
  const staffColors = {
    "STF-001": T.pink,
    "STF-002": T.blue,
    "STF-003": T.green,
    "STF-004": T.amber,
  };

  const getShiftsForCell = (day, hour) =>
    Object.entries(shifts)
      .filter(([k]) => k.startsWith(`${day}-${hour}`))
      .map(([k, v]) => ({ key: k, ...v }));

  const assignShift = () => {
    if (!selStaff || !selJob) {
      toast("Select staff and job", "warn");
      return;
    }
    const key = `${showAssign.day}-${showAssign.hour}`;
    const existing = getShiftsForCell(showAssign.day, showAssign.hour);
    const finalKey = existing.length ? key + existing.length : key;
    setShifts((p) => ({
      ...p,
      [finalKey]: {
        staff: selStaff,
        job: selJob,
        color: staffColors[selStaff.split(" · ")[0]] || T.muted,
      },
    }));
    setShowAssign(null);
    setSelStaff("");
    setSelJob("");
    toast(`${selStaff.split(" · ")[1]} assigned to ${selJob} ✓`, "success");
  };

  const removeShift = (key) => {
    setShifts((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    toast("Shift removed", "warn");
  };

  return (
    <div>
      {showAssign && (
        <Modal
          title={`Assign shift — ${fullDays[days.indexOf(showAssign.day)]} ${
            showAssign.hour
          }`}
          onClose={() => setShowAssign(null)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAssign(null)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={assignShift}>
                Assign shift
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Staff member</label>
            <select
              className="fsel"
              value={selStaff}
              onChange={(e) => setSelStaff(e.target.value)}
            >
              <option value="">Select staff…</option>
              {staffList.map((s) => (
                <option key={s.id} value={`${s.uid} · ${s.name}`}>
                  {s.name} ({s.uid}) — {s.jobs} active jobs
                </option>
              ))}
            </select>
          </div>
          <div className="ff">
            <label className="fl">Job / service</label>
            <select
              className="fsel"
              value={selJob}
              onChange={(e) => setSelJob(e.target.value)}
            >
              <option value="">Select job…</option>
              {jobOptions.map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
          </div>
          {selStaff &&
            (() => {
              const s = staffList.find((x) => selStaff.includes(x.uid));
              return s ? (
                <div className="info-box amber" style={{ marginTop: 8 }}>
                  ⚠ {s.name} currently has{" "}
                  <b>
                    {s.jobs} active job{s.jobs !== 1 ? "s" : ""}
                  </b>{" "}
                  this week.
                </div>
              ) : null;
            })()}
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">Shift Schedule</div>
          <div className="page-sub">
            Weekly view · Click any slot to assign · Drag shifts to reschedule ·
            Click a shift to remove
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button
            className={`btn${view === "week" ? " btn-p" : ""}`}
            onClick={() => setView("week")}
          >
            📅 Week
          </button>
          <button
            className={`btn${view === "staff" ? " btn-p" : ""}`}
            onClick={() => setView("staff")}
          >
            👷 By staff
          </button>
        </div>
      </div>

      {/* Staff workload summary */}
      <div
        style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}
      >
        {staffList.map((s) => {
          const myShifts = Object.values(shifts).filter((sh) =>
            sh.staff.includes(s.uid)
          );
          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "var(--cd)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                padding: "6px 10px",
              }}
            >
              <div
                className="av"
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 9,
                  borderRadius: 6,
                  background: staffColors[s.uid] || T.muted,
                }}
              >
                {s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 9, color: T.muted }}>
                  {myShifts.length} shift{myShifts.length !== 1 ? "s" : ""} this
                  week
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {view === "week" && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minWidth: 680 }}>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px repeat(7,1fr)",
                gap: 3,
                marginBottom: 3,
              }}
            >
              <div />
              {days.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.sub,
                    padding: "5px 0",
                    background: "var(--cd)",
                    borderRadius: "var(--r)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Hour rows */}
            {hours.map((hour) => (
              <div
                key={hour}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px repeat(7,1fr)",
                  gap: 3,
                  marginBottom: 3,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    textAlign: "right",
                    paddingRight: 8,
                    paddingTop: 8,
                    flexShrink: 0,
                  }}
                >
                  {hour}
                </div>
                {days.map((day) => {
                  const cellShifts = getShiftsForCell(day, hour);
                  return (
                    <div
                      key={day}
                      style={{
                        minHeight: 44,
                        background:
                          dragOverCell === `${day}-${hour}`
                            ? "rgba(242,7,133,.06)"
                            : "var(--dk)",
                        border: `1px solid ${
                          dragOverCell === `${day}-${hour}`
                            ? T.pink
                            : "var(--border)"
                        }`,
                        borderRadius: 6,
                        padding: 3,
                        cursor: "pointer",
                        transition: "all .13s",
                        position: "relative",
                      }}
                      onClick={() => setShowAssign({ day, hour })}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCell(`${day}-${hour}`);
                      }}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCell(null);
                        if (!dragShift) return;
                        const newKey =
                          `${day}-${hour}` +
                          (getShiftsForCell(day, hour).length > 0
                            ? getShiftsForCell(day, hour).length
                            : "");
                        setShifts((p) => {
                          const n = { ...p };
                          delete n[dragShift.key];
                          n[newKey] = dragShift.shift;
                          return n;
                        });
                        setDragShift(null);
                        toast(`Shift moved to ${day} ${hour} ✓`, "success");
                      }}
                    >
                      {cellShifts.map((sh) => (
                        <div
                          key={sh.key}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDragShift({
                              key: sh.key,
                              shift: {
                                staff: sh.staff,
                                job: sh.job,
                                color: sh.color,
                              },
                            });
                          }}
                          onDragEnd={() => setDragShift(null)}
                          style={{
                            background: sh.color + "22",
                            border: `1px solid ${sh.color}44`,
                            borderRadius: 4,
                            padding: "2px 5px",
                            marginBottom: 2,
                            fontSize: 9,
                            lineHeight: 1.4,
                            cursor: "grab",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeShift(sh.key);
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: sh.color,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sh.staff.split(" · ")[1]}
                          </div>
                          <div
                            style={{
                              color: T.muted,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sh.job}
                          </div>
                        </div>
                      ))}
                      {!cellShifts.length && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            color: "var(--border2)",
                            opacity: 0.5,
                          }}
                        >
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "staff" && (
        <div className="g2">
          {staffList.map((s) => {
            const myShifts = Object.entries(shifts).filter(([, sh]) =>
              sh.staff.includes(s.uid)
            );
            return (
              <div key={s.id} className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 11,
                  }}
                >
                  <div
                    className="av av-md"
                    style={{ background: staffColors[s.uid] || T.muted }}
                  >
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: T.white }}
                    >
                      {s.name}
                    </div>
                    <IdBadge uid={s.uid} />
                  </div>
                  <OfficePill o={s.office} />
                </div>
                {myShifts.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: T.muted,
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    No shifts this week
                  </div>
                ) : (
                  myShifts.map(([key, sh]) => {
                    const [day, hour] = key.split("-");
                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 0",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            background: sh.color + "22",
                            color: sh.color,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 20,
                            minWidth: 60,
                            textAlign: "center",
                          }}
                        >
                          {day} {hour}
                        </div>
                        <div style={{ flex: 1, fontSize: 11, color: T.text }}>
                          {sh.job}
                        </div>
                        <button
                          className="btn btn-xs"
                          style={{ color: T.red, borderColor: T.red + "44" }}
                          onClick={() => removeShift(key)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOU TRACKER — Partner agreements with expiry alerts
// ═══════════════════════════════════════════════════════════════════════════════
function MOUTracker({ toast, user }) {
  const [mous, setMous] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [mf, setMF] = useState({
    partner: "",
    type: "Employment Partnership",
    signed: "",
    expiry: "",
    assignedTo: "",
    value: "",
  });
  const setM = (k) => (e) => setMF((f) => ({ ...f, [k]: e.target.value }));

  const statusColor = (s) =>
    ({ active: "b-g", expiring: "b-a", expired: "b-r" }[s] || "b-gr");
  const statusLabel = (s) =>
    ({ active: "Active", expiring: "Expiring soon", expired: "Expired" }[s] ||
    s);
  const statusIcon = (s) =>
    ({ active: "✓", expiring: "⚠", expired: "✗" }[s] || "•");

  const expiryStats = {
    active: mous.filter((m) => m.status === "active").length,
    expiring: mous.filter((m) => m.status === "expiring").length,
    expired: mous.filter((m) => m.status === "expired").length,
  };

  return (
    <div>
      {showAdd && (
        <Modal
          title="New MOU / Contract"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={() => {
                  if (!mf.partner || !mf.expiry) {
                    toast("Partner name and expiry date required", "warn");
                    return;
                  }
                  setMous((p) => [
                    ...p,
                    { id: "MOU-00" + (p.length + 1), ...mf, status: "active" },
                  ]);
                  setShowAdd(false);
                  toast("MOU added ✓", "success");
                }}
              >
                Add MOU
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Partner / Organization</label>
            <input
              className="fi2"
              value={mf.partner}
              onChange={setM("partner")}
              placeholder="e.g. Nexus Solutions"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Agreement type</label>
              <select className="fsel" value={mf.type} onChange={setM("type")}>
                {[
                  "Employment Partnership",
                  "Referral Agreement",
                  "Program Partnership",
                  "Service Agreement",
                  "Grant Agreement",
                  "Subcontract",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="ff">
              <label className="fl">Assigned to</label>
              <select
                className="fsel"
                value={mf.assignedTo}
                onChange={setM("assignedTo")}
              >
                <option value="">Select…</option>
                {[
                  "ADM-001 · Jamie R.",
                  "MGR-001 · Dana K.",
                  "MGR-002 · Sam T.",
                ].map((n) => (
                  <option key={n} value={n.split(" · ")[0]}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Date signed</label>
              <input
                className="fi2"
                type="date"
                value={mf.signed}
                onChange={setM("signed")}
              />
            </div>
            <div className="ff">
              <label className="fl">Expiry date</label>
              <input
                className="fi2"
                type="date"
                value={mf.expiry}
                onChange={setM("expiry")}
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Value / scope</label>
            <input
              className="fi2"
              value={mf.value}
              onChange={setM("value")}
              placeholder="e.g. 12 job placements per quarter"
            />
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">MOUs & Contracts</div>
          <div className="page-sub">
            Partner agreements · Expiry alerts · Renewal tracking
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setShowAdd(true)}>
          + New MOU
        </button>
      </div>

      {/* Alert banners */}
      {expiryStats.expired > 0 && (
        <div
          style={{
            background: "rgba(244,63,94,.07)",
            border: "1px solid rgba(244,63,94,.25)",
            borderRadius: "var(--r)",
            padding: "9px 14px",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span style={{ fontSize: 16 }}>✗</span>
          <div>
            <b style={{ color: T.red }}>
              {expiryStats.expired} MOU{expiryStats.expired > 1 ? "s" : ""}{" "}
              expired
            </b>
            <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>
              — renewal needed immediately
            </span>
          </div>
        </div>
      )}
      {expiryStats.expiring > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,.07)",
            border: "1px solid rgba(245,158,11,.25)",
            borderRadius: "var(--r)",
            padding: "9px 14px",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠</span>
          <div>
            <b style={{ color: T.amber }}>
              {expiryStats.expiring} MOU{expiryStats.expiring > 1 ? "s" : ""}{" "}
              expiring soon
            </b>
            <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>
              — review and renew
            </span>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 9,
          marginBottom: 16,
        }}
      >
        {[
          { l: "Active", v: expiryStats.active, c: T.green },
          { l: "Expiring soon", v: expiryStats.expiring, c: T.amber },
          { l: "Expired", v: expiryStats.expired, c: T.red },
        ].map((s) => (
          <div
            key={s.l}
            className="card"
            style={{ textAlign: "center", padding: "12px" }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>
              {s.v}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Type</th>
                <th>Signed</th>
                <th>Expiry</th>
                <th>Assigned to</th>
                <th>Value / Scope</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mous.map((m) => (
                <tr key={m.id} onClick={() => toast("MOU: " + m.partner)}>
                  <td className="nm">{m.partner}</td>
                  <td style={{ fontSize: 11 }}>{m.type}</td>
                  <td style={{ fontSize: 11, color: T.muted }}>{m.signed}</td>
                  <td
                    style={{
                      fontSize: 11,
                      fontWeight: m.status !== "active" ? 700 : "normal",
                      color:
                        m.status === "expired"
                          ? T.red
                          : m.status === "expiring"
                          ? T.amber
                          : T.sub,
                    }}
                  >
                    {m.expiry}
                  </td>
                  <td>
                    <IdBadge uid={m.assignedTo} />
                  </td>
                  <td
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.value}
                  </td>
                  <td>
                    <span className={`badge ${statusColor(m.status)}`}>
                      {statusIcon(m.status)} {statusLabel(m.status)}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {m.status !== "active" ? (
                      <button
                        className="btn btn-xs btn-p"
                        onClick={() => {
                          setMous((p) =>
                            p.map((x) =>
                              x.id === m.id ? { ...x, status: "active" } : x
                            )
                          );
                          toast("MOU marked as renewed ✓", "success");
                        }}
                      >
                        Renew
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          toast("E-signature sent for renewal ✓", "success")
                        }
                      >
                        Sign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORG DOCUMENTS — General org docs (not participant / signup related)
// ═══════════════════════════════════════════════════════════════════════════════
function OrgDocuments({ toast }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [docs, setDocs] = useState([]);
  const [uf, setUF] = useState({ name: "", cat: "Legal", notes: "" });

  const cats = ["all", ...new Set(docs.map((d) => d.cat))];
  const typeIcon = (t) =>
    ({ pdf: "📄", docx: "📝", xlsx: "📊", pptx: "📊" }[t] || "📎");
  const typeColor = (t) =>
    ({ pdf: "b-r", docx: "b-b", xlsx: "b-g", pptx: "b-a" }[t] || "b-gr");

  const filtered = docs.filter(
    (d) =>
      (catFilter === "all" || d.cat === catFilter) &&
      (!search || d.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {showUpload && (
        <Modal
          title="Upload document"
          sub="General org documents only — not participant or signup files"
          onClose={() => setShowUpload(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowUpload(false)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={() => {
                  if (!uf.name) {
                    toast("Document name required", "warn");
                    return;
                  }
                  setDocs((p) => [
                    ...p,
                    {
                      id: "od" + Date.now(),
                      name: uf.name,
                      cat: uf.cat,
                      size: "—",
                      date: "Today",
                      type: "pdf",
                      uploadedBy: "ADM-001",
                    },
                  ]);
                  setShowUpload(false);
                  setUF({ name: "", cat: "Legal", notes: "" });
                  toast("Document uploaded ✓", "success");
                }}
              >
                Upload
              </button>
            </>
          }
        >
          <div
            className="upload-zone"
            onClick={() => toast("File picker — Supabase Storage")}
          >
            <div style={{ fontSize: 28, marginBottom: 7 }}>📎</div>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 3 }}>
              Click to select file
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              PDF · DOCX · XLSX · PPTX · Max 25MB
            </div>
          </div>
          <div className="ff">
            <label className="fl">Document name</label>
            <input
              className="fi2"
              value={uf.name}
              onChange={(e) => setUF((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Board Resolution — April 2026"
            />
          </div>
          <div className="ff">
            <label className="fl">Category</label>
            <select
              className="fsel"
              value={uf.cat}
              onChange={(e) => setUF((f) => ({ ...f, cat: e.target.value }))}
            >
              {[
                "Legal",
                "Governance",
                "Finance",
                "Policy",
                "Planning",
                "Communications",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="ff">
            <label className="fl">Notes (optional)</label>
            <textarea
              className="ftxt"
              value={uf.notes}
              onChange={(e) => setUF((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Brief description of this document…"
            />
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">Org Documents</div>
          <div className="page-sub">
            General organization documents · Legal, governance, finance, policy,
            planning
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setShowUpload(true)}>
          + Upload
        </button>
      </div>

      {/* Category stats */}
      <div
        style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}
      >
        {cats
          .filter((c) => c !== "all")
          .map((cat) => {
            const count = docs.filter((d) => d.cat === cat).length;
            return (
              <button
                key={cat}
                className={`btn btn-sm${catFilter === cat ? " btn-p" : ""}`}
                onClick={() => setCatFilter(cat)}
              >
                {cat}{" "}
                <span style={{ fontSize: 10, opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        <button
          className={`btn btn-sm${catFilter === "all" ? " btn-p" : ""}`}
          onClick={() => setCatFilter("all")}
        >
          All ({docs.length})
        </button>
      </div>

      <div className="frow" style={{ marginBottom: 12 }}>
        <input
          className="fi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          style={{ flex: 1, maxWidth: 280 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Type</th>
                <th>Size</th>
                <th>Date</th>
                <th>Uploaded by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => toast("Opening: " + d.name)}>
                  <td
                    className="nm"
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span style={{ fontSize: 16 }}>{typeIcon(d.type)}</span>
                    {d.name}
                  </td>
                  <td>
                    <span className="badge b-gr" style={{ fontSize: 9 }}>
                      {d.cat}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${typeColor(d.type)}`}
                      style={{ fontSize: 9 }}
                    >
                      {d.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: T.muted }}>{d.size}</td>
                  <td style={{ fontSize: 11, color: T.muted }}>{d.date}</td>
                  <td>
                    <IdBadge uid={d.uploadedBy} />
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", gap: 5 }}
                  >
                    <button
                      className="btn btn-xs"
                      onClick={() =>
                        toast("Downloading " + d.name + " ✓", "success")
                      }
                    >
                      ⬇
                    </button>
                    <button
                      className="btn btn-xs"
                      onClick={() => toast("Sharing " + d.name)}
                    >
                      🔗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCES — Documents and videos for staff and board
// ═══════════════════════════════════════════════════════════════════════════════
function getYouTubeThumbnail(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com.*(?:\?|&)v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function Resources({ toast }) {
  const [tab, setTab] = useState("docs");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [rf, setRF] = useState({ title: "", type: "doc", url: "", desc: "", audience: "all" });
  const [uploadFile, setUploadFile] = useState(null);
  const [resources, setResources] = useState([]);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadResources = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setResources(json.data || []);
    } catch (e) {
      toast("Failed to load resources", "error");
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const uploadToStorage = async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    const path = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("Organization Document").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("Organization Document").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveResource = async () => {
    if (!rf.title) {
      toast("Title required", "warn");
      return;
    }
    try {
      let url = rf.url;
      if (uploadFile) {
        url = await uploadToStorage(uploadFile);
      }
      if (!url) {
        toast(rf.type === "video" ? "Add a video URL or upload a file" : "Upload a file", "warn");
        return;
      }
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: rf.type, title: rf.title, description: rf.desc, url, audience: rf.audience }),
      });
      if (!res.ok) throw new Error();
      setShowAdd(false);
      setRF({ title: "", type: rf.type, url: "", desc: "", audience: "all" });
      setUploadFile(null);
      toast("Resource added ✓", "success");
      loadResources();
    } catch (e) {
      toast("Failed to add resource", "error");
    }
  };

  const shown = resources.filter(
    (r) =>
      r.type === (tab === "docs" ? "doc" : "video") &&
      (!search || r.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {showAdd && (
        <Modal
          title={`Add ${rf.type === "doc" ? "document" : "video"}`}
          onClose={() => { setShowAdd(false); setUploadFile(null); }}
          footer={
            <>
              <button className="btn" onClick={() => { setShowAdd(false); setUploadFile(null); }}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={saveResource}>
                Add resource
              </button>
            </>
          }
        >
          <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
            {["doc", "video"].map((tp) => (
              <button
                key={tp}
                className={`btn${rf.type === tp ? " btn-p" : ""}`}
                onClick={() => { setRF((f) => ({ ...f, type: tp })); setUploadFile(null); }}
              >
                {tp === "doc" ? "📄 Document" : "🎥 Video"}
              </button>
            ))}
          </div>
          <div className="ff">
            <label className="fl">Title</label>
            <input
              className="fi2"
              value={rf.title}
              onChange={(e) => setRF((f) => ({ ...f, title: e.target.value }))}
              placeholder="Resource title"
            />
          </div>
          <div className="ff">
            <label className="fl">Description</label>
            <textarea
              className="ftxt"
              value={rf.desc}
              onChange={(e) => setRF((f) => ({ ...f, desc: e.target.value }))}
              placeholder="Brief description…"
              style={{ minHeight: 60 }}
            />
          </div>
          {rf.type === "video" && (
            <div className="ff">
              <label className="fl">Video URL (YouTube, Vimeo)</label>
              <input
                className="fi2"
                value={rf.url}
                onChange={(e) => setRF((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=…"
                disabled={!!uploadFile}
              />
            </div>
          )}
          <div className="ff">
            <label className="fl">{rf.type === "video" ? "Or upload a video file" : "Upload file"}</label>
            <label className="upload-zone" style={{ cursor: "pointer", display: "block" }}>
              <input
                type="file"
                accept={rf.type === "video" ? "video/*" : undefined}
                style={{ display: "none" }}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: 22 }}>📎</div>
              <div style={{ fontSize: 12, color: T.text, marginTop: 5 }}>
                {uploadFile ? uploadFile.name : "Click to upload file"}
              </div>
            </label>
          </div>
          <div className="ff">
            <label className="fl">Audience</label>
            <select
              className="fsel"
              value={rf.audience}
              onChange={(e) => setRF((f) => ({ ...f, audience: e.target.value }))}
            >
              <option value="all">All staff and board</option>
              <option value="staff">Staff only</option>
              <option value="board">Board only</option>
            </select>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="page-title">Resources</div>
          <div className="page-sub">Documents and training videos for staff and board members</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowAdd(true)}>
          + Add resource
        </button>
      </div>

      <div className="tabs">
        {[
          ["docs", "Documents", resources.filter((r) => r.type === "doc").length],
          ["videos", "Videos", resources.filter((r) => r.type === "video").length],
        ].map(([k, l, n]) => (
          <button key={k} className={`tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>
            {l === "Documents" ? "📄" : "🎥"} {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>

      <div className="frow" style={{ marginBottom: 12 }}>
        <input
          className="fi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources…"
          style={{ flex: 1, maxWidth: 280 }}
        />
      </div>

      {tab === "docs" && (
        <div className="g2">
          {shown.map((r) => (
              <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="card card-hover"
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 36, height: 44, borderRadius: 6, background: "rgba(244,63,94,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                  }}
                >
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{r.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span
                  className={`badge${r.audience === "all" ? " b-b" : r.audience === "staff" ? " b-a" : " b-v"}`}
                >
                  {r.audience === "all" ? "All" : r.audience}
                </span>
                <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto", alignSelf: "center" }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
          {!shown.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px 0", color: T.muted }}>
              No documents yet
            </div>
          )}
        </div>
      )}

      {tab === "videos" && (
        <div className="g3">
          {shown.map((r) => {
            const thumb = getYouTubeThumbnail(r.url);
            return (
                <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="card card-hover"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    width: "100%", height: 110, background: "var(--dk)", borderRadius: "var(--r)",
                    marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, border: "1px solid var(--border)", position: "relative", overflow: "hidden",
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    "🎥"
                  )}
                  <div
                    style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%", background: "rgba(242,7,133,.85)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}
                    >
                      ▶
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 4, lineHeight: 1.3 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, lineHeight: 1.4 }}>
                  {r.description}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <span className={`badge${r.audience === "all" ? " b-b" : r.audience === "staff" ? " b-a" : " b-v"}`}>
                    {r.audience === "all" ? "All" : r.audience}
                  </span>
                  <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto", alignSelf: "center" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </a>
            );
          })}
          {!shown.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px 0", color: T.muted }}>
              No videos yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Workshops({ toast }) {
  const [tab, setTab] = useState("upcoming");
  const [showAdd, setShowAdd] = useState(false);
  const [recordModal, setRecordModal] = useState(null);
  const [recordUrl, setRecordUrl] = useState("");
  const [recordFile, setRecordFile] = useState(null);
  const [wf, setWF] = useState({
    title: "", facilitator: "", date: "", time: "",
    platform: "Zoom", link: "", desc: "", audience: "all",
  });
  const [workshops, setWorkshops] = useState([]);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadWorkshops = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workshops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setWorkshops(json.data || []);
    } catch (e) {
      toast("Failed to load workshops", "error");
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, []);

  const uploadToStorage = async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    const path = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("Organization Document").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("Organization Document").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveWorkshop = async () => {
    if (!wf.title || !wf.date) {
      toast("Title and date required", "warn");
      return;
    }
    try {
      const scheduledAt = wf.time
        ? new Date(`${wf.date}T${wf.time}`).toISOString()
        : new Date(`${wf.date}T00:00`).toISOString();
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workshops`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: wf.title,
          facilitator: wf.facilitator,
          scheduled_at: scheduledAt,
          platform: wf.platform,
          meeting_link: wf.link,
          description: wf.desc,
          audience: wf.audience,
        }),
      });
      if (!res.ok) throw new Error();
      setShowAdd(false);
      setWF({ title: "", facilitator: "", date: "", time: "", platform: "Zoom", link: "", desc: "", audience: "all" });
      toast("Workshop added ✓", "success");
      loadWorkshops();
    } catch (e) {
      toast("Failed to add workshop", "error");
    }
  };

  const saveRecording = async () => {
    if (!recordModal) return;
    try {
      let url = recordUrl;
      if (recordFile) {
        url = await uploadToStorage(recordFile);
      }
      if (!url) {
        toast("Paste a link or upload a file", "warn");
        return;
      }
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workshops/${recordModal.id}/recording`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recording_url: url }),
      });
      if (!res.ok) throw new Error();
      toast("Recording saved ✓", "success");
      setRecordModal(null);
      setRecordUrl("");
      setRecordFile(null);
      loadWorkshops();
    } catch (e) {
      toast("Failed to save recording", "error");
    }
  };

  const shown = workshops.filter((w) => w.status === (tab === "upcoming" ? "upcoming" : "completed"));
  const platformIcon = (p) => ({ Zoom: "🎥", Teams: "💙", Meet: "🟢" }[p] || "💻");

  return (
    <div>
      {showAdd && (
        <Modal
          title="Add workshop"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={saveWorkshop}>
                Save workshop
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Workshop title</label>
            <input
              className="fi2"
              value={wf.title}
              onChange={(e) => setWF((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Motivational Interviewing Basics"
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Facilitator</label>
              <input
                className="fi2"
                value={wf.facilitator}
                onChange={(e) => setWF((f) => ({ ...f, facilitator: e.target.value }))}
                placeholder="Name or organization"
              />
            </div>
            <div className="ff">
              <label className="fl">Platform</label>
              <select
                className="fsel"
                value={wf.platform}
                onChange={(e) => setWF((f) => ({ ...f, platform: e.target.value }))}
              >
                {["Zoom", "Teams", "Google Meet", "Other"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Date</label>
              <input
                className="fi2"
                type="date"
                value={wf.date}
                onChange={(e) => setWF((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="ff">
              <label className="fl">Time</label>
              <input
                className="fi2"
                type="time"
                value={wf.time}
                onChange={(e) => setWF((f) => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Meeting link</label>
            <input
              className="fi2"
              value={wf.link}
              onChange={(e) => setWF((f) => ({ ...f, link: e.target.value }))}
              placeholder="https://zoom.us/j/…"
            />
          </div>
          <div className="ff">
            <label className="fl">Description</label>
            <textarea
              className="ftxt"
              value={wf.desc}
              onChange={(e) => setWF((f) => ({ ...f, desc: e.target.value }))}
              placeholder="What will be covered…"
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="ff">
            <label className="fl">Audience</label>
            <select
              className="fsel"
              value={wf.audience}
              onChange={(e) => setWF((f) => ({ ...f, audience: e.target.value }))}
            >
              <option value="all">All staff and board</option>
              <option value="staff">Staff only</option>
              <option value="board">Board only</option>
            </select>
          </div>
        </Modal>
      )}

      {recordModal && (
        <Modal
          title="Add recording"
          sub={recordModal.title}
          onClose={() => { setRecordModal(null); setRecordUrl(""); setRecordFile(null); }}
          footer={
            <>
              <button className="btn" onClick={() => { setRecordModal(null); setRecordUrl(""); setRecordFile(null); }}>
                Cancel
              </button>
              <button className="btn btn-p" onClick={saveRecording}>
                Save recording
              </button>
            </>
          }
        >
          <div className="ff">
            <label className="fl">Recording URL (YouTube, Vimeo)</label>
            <input
              className="fi2"
              value={recordUrl}
              onChange={(e) => setRecordUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              disabled={!!recordFile}
            />
          </div>
          <div className="ff">
            <label className="fl">Or upload a video file</label>
            <label className="upload-zone" style={{ cursor: "pointer", display: "block" }}>
              <input
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => setRecordFile(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: 22 }}>📎</div>
              <div style={{ fontSize: 12, color: T.text, marginTop: 5 }}>
                {recordFile ? recordFile.name : "Click to upload file"}
              </div>
            </label>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="page-title">Workshops</div>
          <div className="page-sub">Virtual workshops · Upcoming sessions and recorded library</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowAdd(true)}>
          + Add workshop
        </button>
      </div>

      <div className="tabs">
        {[
          ["upcoming", "Upcoming", workshops.filter((w) => w.status === "upcoming").length],
          ["completed", "Recordings", workshops.filter((w) => w.status === "completed").length],
        ].map(([k, l, n]) => (
          <button key={k} className={`tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>
            {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>

      <div className="g2">
        {shown.map((w) => {
          const thumb = getYouTubeThumbnail(w.recording_url);
          return (
            <div key={w.id} className="card card-hover">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4, lineHeight: 1.3 }}>
                    {w.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
                    👤 {w.facilitator} · {platformIcon(w.platform)} {w.platform}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {w.scheduled_at && (
                      <span className="badge b-a" style={{ fontSize: 10 }}>
                        📅 {new Date(w.scheduled_at).toLocaleString()}
                      </span>
                    )}
                    <span className={`badge${w.audience === "all" ? " b-b" : w.audience === "staff" ? " b-a" : " b-v"}`} style={{ fontSize: 10 }}>
                      {w.audience === "all" ? "All" : w.audience}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.pink }}>{w.attendee_count || 0}</div>
                  <div style={{ fontSize: 9, color: T.muted }}>attendees</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
                {w.description}
              </div>
              {w.recording_url && (
                  <a
                  href={w.recording_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block", width: "100%", height: 100, background: "var(--dk)", borderRadius: "var(--r)",
                    marginBottom: 10, position: "relative", overflow: "hidden", border: "1px solid var(--border)",
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎥</div>
                  )}
                  <div
                    style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: "50%", background: "rgba(242,7,133,.85)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                      }}
                    >
                      ▶
                    </div>
                  </div>
                </a>
              )}
              <div style={{ display: "flex", gap: 7 }}>
                {w.status === "upcoming" && w.meeting_link && (
                    <a
                    href={w.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-p"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Join meeting →
                  </a>
                )}
                {w.status === "completed" && !w.recording_url && (
                  <button
                    className="btn btn-sm"
                    onClick={() => setRecordModal(w)}
                  >
                    + Add recording
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px", color: T.muted }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{tab === "upcoming" ? "📅" : "🎥"}</div>
            <div style={{ fontSize: 14, color: T.text, marginBottom: 6 }}>
              {tab === "upcoming" ? "No upcoming workshops" : "No recordings yet"}
            </div>
            <div style={{ fontSize: 12 }}>Use the "+ Add workshop" button above to schedule one.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLog({ toast, user }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const entries = [];

  const modules = [...new Set(entries.map((e) => e.module))];
  const actionColors = {
    document_signed: "b-p",
    task_completed: "b-g",
    job_completed: "b-g",
    id_assigned: "b-v",
    grant_advanced: "b-b",
    vote_cast: "b-b",
    job_checkin: "b-a",
    participant_added: "b-p",
    job_created: "b-gr",
    mou_signed: "b-p",
    shift_assigned: "b-gr",
    signup_approved: "b-a",
  };
  const actionIcons = {
    document_signed: "✍️",
    task_completed: "✅",
    job_completed: "✅",
    id_assigned: "🪪",
    grant_advanced: "💼",
    vote_cast: "🗳️",
    job_checkin: "📍",
    participant_added: "🎓",
    job_created: "🔧",
    mou_signed: "🤝",
    shift_assigned: "📅",
    signup_approved: "👤",
  };

  const filtered = entries.filter((e) => {
    const matchModule = filter === "all" || e.module === filter;
    const matchSearch =
      !search ||
      e.detail.toLowerCase().includes(search.toLowerCase()) ||
      e.actor.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div className="page-title">Audit Log</div>
        <div className="page-sub">
          Append-only record of all state changes · Admin view only · Used for
          grant audits and board accountability
        </div>
      </div>

      <div
        style={{
          background: "rgba(129,140,248,.06)",
          border: "1px solid rgba(129,140,248,.2)",
          borderRadius: "var(--r)",
          padding: "9px 14px",
          marginBottom: 14,
          fontSize: 12,
          color: T.sub,
          lineHeight: 1.7,
        }}
      >
        <span style={{ color: T.blue, fontWeight: 600 }}>📜 Audit trail: </span>
        Every action in SCP-STK Hub is recorded here with timestamp, actor,
        module, and IP address. This log cannot be edited or deleted. Required
        for 501(c)(3) compliance, grant audits, and board accountability.
      </div>

      <div className="frow" style={{ marginBottom: 14 }}>
        <input
          className="fi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actions or people…"
          style={{ flex: 1, maxWidth: 260 }}
        />
        <select
          className="fi"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All modules</option>
          {modules.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: T.muted, alignSelf: "center" }}>
          {filtered.length} entries
        </span>
        <button
          className="btn btn-sm"
          onClick={() => toast("Audit log exported as CSV ✓", "success")}
        >
          📥 Export CSV
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Module</th>
                <th>Detail</th>
                <th style={{ fontSize: 9 }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} onClick={() => toast(e.detail)}>
                  <td
                    style={{
                      fontSize: 10,
                      color: T.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.ts}
                  </td>
                  <td>
                    <IdBadge uid={e.actor.split(" · ")[0]} />
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span>{actionIcons[e.action] || "•"}</span>
                      <span
                        className={`badge ${actionColors[e.action] || "b-gr"}`}
                        style={{ fontSize: 9 }}
                      >
                        {e.action.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 11 }}>{e.module}</td>
                  <td
                    style={{
                      fontSize: 11,
                      color: T.sub,
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.detail}
                  </td>
                  <td
                    style={{
                      fontSize: 9,
                      color: T.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    {e.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICIPANT DETAIL VIEW — Full profile, history, program stage, tasks, docs
// ═══════════════════════════════════════════════════════════════════════════════
function ParticipantDetail({ participant, onBack, toast }) {
  const [ptab, setPtab] = useState("overview");
  const stages = [
    "Intake",
    "Outreach",
    "Active",
    "Training",
    "Job Search",
    "Employed",
    "Graduated",
  ];
  const currentStageIdx = stages.indexOf(participant.stage);

  return (
    <div>
      <button
        className="btn btn-ghost"
        style={{ marginBottom: 12 }}
        onClick={onBack}
      >
        ← Back to participants
      </button>
      <div
        className="card"
        style={{ marginBottom: 13, position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(180deg,${T.pink2},${T.pink})`,
          }}
        />
        <div
          style={{
            paddingLeft: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className="av av-md"
              style={{ width: 48, height: 48, fontSize: 16, borderRadius: 12 }}
            >
              {participant.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 20,
                  color: T.white,
                  marginBottom: 3,
                }}
              >
                {participant.name}
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <IdBadge uid={participant.pid} />
                <span className="badge b-b">{participant.program}</span>
                <span className={`mode-pill mode-${participant.mode}`}>
                  {participant.mode}
                </span>
                <span
                  className={`badge${
                    participant.housing === "Housed"
                      ? " b-g"
                      : participant.housing === "SCP-linked"
                      ? " b-p"
                      : " b-a"
                  }`}
                >
                  {participant.housing}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
              Staff assigned
            </div>
            <IdBadge uid={participant.staff} />
          </div>
        </div>
      </div>

      {/* Program stage timeline */}
      <div className="card" style={{ marginBottom: 13 }}>
        <div className="sec-title" style={{ marginBottom: 12 }}>
          Program stage
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {stages.map((s, i) => {
            const done = i < currentStageIdx;
            const current = i === currentStageIdx;
            return (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 70,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: done
                        ? T.green
                        : current
                        ? T.pink
                        : "var(--border)",
                      border: `2px solid ${
                        done ? T.green : current ? T.pink : "var(--border2)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: done || current ? "#fff" : T.muted,
                      fontWeight: 700,
                      flexShrink: 0,
                      transition: "all .2s",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: current ? T.pink : done ? T.green : T.muted,
                      marginTop: 4,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontWeight: current ? 700 : 400,
                    }}
                  >
                    {s}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      background: done ? T.green : "var(--border)",
                      margin: "0 2px",
                      marginBottom: 16,
                      minWidth: 12,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {currentStageIdx < stages.length - 1 && (
          <button
            className="btn btn-sm btn-p"
            style={{ marginTop: 10 }}
            onClick={() =>
              toast(
                "Stage advanced to " + stages[currentStageIdx + 1] + " ✓",
                "success"
              )
            }
          >
            Advance to {stages[currentStageIdx + 1]} →
          </button>
        )}
      </div>

      <div className="tabs">
        {[
          ["overview", "Overview"],
          ["tasks", "Tasks", 3],
          ["docs", "Documents", 2],
          ["history", "History"],
        ].map(([k, l, n]) => (
          <button
            key={k}
            className={`tab${ptab === k ? " on" : ""}`}
            onClick={() => setPtab(k)}
          >
            {l}
            {n && <span className="tab-n">{n}</span>}
          </button>
        ))}
      </div>

      {ptab === "overview" && (
        <div className="g2">
          <div className="card">
            <div className="sec-title" style={{ marginBottom: 10 }}>
              Profile
            </div>
            {[
              ["Full name", participant.name],
              ["Participant ID", <IdBadge uid={participant.pid} />],
              ["Program", participant.program],
              ["Housing", participant.housing],
              ["Intake mode", participant.mode],
              ["Submitted", participant.submitted],
            ].map(([k, v], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.muted }}>{k}</span>
                <span style={{ color: T.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="sec-title" style={{ marginBottom: 10 }}>
              Notes & barriers
            </div>
            <div
              style={{
                fontSize: 12,
                color: T.sub,
                lineHeight: 1.7,
                background: "var(--dk)",
                borderRadius: "var(--r)",
                padding: "10px 12px",
              }}
            >
              Referred by King County Housing Navigation program. Primary
              barrier: unstable housing. Enrolled in Pay It Forward — vocational
              track starting May 2026. Case manager:{" "}
              <IdBadge uid={participant.staff} />
            </div>
            <button
              className="btn btn-sm btn-p"
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => toast("Note saved ✓", "success")}
            >
              + Add note
            </button>
          </div>
        </div>
      )}

      {ptab === "tasks" && (
        <div>
          {[
            {
              title: "Complete intake paperwork",
              by: "MGR-001",
              due: "Apr 15",
              status: "done",
            },
            {
              title: "Attend orientation session",
              by: "ADM-001",
              due: "Apr 20",
              status: "in_progress",
            },
            {
              title: "Submit housing documentation",
              by: "MGR-001",
              due: "Apr 25",
              status: "open",
            },
          ].map((tk, i) => (
            <div
              key={i}
              className="card"
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text,
                    marginBottom: 3,
                  }}
                >
                  {tk.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  Assigned by <IdBadge uid={tk.by} /> · Due {tk.due}
                </div>
              </div>
              <span className={`badge ${statusColor(tk.status)}`}>
                {tk.status.replace("_", " ")}
              </span>
            </div>
          ))}
          <button
            className="btn btn-sm btn-p"
            onClick={() => toast("Task added to participant ✓", "success")}
          >
            + Add task
          </button>
        </div>
      )}

      {ptab === "docs" && (
        <div>
          {[
            {
              name: "Pay It Forward Agreement",
              status: "signed",
              date: "Apr 10",
            },
            { name: "Housing Consent Form", status: "pending", date: "Apr 11" },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--cd2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                marginBottom: 7,
                cursor: "pointer",
              }}
              onClick={() => toast("Opening " + d.name)}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{d.date}</div>
              </div>
              <span
                className={`badge${d.status === "signed" ? " b-g" : " b-a"}`}
              >
                {d.status === "signed" ? "✓ Signed" : "Pending signature"}
              </span>
            </div>
          ))}
          <button
            className="btn btn-sm btn-p"
            onClick={() => toast("Send document for signature ✓", "success")}
          >
            + Send for signature
          </button>
        </div>
      )}

      {ptab === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Apr 10",
                    "Document signed: Pay It Forward Agreement",
                    "ADM-001",
                  ],
                  ["Apr 8", "Stage advanced to Active", "MGR-001"],
                  ["Apr 5", "PDF intake form uploaded", "MGR-001"],
                  [
                    "Apr 2",
                    "Participant record created — digital intake",
                    "MGR-001",
                  ],
                ].map(([d, ev, by], i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: T.muted }}>{d}</td>
                    <td style={{ fontSize: 12 }}>{ev}</td>
                    <td>
                      <IdBadge uid={by} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// E-SIGNATURE MODULE — DocuSign-style in-app document signing
// ═══════════════════════════════════════════════════════════════════════════════

// ── Signature canvas (draw-to-sign) ──────────────────────────────────────────
function SignatureCanvas({ onSign, width = 420, height = 140 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#f20785";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isEmpty = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !data.some((v) => v !== 0);
  };

  const confirm = () => {
    if (isEmpty()) return null;
    const canvas = canvasRef.current;
    return canvas.toDataURL("image/png");
  };

  return (
    <div>
      <div
        className="sign-canvas-wrap"
        style={{ width: "100%", height: height }}
      >
        <canvas
          ref={canvasRef}
          width={width * 2}
          height={height * 2}
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div className="sign-canvas-label">Sign here</div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 9,
          justifyContent: "flex-end",
        }}
      >
        <button className="btn btn-sm" onClick={clear}>
          Clear
        </button>
        <button
          className="btn btn-sm btn-p"
          onClick={() => {
            const data = confirm();
            if (data) onSign(data);
          }}
        >
          Adopt signature →
        </button>
      </div>
    </div>
  );
}

// ── Document signing modal ────────────────────────────────────────────────────
function SignDocumentModal({
  doc,
  signerName,
  signerRole,
  onClose,
  onComplete,
  toast,
}) {
  const [step, setStep] = useState("review"); // review | sign | done
  const [signatureData, setSignatureData] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const signedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const handleSign = (imgData) => {
    setSignatureData(imgData);
    setStep("done");
  };

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
            <button
              className="btn btn-p"
              disabled={!agreed}
              onClick={() => setStep("sign")}
            >
              Continue to sign →
            </button>
          </>
        ) : step === "done" ? (
          <button
            className="btn btn-p"
            onClick={() => {
              onComplete(signatureData, signedAt);
              onClose();
            }}
          >
            Done ✓
          </button>
        ) : null
      }
    >
      {/* ── Step 1: Review document ── */}
      {step === "review" && (
        <>
          <div className="doc-preview">
            <h3>{doc.name}</h3>
            <p>
              This agreement is between{" "}
              <b style={{ color: T.text }}>
                SCP-STK (Sawyer Culberson Project of Save the Kids)
              </b>
              , a 501(c)(3) nonprofit registered in Washington State, and the
              signatory named below.
            </p>
            {doc.clauses?.map((c, i) => (
              <div key={i} className="doc-clause">
                <b style={{ color: T.sub }}>§{i + 1}</b> {c}
              </div>
            ))}
            <p style={{ marginTop: 12, fontSize: 11, color: T.muted }}>
              Document ID: {doc.id} · {doc.pages} pages · Requires{" "}
              {doc.signers?.length || 1} signature
              {doc.signers?.length > 1 ? "s" : ""}
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
                transition: "all .15s",
              }}
            >
              {agreed && (
                <span
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              I, <b style={{ color: T.text }}>{signerName}</b>, confirm I have
              read this document and agree to sign electronically. My electronic
              signature is legally binding under the ESIGN Act.
            </div>
          </div>
        </>
      )}

      {/* ── Step 2: Draw signature ── */}
      {step === "sign" && (
        <>
          <div
            style={{
              fontSize: 12,
              color: T.sub,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Draw your signature using your mouse or finger. This will be placed
            on the document as: <b style={{ color: T.text }}>{signerName}</b>
            <span
              style={{ marginLeft: 8 }}
              className={`badge${
                signerRole === "admin"
                  ? " b-p"
                  : signerRole === "manager"
                  ? " b-v"
                  : " b-a"
              }`}
            >
              {signerRole}
            </span>
          </div>
          <SignatureCanvas onSign={handleSign} height={150} />
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            By signing, you agree this electronic signature has the same legal
            effect as a handwritten signature.
          </div>
        </>
      )}

      {/* ── Step 3: Done ── */}
      {step === "done" && (
        <>
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
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.white,
                marginBottom: 4,
              }}
            >
              Signature applied
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              Signed at {signedAt}
            </div>
          </div>
          {signatureData && (
            <div
              style={{
                background: T.dark,
                border: `1px solid var(--border)`,
                borderRadius: "var(--r)",
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  fontWeight: 700,
                }}
              >
                Your signature
              </div>
              <img
                src={signatureData}
                alt="signature"
                style={{ maxWidth: "100%", height: 60, objectFit: "contain" }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginTop: 5,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 5,
                }}
              >
                {signerName} · {signerRole} · {signedAt}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
            A copy of the signed document will be sent to all parties via email
            once all required signatures are collected.
          </div>
        </>
      )}
    </Modal>
  );
}

// ── PDF page renderer (pdf.js) ────────────────────────────────────────────────
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { Rnd } from "react-rnd";

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

// ── My Signature setup (type name -> pick cursive style -> save) ─────────────
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

function MySignatureSetup({ user, existing, onClose, onSaved, toast, getToken }) {
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
      console.error("Signature save failed:", e);
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

// ── Field placement screen (admin marks where each signer's Signature/Date
// goes, drag + resize via react-rnd) ───────────────────────────────────────
const PLACEMENT_PAGE_WIDTH = 600;

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
      try {
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
        if (!cancelled) setPages(out);
      } catch (e) {
        console.error("Failed to render PDF for placement:", e);
        if (!cancelled) toast("Failed to render PDF", "error");
      } finally {
        if (!cancelled) setLoadingPdf(false);
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

// ── Signer fill screen (review -> tap pre-placed fields to sign -> done) ────
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

// ── Main E-Signatures page ────────────────────────────────────────────────────
function ESignatures({ toast, user }) {
  const [tab, setTab] = useState("all");
  const [activeModal, setActiveModal] = useState(null); // { doc, mode }
  const [sendModal, setSendModal] = useState(false);
  const [docs, setDocs] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [mySignature, setMySignature] = useState(null);
  const [sigSetupOpen, setSigSetupOpen] = useState(false);
  const [sigLoading, setSigLoading] = useState(true);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  useEffect(() => {
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

  const [allUsers, setAllUsers] = useState([]);
  const [selectedSignerIds, setSelectedSignerIds] = useState([]);
  const [placementDoc, setPlacementDoc] = useState(null); // created doc + signers, opens placement screen
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setAllUsers(json.data || []);
      } catch (e) {
        /* silent — signer multi-select just stays empty */
      }
    })();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setDocs(json.data || []);
    } catch (e) {
      console.error("Failed to load esign documents:", e);
      toast("Failed to load documents", "error");
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const boardUsers = allUsers.filter((u) => u.role === "admin" || u.role === "manager");

  const toggleSigner = (id) => {
    setSelectedSignerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createDocument = async () => {
    if (!newDoc.name) {
      toast("Document name required", "warn");
      return;
    }
    if (!pdfFile) {
      toast("Upload a PDF document", "warn");
      return;
    }
    if (selectedSignerIds.length === 0) {
      toast("Select at least one signer", "warn");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const path = `${session.user.id}/${Date.now()}_${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage.from("esign-documents").upload(path, pdfFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(path);

      const signers = selectedSignerIds.map((id) => {
        const u = boardUsers.find((x) => x.id === id);
        return { name: u.full_name, email: u.email, role: u.role, user_id: u.id };
      });

      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/esign/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newDoc.name,
          type: newDoc.type,
          clauses: [],
          source_file_url: urlData.publicUrl,
          signers,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const json = await res.json();

      setSendModal(false);
      setPlacementDoc(json.data);
      toast("Document created — place signature fields next", "success");
      loadDocuments();
    } catch (e) {
      console.error("Create document failed:", e);
      toast("Failed to create document", "error");
    } finally {
      setCreating(false);
    }
  };

  const [newDoc, setNewDoc] = useState({
    name: "",
    type: "participant",
    signerNames: "",
    message: "",
  });
  const setND = (k) => (e) => setNewDoc((f) => ({ ...f, [k]: e.target.value }));

  const signDoc = (docId, signerUid, sigData, signedAt) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const updated = doc.signers.map((s) =>
          s.uid === signerUid ? { ...s, signed: true, signedAt, sigData } : s
        );
        const allSigned = updated.every((s) => s.signed);
        return {
          ...doc,
          signers: updated,
          status: allSigned ? "complete" : "pending",
        };
      })
    );
    toast("Document signed and recorded ✓", "success");
  };

  // Find if current user has a pending signature on any doc
  const myPendingDocs = docs.filter(
    (d) =>
      d.status !== "complete" &&
      d.signers.some(
        (s) => !s.signed && s.user_id === user?.id
      )
  );

  const filtered = docs.filter((d) => {
    if (tab === "all") return true;
    if (tab === "pending") return d.status === "pending";
    if (tab === "complete") return d.status === "complete";
    if (tab === "mine")
      return d.signers.some(
        (s) => s.user_id === user?.id
      );
    return true;
  });

  const typeIcon = (t) =>
    ({ participant: "🎓", mou: "🤝", staff: "👷", grant: "💼" }[t] || "📄");
  const typeLabel = (t) =>
    ({
      participant: "Participant Agreement",
      mou: "MOU / Partnership",
      staff: "Staff Agreement",
      grant: "Grant Document",
    }[t] || "Document");

  const completedCount = (doc) => doc.signers.filter((s) => s.signed).length;

  return (
    <div>
      {activeModal && (
        <SignerFillScreen
          doc={activeModal.doc}
          user={user}
          mySignature={mySignature}
          onClose={() => setActiveModal(null)}
          onSigned={() => loadDocuments()}
          toast={toast}
          getToken={getToken}
        />
      )}

      {sendModal && (
        <Modal
          title="Send document for signature"
          sub="Recipients will be notified"
          onClose={() => setSendModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setSendModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-p"
                onClick={createDocument}
                disabled={creating}
              >
                {creating ? "Creating…" : "Continue to placement →"}
              </button>
            </>
          }
        >
          <div className="ff">
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
          <div className="ff">
            <label className="fl">Document name</label>
            <input
              className="fi2"
              value={newDoc.name}
              onChange={setND("name")}
              placeholder="e.g. Program Participation Agreement — Kezia M."
            />
          </div>
          <div className="frow2">
            <div className="ff">
              <label className="fl">Document type</label>
              <select
                className="fsel"
                value={newDoc.type}
                onChange={setND("type")}
              >
                <option value="participant">Participant Agreement</option>
                <option value="mou">MOU / Partnership</option>
                <option value="staff">Staff Agreement</option>
                <option value="grant">Grant Document</option>
              </select>
            </div>
          </div>
          <div className="ff">
            <label className="fl">Signers</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {boardUsers.map((u) => {
                const checked = selectedSignerIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSigner(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${checked ? "#f20785" : "var(--border)"}`,
                      background: checked ? "rgba(242,7,133,.06)" : "transparent",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <span>{checked ? "✓" : "○"}</span>
                    <span>{u.full_name}</span>
                    <span style={{ color: T.muted, marginLeft: "auto" }}>
                      {u.role === "admin" ? "Admin" : "Manager"}
                    </span>
                  </div>
                );
              })}
              {boardUsers.length === 0 && (
                <div className="fhint">No admins or managers found</div>
              )}
            </div>
          </div>
          <div className="ff">
            <label className="fl">Message to signers (optional)</label>
            <textarea
              className="ftxt"
              value={newDoc.message}
              onChange={setND("message")}
              placeholder="Please review and sign this agreement at your earliest convenience…"
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="info-box pink">
            <span style={{ color: T.pink, fontWeight: 600 }}>
              Signing process:{" "}
            </span>
            Each signer receives a notification and signs with their drawn
            signature. Once all parties sign, the document status changes to
            Complete and a timestamped record is saved.
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="page-title">E-Signatures</div>
          <div className="page-sub">
            Send, sign, and track documents — no third-party service needed
          </div>
        </div>
        <button className="btn btn-p" onClick={() => setSendModal(true)}>
          + Send for signature
        </button>
      </div>

      {placementDoc && (
        <FieldPlacementScreen
          doc={placementDoc}
          pdfFile={pdfFile}
          onClose={() => setPlacementDoc(null)}
          onSaved={() => {
            setPlacementDoc(null);
            loadDocuments();
          }}
          toast={toast}
          getToken={getToken}
        />
      )}

      {sigSetupOpen && (
        <MySignatureSetup
          user={user}
          existing={mySignature}
          onClose={() => setSigSetupOpen(false)}
          onSaved={(sig) => setMySignature(sig)}
          toast={toast}
          getToken={getToken}
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

      {/* Awaiting your signature alert */}
      {myPendingDocs.length > 0 && (
        <div
          style={{
            background: "rgba(242,7,133,.06)",
            border: "1px solid rgba(242,7,133,.25)",
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
              You have {myPendingDocs.length} document
              {myPendingDocs.length > 1 ? "s" : ""} awaiting your signature
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {myPendingDocs.map((d) => d.name).join(" · ")}
            </div>
          </div>
          <button className="btn btn-sm btn-p" onClick={() => setTab("mine")}>
            View
          </button>
        </div>
      )}

      <div className="tabs">
        {[
          ["all", "All", docs.length],
          [
            "pending",
            "Pending",
            docs.filter((d) => d.status === "pending").length,
          ],
          [
            "complete",
            "Complete",
            docs.filter((d) => d.status === "complete").length,
          ],
          ["mine", "Needs my signature", myPendingDocs.length],
        ].map(([k, l, n]) => (
          <button
            key={k}
            className={`tab${tab === k ? " on" : ""}`}
            onClick={() => setTab(k)}
          >
            {l}
            <span className="tab-n">{n}</span>
          </button>
        ))}
      </div>

      {filtered.map((doc) => {
        const allSigned = doc.signers.every((s) => s.signed);
        const myTurn = doc.signers.some(
          (s) => !s.signed && s.user_id === user?.id
        );
        return (
          <div key={doc.id} className="esign-doc-row" onClick={() => {}}>
            <div className="esign-doc-icon">{typeIcon(doc.type)}</div>
            <div className="esign-doc-meta">
              <div className="esign-doc-name">{doc.name}</div>
              <div className="esign-doc-sub">
                {typeLabel(doc.type)} · {doc.id} · {doc.pages}p · Created{" "}
                {doc.createdAt}
              </div>
              {/* Signer status row */}
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  marginTop: 6,
                }}
              >
                {doc.signers.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: s.signed
                        ? "rgba(34,211,160,.1)"
                        : "rgba(255,255,255,.05)",
                      border: `1px solid ${
                        s.signed ? "rgba(34,211,160,.3)" : "var(--border)"
                      }`,
                      borderRadius: 20,
                      padding: "2px 8px",
                      fontSize: 10,
                      color: s.signed ? T.green : T.muted,
                    }}
                  >
                    {s.signed ? "✓" : "○"} {s.name}
                    {s.signedAt && (
                      <span
                        style={{ color: T.muted, fontSize: 9, marginLeft: 2 }}
                      >
                        {s.signedAt.split(" · ")[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="esign-status">
              {allSigned ? (
                <span className="badge b-g">Complete</span>
              ) : (
                <span className="badge b-a">
                  {completedCount(doc)}/{doc.signers.length} signed
                </span>
              )}
              {myTurn && (
                <button
                  className="btn btn-sm btn-p"
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal({ doc });
                  }}
                >
                  Sign now ✍️
                </button>
              )}
              {!myTurn && !allSigned && (
                <button
                  className="btn btn-sm"
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast("Reminder sent to pending signers ✓", "success");
                  }}
                >
                  Remind
                </button>
              )}
              {allSigned && (
                <button
                  className="btn btn-sm"
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast("Download — PDF export via backend in Phase 1");
                  }}
                >
                  📄 PDF
                </button>
              )}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>✍️</div>
          <div style={{ fontSize: 14, color: T.text, marginBottom: 6 }}>
            No documents here
          </div>
          <div style={{ fontSize: 12 }}>
            Send a document for signature using the button above.
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // checking existing session
  const [isRecovery, setIsRecovery] = useState(false);
  const { toasts, toast } = useToast();

  // ── Inject global CSS ─────────────────────────────────────
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // ── Restore session on page load ──────────────────────────
  useEffect(() => {
    // Check for an existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        if (profile) setUser(profile);
      }
      setLoading(false);
    });

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
          setLoading(false);
          return;
        }
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
        } else if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          if (profile) setUser(profile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth    = (userData) => setUser(userData);
  const handleLogout  = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isRecovery)
    return (
      <>
        <ResetPasswordScreen onDone={async () => { setIsRecovery(false); setUser(null); }} />
        <Toasts toasts={toasts} />
      </>
    );
  if (loading)
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#08080d", color: "#6e6e8a", fontSize: 14,
      }}>
        Loading…
      </div>
    );

  if (!user)
    return (
      <>
        <AuthScreen onAuth={handleAuth} />
        <Toasts toasts={toasts} />
      </>
    );

  const isBoard = user.role === "admin" || user.role === "manager";

  return (
    <>
      {isBoard ? (
        <BoardShell user={user} onLogout={handleLogout} toast={toast} />
      ) : (
        <StaffShell user={user} onLogout={handleLogout} toast={toast} />
      )}
      <Toasts toasts={toasts} />
    </>
  );
}