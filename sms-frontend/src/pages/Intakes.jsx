// src/pages/Intakes.jsx
import { BASE_URL } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  fetchIntakes, createIntake, deleteIntake,
  fetchCourses, assignCourseToIntake, removeCourseFromIntake
} from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};
const CHIP_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22'];
const chipColor = (str) => {
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length];
};
const intakeInitials = (name) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return (words[0][0] + words[words.length-1][0]).toUpperCase();
};
const getStatusInfo = (status) => {
  if (status === 'active')    return { cls:'si-active',    label:'Active' };
  if (status === 'completed') return { cls:'si-completed', label:'Completed' };
  return { cls:'si-planned', label:'Planned' };
};
const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22'];
const avatarColor = (str) => { let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  :root {
    --sb-w:228px; --accent:#E8403A; --accent-soft:rgba(232,64,58,0.10);
    --bg:#f5f6fa; --white:#fff; --border:#e5e7eb;
    --text:#111827; --text2:#6b7280; --text3:#9ca3af; --r:10px;
    --fh:'Sora',sans-serif; --fb:'DM Sans',sans-serif;
  }

  .sl { display:flex; min-height:100vh; background:var(--bg); font-family:var(--fb); }
  .sm { margin-left:var(--sb-w); flex:1; display:flex; flex-direction:column; }

  .s-topbar {
    background:var(--white); border-bottom:1px solid var(--border);
    padding:0 28px; height:52px; position:sticky; top:0; z-index:50;
    display:flex; align-items:center; justify-content:space-between;
  }
  .s-bc { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text2); }
  .s-bc a { color:var(--text2); text-decoration:none; }
  .s-bc a:hover { color:var(--accent); }
  .s-bc strong { color:var(--text); font-weight:600; }
  .s-out-btn {
    height:32px; padding:0 12px; border-radius:7px; border:1.5px solid var(--border);
    background:#fff; font-family:var(--fb); font-size:12.5px; font-weight:600;
    color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s;
  }
  .s-out-btn:hover { border-color:var(--accent); color:var(--accent); }

  .sc-wrap { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }
  .s-head  { display:flex; align-items:flex-start; justify-content:space-between; }
  .s-title { font-family:var(--fh); font-size:22px; font-weight:700; color:var(--text); }
  .s-sub   { font-size:13px; color:var(--text2); margin-top:3px; }
  .s-add-btn {
    display:flex; align-items:center; gap:7px; height:40px; padding:0 18px;
    border-radius:8px; background:var(--accent); color:#fff; border:none;
    font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer;
    box-shadow:0 4px 12px rgba(232,64,58,0.30); transition:background .18s,transform .12s;
  }
  .s-add-btn:hover { background:#d43530; transform:translateY(-1px); }
  .s-icon-btn {
    display:flex; align-items:center; gap:6px; height:40px; padding:0 14px;
    border-radius:8px; border:1.5px solid var(--border); background:#fff;
    font-family:var(--fb); font-size:13px; font-weight:600; color:var(--text2);
    cursor:pointer; transition:border-color .15s,color .15s;
  }
  .s-icon-btn:hover { border-color:var(--accent); color:var(--accent); }

  /* Stat cards */
  .stat-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .stat-card {
    background:var(--white); border:1px solid var(--border); border-radius:var(--r);
    padding:18px 20px; display:flex; align-items:center; gap:14px;
    animation:fadeUp .35s ease both;
  }
  .stat-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .stat-label { font-size:12px; color:var(--text3); font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
  .stat-value { font-family:var(--fh); font-size:26px; font-weight:700; color:var(--text); margin-top:2px; }

  /* Table card */
  .s-card { background:var(--white); border-radius:var(--r); border:1px solid var(--border); overflow:hidden; animation:fadeUp .35s ease both; }
  .s-card-top { padding:12px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }

  /* Tabs */
  .tab-row { display:flex; align-items:center; gap:4px; }
  .tab-btn {
    height:34px; padding:0 16px; border-radius:8px; border:none;
    font-family:var(--fb); font-size:13px; font-weight:600;
    cursor:pointer; transition:background .15s,color .15s;
    background:transparent; color:var(--text2);
  }
  .tab-btn:hover { background:#f3f4f6; color:var(--text); }
  .tab-btn.tab-active { background:var(--accent); color:#fff; }

  table.st { width:100%; border-collapse:collapse; }
  table.st thead tr { background:#fafafa; }
  table.st th {
    text-align:left; padding:11px 16px; font-size:10.5px; font-weight:700;
    letter-spacing:.07em; text-transform:uppercase; color:var(--text3);
    border-bottom:1px solid var(--border);
  }
  table.st td { padding:13px 16px; font-size:13.5px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  table.st tr:last-child td { border-bottom:none; }
  table.st tbody tr { cursor:pointer; transition:background .12s; }
  table.st tbody tr:hover td { background:#fafbff; }

  .i-chip {
    display:inline-flex; align-items:center; justify-content:center;
    width:38px; height:38px; border-radius:9px;
    font-family:var(--fh); font-size:11px; font-weight:700; color:#fff; flex-shrink:0;
  }
  .i-name { font-weight:600; font-size:13.5px; }
  .i-sub  { font-size:11.5px; color:var(--text3); margin-top:1px; }

  .sbadge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11.5px; font-weight:700; }
  .sdot   { width:6px; height:6px; border-radius:50%; }
  .si-active    { background:#dcfce7; color:#166534; } .si-active .sdot    { background:#22c55e; }
  .si-planned   { background:#dbeafe; color:#1e40af; } .si-planned .sdot   { background:#3b82f6; }
  .si-completed { background:#f3f4f6; color:#6b7280; } .si-completed .sdot { background:#9ca3af; }

  .tbl-btn { height:28px; padding:0 10px; border-radius:6px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:12px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s; }
  .tbl-btn:hover { border-color:var(--accent); color:var(--accent); }

  /* Footer / Pagination */
  .s-foot { padding:12px 20px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-fi   { font-size:12.5px; color:var(--text3); }
  .pgn    { display:flex; align-items:center; gap:4px; }
  .pg-btn { min-width:30px; height:30px; padding:0 6px; border-radius:7px; border:1.5px solid var(--border); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:600; color:var(--text2); transition:border-color .15s,color .15s; }
  .pg-btn:hover:not(:disabled):not(.pga) { border-color:var(--accent); color:var(--accent); }
  .pg-btn:disabled { opacity:.35; cursor:not-allowed; }
  .pga { background:var(--accent); border-color:var(--accent); color:#fff; }
  .pg-el { font-size:13px; color:var(--text3); padding:0 4px; }

  .s-pf { padding:14px 28px; text-align:center; font-size:11.5px; color:var(--text3); letter-spacing:.04em; }

  /* Shimmer */
  .sh-bar { height:14px; border-radius:6px; background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  @keyframes shimmer { to { background-position:-200% 0; } }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

  /* Overlay + Panel */
  .ov { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:200; opacity:0; pointer-events:none; transition:opacity .25s; }
  .ov.open { opacity:1; pointer-events:all; }
  .sp {
    position:fixed; top:0; right:0; bottom:0; width:500px;
    background:#fff; box-shadow:-8px 0 32px rgba(0,0,0,0.12); z-index:201;
    display:flex; flex-direction:column;
    transform:translateX(100%); transition:transform .3s cubic-bezier(.22,.68,0,1.1);
  }
  .sp.open { transform:translateX(0); }

  .ph { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .ph-t { font-family:var(--fh); font-size:16px; font-weight:700; color:var(--text); }
  .ph-s { font-size:12.5px; color:var(--text2); margin-top:2px; }
  .ph-x { width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); font-size:18px; transition:border-color .15s,color .15s; }
  .ph-x:hover { border-color:var(--accent); color:var(--accent); }

  .pb { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:20px; }

  /* Form elements */
  .fs  { display:flex; flex-direction:column; gap:14px; }
  .fst { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); }
  .fr  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fg  { display:flex; flex-direction:column; gap:5px; }
  .fg.full { grid-column:1/-1; }
  .fl  { font-size:12.5px; font-weight:600; color:var(--text); }
  .fi, .fse {
    height:40px; border:1.5px solid var(--border); border-radius:8px;
    padding:0 12px; font-family:var(--fb); font-size:13.5px; color:var(--text);
    background:#fafafa; outline:none; width:100%; transition:border-color .2s,box-shadow .2s;
  }
  .fi:focus, .fse:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }
  .fi::placeholder { color:var(--text3); }
  .fse { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; background-size:12px; padding-right:32px; background-color:#fafafa; }
  .fe  { font-size:11.5px; color:var(--accent); margin-top:2px; }

  /* Footer buttons */
  .pft { padding:16px 24px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-shrink:0; background:#fff; }
  .btn-cancel { height:38px; padding:0 18px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:13.5px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s; }
  .btn-cancel:hover { border-color:var(--text2); }
  .btn-save { height:38px; padding:0 22px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; transition:background .18s; display:flex; align-items:center; gap:7px; }
  .btn-save:hover:not(:disabled) { background:#d43530; }
  .btn-save:disabled { opacity:.6; cursor:not-allowed; }
  .btn-del { height:38px; padding:0 18px; border-radius:8px; background:#fee2e2; color:#dc2626; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; margin-right:auto; display:flex; align-items:center; gap:6px; }
  .btn-del:hover { background:#fecaca; }

  .spin { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .gerr { background:#fff0f0; border:1px solid #fca5a5; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; }

  /* Profile hero */
  .p-hero { background:linear-gradient(135deg,#1a1d27 0%,#2d3148 100%); border-radius:10px; padding:20px; display:flex; align-items:center; gap:16px; }
  .p-chip { width:56px; height:56px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:14px; font-weight:700; color:#fff; border:3px solid rgba(255,255,255,0.15); }
  .p-name { font-family:var(--fh); font-size:17px; font-weight:700; color:#fff; }
  .p-sub  { font-size:12px; color:rgba(255,255,255,0.5); margin-top:3px; }

  /* Sections */
  .sec-blk { display:flex; flex-direction:column; gap:10px; }
  .sec-t   { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .sec-count { font-size:12px; color:var(--text2); font-weight:500; text-transform:none; letter-spacing:0; }

  /* Detail grid */
  .dg  { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .di  { display:flex; flex-direction:column; gap:3px; }
  .dl2 { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text3); }
  .dv  { font-size:13.5px; font-weight:600; color:var(--text); }

  /* Status buttons */
  .status-row { display:flex; gap:8px; }
  .st-btn { height:32px; padding:0 14px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:12.5px; font-weight:600; cursor:pointer; color:var(--text2); transition:all .15s; }
  .st-btn:hover { border-color:var(--text2); }
  .st-active-btn    { background:#dcfce7 !important; border-color:#22c55e !important; color:#166534 !important; }
  .st-planned-btn   { background:#dbeafe !important; border-color:#3b82f6 !important; color:#1e40af !important; }
  .st-completed-btn { background:#f3f4f6 !important; border-color:#9ca3af !important; color:#6b7280 !important; }

  /* Course rows */
  .course-row { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:8px; background:#fafafa; border:1px solid var(--border); }
  .course-chip { display:inline-flex; padding:3px 8px; border-radius:6px; font-family:var(--fh); font-size:11px; font-weight:700; color:#fff; margin-right:8px; }
  .course-nm   { font-size:13px; font-weight:600; color:var(--text); }
  .btn-unlink  { height:26px; padding:0 10px; border-radius:6px; background:#fee2e2; color:#dc2626; border:none; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--fb); }
  .btn-unlink:hover { background:#fecaca; }

  /* Assign row */
  .assign-row { display:flex; align-items:center; gap:8px; margin-top:4px; }
  .btn-assign { height:38px; padding:0 14px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; }
  .btn-assign:hover:not(:disabled) { background:#d43530; }
  .btn-assign:disabled { opacity:.6; cursor:not-allowed; }

  /* Student rows */
  .student-row { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; background:#fafafa; border:1px solid var(--border); }
  .s-av-sm { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:#fff; }
  .s-sn { font-size:13px; font-weight:600; color:var(--text); }
  .s-sd { font-size:11.5px; color:var(--text3); }

  /* Bulk notice */
  .bulk-notice { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; border-radius:8px; background:#fff7ed; border:1px solid #fed7aa; font-size:13px; color:#92400e; line-height:1.6; }
  .bulk-notice strong { color:#78350f; }

  .empty { text-align:center; padding:20px; color:var(--text3); font-size:13px; }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  plus:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevL: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  save:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  edit:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  link:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  info:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  filter:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  export:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

const ITEMS_PER_PAGE = 10;
const EMPTY_FORM = { name:'', start_date:'', end_date:'' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function Intakes() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');

  const [intakes,        setIntakes]        = useState([]);
  const [courses,        setCourses]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('all');
  const [page,           setPage]           = useState(1);

  // panels: null | 'add' | 'edit' | 'profile' | 'assign'
  const [panel,          setPanel]          = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formErr,        setFormErr]        = useState({});
  const [saving,         setSaving]         = useState(false);
  const [gErr,           setGErr]           = useState('');

  // Profile sub-data
  const [intakeCourses,  setIntakeCourses]  = useState([]);
  const [intakeStudents, setIntakeStudents] = useState([]);
  const [loadingC,       setLoadingC]       = useState(false);
  const [loadingS,       setLoadingS]       = useState(false);
  const [assignCId,      setAssignCId]      = useState('');
  const [assigning,      setAssigning]      = useState(false);

  // Assign panel
  const [apCourse,       setApCourse]       = useState('');
  const [apIntake,       setApIntake]       = useState('');
  const [apSaving,       setApSaving]       = useState(false);

  // ── Load intakes ────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try { const r = await fetchIntakes(); setIntakes(r.data || []); }
    catch { setIntakes([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { fetchCourses().then(r => setCourses(r.data || [])).catch(() => {}); }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = tab === 'all' ? intakes : intakes.filter(i => (i.status || 'planned') === tab);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalEnrolled = intakes.reduce((s, i) => s + parseInt(i.student_count || 0, 10), 0);
  const activeCount = intakes.filter(i => (i.status || 'planned') === 'active').length;
  const token = () => localStorage.getItem('token');

  // ── Profile loaders ──────────────────────────────────────────────────────────
  const loadCourses = async (id) => {
    setLoadingC(true); setIntakeCourses([]);
    try {
      const r = await fetch(`http://localhost:5000/api/intakes/${id}/courses`, { headers:{ Authorization:`Bearer ${token()}` } });
      const d = await r.json();
      setIntakeCourses(d.data || []);
    } catch { setIntakeCourses([]); }
    finally { setLoadingC(false); }
  };

  const loadStudents = async (id) => {
    setLoadingS(true); setIntakeStudents([]);
    try {
      const r = await fetch(`http://localhost:5000/api/intakes/${id}/students`, { headers:{ Authorization:`Bearer ${token()}` } });
      const d = await r.json();
      setIntakeStudents(d.data || []);
    } catch { setIntakeStudents([]); }
    finally { setLoadingS(false); }
  };

  // ── Panel openers ────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setGErr(''); setPanel('add'); };

  const openProfile = (i) => {
    setSelected(i); setAssignCId('');
    setPanel('profile');
    loadCourses(i.id);
    loadStudents(i.id);
  };

  const openEdit = () => {
    setForm({
      name:       selected.name || '',
      start_date: selected.start_date ? selected.start_date.split('T')[0] : '',
      end_date:   selected.end_date   ? selected.end_date.split('T')[0]   : '',
    });
    setFormErr({}); setGErr(''); setPanel('edit');
  };

  const openAssign = () => { setApCourse(''); setApIntake(''); setGErr(''); setPanel('assign'); };
  const closePanel = () => { setPanel(null); setSelected(null); setGErr(''); };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name       = 'Required';
    if (!form.start_date)  e.start_date = 'Required';
    if (!form.end_date)    e.end_date   = 'Required';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  // ── Save add/edit ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setGErr('');
    try {
      if (panel === 'add') {
        await createIntake(form);
      } else {
        const res = await fetch(`http://localhost:5000/api/intakes/${selected.id}`, {
          method: 'PUT',
          headers: { Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ ...form, status: selected.status || 'planned' })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      }
      closePanel(); load();
    } catch (err) { setGErr(err.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selected.name}"? This cannot be undone.`)) return;
    try { await deleteIntake(selected.id); closePanel(); load(); }
    catch (err) { alert(err.message || 'Failed to delete.'); }
  };

  // ── Status change ────────────────────────────────────────────────────────────
  const handleStatus = async (newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/intakes/${selected.id}`, {
        method: 'PUT',
        headers: { Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          name:       selected.name,
          start_date: selected.start_date?.split('T')[0],
          end_date:   selected.end_date?.split('T')[0],
          status:     newStatus
        })
      });
      if (!res.ok) throw new Error('Failed');
      setSelected(s => ({ ...s, status: newStatus }));
      setIntakes(prev => prev.map(i => i.id === selected.id ? { ...i, status: newStatus } : i));
    } catch { alert('Failed to update status.'); }
  };

  // ── Assign course to intake (from profile) ───────────────────────────────────
  const handleAssignCourse = async () => {
    if (!assignCId) return;
    setAssigning(true);
    try {
      await assignCourseToIntake(selected.id, assignCId);
      setAssignCId('');
      loadCourses(selected.id);
      load();
    } catch (err) { alert(err.message || 'Failed.'); }
    finally { setAssigning(false); }
  };

  // ── Remove course from intake (from profile) ─────────────────────────────────
  const handleRemoveCourse = async (courseId) => {
    if (!window.confirm('Remove this course? It will also be removed from all students in this intake.')) return;
    try {
      await removeCourseFromIntake(selected.id, courseId);
      loadCourses(selected.id);
      load();
    } catch (err) { alert(err.message || 'Failed.'); }
  };

  // ── Assign panel submit ──────────────────────────────────────────────────────
  const handleAssignPanel = async () => {
    if (!apCourse || !apIntake) return;
    setApSaving(true); setGErr('');
    try {
      await assignCourseToIntake(apIntake, apCourse);
      closePanel(); load();
    } catch (err) { setGErr(err.message || 'Failed.'); }
    finally { setApSaving(false); }
  };

  // ── Pagination ───────────────────────────────────────────────────────────────
  const renderPages = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const addBtn = (n) => <button key={n} className={`pg-btn${page===n?' pga':''}`} onClick={() => setPage(n)}>{n}</button>;
    pages.push(<button key="prev" className="pg-btn" onClick={() => setPage(p => p-1)} disabled={page===1}>{Ic.chevL}</button>);
    if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) pages.push(addBtn(i)); }
    else {
      pages.push(addBtn(1));
      if (page > 3) pages.push(<span key="e1" className="pg-el">…</span>);
      for (let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pages.push(addBtn(i));
      if (page < totalPages-2) pages.push(<span key="e2" className="pg-el">…</span>);
      pages.push(addBtn(totalPages));
    }
    pages.push(<button key="next" className="pg-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>{Ic.chevR}</button>);
    return pages;
  };

  const availableCourses = courses.filter(c => !intakeCourses.find(ic => String(ic.id) === String(c.id)));
  const isOpen = panel !== null;

  return (
    <>
      <style>{styles}</style>

      {/* Overlay */}
      <div className={`ov${isOpen?' open':''}`} onClick={closePanel}/>

      {/* Slide panel */}
      <div className={`sp${isOpen?' open':''}`}>

        {/* ─── ADD ─── */}
        {panel === 'add' && <>
          <div className="ph">
            <div><div className="ph-t">Add New Intake</div><div className="ph-s">Create a new student intake batch</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Intake Details</div>
              <div className="fg full">
                <label className="fl">Intake Name</label>
                <input className="fi" placeholder="e.g. Fall 2025" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}/>
                {formErr.name && <span className="fe">{formErr.name}</span>}
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Start Date</label>
                  <input className="fi" type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date:e.target.value}))}/>
                  {formErr.start_date && <span className="fe">{formErr.start_date}</span>}
                </div>
                <div className="fg">
                  <label className="fl">End Date</label>
                  <input className="fi" type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date:e.target.value}))}/>
                  {formErr.end_date && <span className="fe">{formErr.end_date}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : Ic.save}
              {saving ? 'Saving…' : 'Save Intake'}
            </button>
          </div>
        </>}

        {/* ─── EDIT ─── */}
        {panel === 'edit' && <>
          <div className="ph">
            <div><div className="ph-t">Edit Intake</div><div className="ph-s">Editing {selected?.name}</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Intake Details</div>
              <div className="fg full">
                <label className="fl">Intake Name</label>
                <input className="fi" placeholder="e.g. Fall 2025" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}/>
                {formErr.name && <span className="fe">{formErr.name}</span>}
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Start Date</label>
                  <input className="fi" type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date:e.target.value}))}/>
                  {formErr.start_date && <span className="fe">{formErr.start_date}</span>}
                </div>
                <div className="fg">
                  <label className="fl">End Date</label>
                  <input className="fi" type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date:e.target.value}))}/>
                  {formErr.end_date && <span className="fe">{formErr.end_date}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : Ic.save}
              {saving ? 'Saving…' : 'Update Intake'}
            </button>
          </div>
        </>}

        {/* ─── PROFILE ─── */}
        {panel === 'profile' && selected && (() => {
          const color = chipColor(selected.name);
          const si    = getStatusInfo(selected.status || 'planned');
          return <>
            <div className="ph">
              <div><div className="ph-t">Intake Profile</div><div className="ph-s">{selected.name}</div></div>
              <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
            </div>
            <div className="pb">
              {/* Hero */}
              <div className="p-hero">
                <div className="p-chip" style={{background:color}}>{intakeInitials(selected.name)}</div>
                <div>
                  <div className="p-name">{selected.name}</div>
                  <div className="p-sub">{formatDate(selected.start_date)} — {formatDate(selected.end_date)}</div>
                  <div style={{marginTop:8}}>
                    <span className={`sbadge ${si.cls}`}><span className="sdot"/>{si.label}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="sec-blk">
                <div className="sec-t">Details</div>
                <div className="dg">
                  <div className="di"><span className="dl2">Students</span><span className="dv">{parseInt(selected.student_count||0,10)}</span></div>
                  <div className="di"><span className="dl2">Courses</span><span className="dv">{loadingC ? '…' : intakeCourses.length}</span></div>
                  <div className="di"><span className="dl2">Start Date</span><span className="dv">{formatDate(selected.start_date)}</span></div>
                  <div className="di"><span className="dl2">End Date</span><span className="dv">{formatDate(selected.end_date)}</span></div>
                </div>
              </div>

              {/* Status */}
              <div className="sec-blk">
                <div className="sec-t">Change Status</div>
                <div className="status-row">
                  {['planned','active','completed'].map(s => (
                    <button
                      key={s}
                      className={`st-btn${(selected.status||'planned')===s ? ` st-${s}-btn` : ''}`}
                      onClick={() => handleStatus(s)}
                    >
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Courses */}
              <div className="sec-blk">
                <div className="sec-t">
                  Assigned Courses
                  <span className="sec-count">{loadingC ? '…' : `${intakeCourses.length} course${intakeCourses.length!==1?'s':''}`}</span>
                </div>
                {loadingC
                  ? <div className="empty">Loading…</div>
                  : intakeCourses.length === 0
                  ? <div className="empty">No courses assigned yet.</div>
                  : intakeCourses.map(c => (
                      <div className="course-row" key={c.id}>
                        <div style={{display:'flex',alignItems:'center'}}>
                          <span className="course-chip" style={{background:chipColor(c.course_code)}}>{c.course_code}</span>
                          <span className="course-nm">{c.course_name}</span>
                        </div>
                        <button className="btn-unlink" onClick={() => handleRemoveCourse(c.id)}>Remove</button>
                      </div>
                    ))
                }
                {availableCourses.length > 0 && (
                  <div className="assign-row">
                    <select className="fse" value={assignCId} onChange={e => setAssignCId(e.target.value)} style={{flex:1}}>
                      <option value="">Assign a course…</option>
                      {availableCourses.map(c => <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>)}
                    </select>
                    <button className="btn-assign" onClick={handleAssignCourse} disabled={!assignCId||assigning}>
                      {assigning ? '…' : '+ Assign'}
                    </button>
                  </div>
                )}
              </div>

              {/* Students */}
              <div className="sec-blk">
                <div className="sec-t">
                  Students
                  <span className="sec-count">{loadingS ? '…' : `${intakeStudents.length} student${intakeStudents.length!==1?'s':''}`}</span>
                </div>
                {loadingS
                  ? <div className="empty">Loading…</div>
                  : intakeStudents.length === 0
                  ? <div className="empty">No students enrolled yet.</div>
                  : <>
                      {intakeStudents.slice(0, 8).map(s => (
                        <div className="student-row" key={s.id}>
                          <div className="s-av-sm" style={{background:avatarColor(`${s.first_name}${s.last_name}`)}}>
                            {`${(s.first_name||'')[0]||''}${(s.last_name||'')[0]||''}`.toUpperCase()}
                          </div>
                          <div>
                            <div className="s-sn">{s.first_name} {s.last_name}</div>
                            <div className="s-sd">{s.degree_program}</div>
                          </div>
                        </div>
                      ))}
                      {intakeStudents.length > 8 && (
                        <div style={{textAlign:'center',fontSize:12.5,color:'var(--text3)',padding:'4px 0'}}>
                          +{intakeStudents.length - 8} more students
                        </div>
                      )}
                    </>
                }
              </div>
            </div>
            <div className="pft">
              <button className="btn-del" onClick={handleDelete}>{Ic.trash} Delete</button>
              <button className="btn-cancel" onClick={closePanel}>Close</button>
              <button className="btn-save" onClick={openEdit}>{Ic.edit} Edit</button>
            </div>
          </>;
        })()}

        {/* ─── ASSIGN PANEL ─── */}
        {panel === 'assign' && <>
          <div className="ph">
            <div><div className="ph-t">Assign Course to Intake</div><div className="ph-s">Link a course to a student cohort for automatic enrollment</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Assignment Details</div>
              <div className="fg full">
                <label className="fl">Select Course</label>
                <select className="fse" value={apCourse} onChange={e => setApCourse(e.target.value)}>
                  <option value="">Search and select a course…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>)}
                </select>
                <span style={{fontSize:12,color:'var(--text3)',marginTop:3}}>Choose the academic unit to assign.</span>
              </div>
              <div className="fg full">
                <label className="fl">Select Intake</label>
                <select className="fse" value={apIntake} onChange={e => setApIntake(e.target.value)}>
                  <option value="">Search and select an intake batch…</option>
                  {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <span style={{fontSize:12,color:'var(--text3)',marginTop:3}}>Target specific student cohort batch.</span>
              </div>
            </div>
            <div className="bulk-notice">
              {Ic.info}
              <span><strong>Bulk Assignment Notice</strong><br/>Performing this action will automatically enroll <strong>all students</strong> currently registered in the selected intake into the selected course.</span>
            </div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleAssignPanel} disabled={!apCourse||!apIntake||apSaving}>
              {apSaving ? <span className="spin"/> : Ic.link}
              {apSaving ? 'Assigning…' : 'Assign Course'}
            </button>
          </div>
        </>}

      </div>

      {/* ── Main layout ── */}
      <div className="sl">
        <Sidebar/>
        <div className="sm">

          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>Intakes</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('admin'); navigate('/login',{replace:true}); }}>Sign Out</button>
            </div>
          </header>

          <div className="sc-wrap">

            {/* Page header */}
            <div className="s-head">
              <div>
                <div className="s-title">Intakes</div>
                <div className="s-sub">Manage student intake batches and course assignments.</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button className="s-icon-btn" onClick={openAssign}>{Ic.link} Assign Course</button>
                <button className="s-add-btn" onClick={openAdd}>{Ic.plus} Add Intake</button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-icon" style={{background:'#fff7ed'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div className="stat-label">Active Intakes</div>
                  <div className="stat-value">{activeCount}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'#eff6ff'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div className="stat-label">Total Enrolled</div>
                  <div className="stat-value">{totalEnrolled.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="s-card">
              <div className="s-card-top">
                <div className="tab-row">
                  {['all','active','planned','completed'].map(t => (
                    <button key={t} className={`tab-btn${tab===t?' tab-active':''}`} onClick={() => { setTab(t); setPage(1); }}>
                      {t === 'all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="s-icon-btn" style={{height:34,fontSize:12.5}}>{Ic.filter} Filters</button>
                  <button className="s-icon-btn" style={{height:34,fontSize:12.5}}>{Ic.export} Export</button>
                </div>
              </div>

              <table className="st">
                <thead>
                  <tr>
                    <th>Intake Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Enrolled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:5}).map((_,i) => (
                        <tr key={i}>
                          {[160,80,90,90,50,60].map((w,j) => (
                            <td key={j}><div className="sh-bar" style={{width:w}}/></td>
                          ))}
                        </tr>
                      ))
                    : paged.length === 0
                    ? <tr><td colSpan={6} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No intakes found.</td></tr>
                    : paged.map(intake => {
                        const color = chipColor(intake.name);
                        const si    = getStatusInfo(intake.status || 'planned');
                        return (
                          <tr key={intake.id} onClick={() => openProfile(intake)}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div className="i-chip" style={{background:color}}>{intakeInitials(intake.name)}</div>
                                <div>
                                  <div className="i-name">{intake.name}</div>
                                  <div className="i-sub">{parseInt(intake.student_count||0,10)} students enrolled</div>
                                </div>
                              </div>
                            </td>
                            <td><span className={`sbadge ${si.cls}`}><span className="sdot"/>{si.label}</span></td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatDate(intake.start_date)}</td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatDate(intake.end_date)}</td>
                            <td style={{fontSize:13.5,fontWeight:700}}>{parseInt(intake.student_count||0,10).toLocaleString()}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <button className="tbl-btn" onClick={() => openProfile(intake)}>View</button>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>

              <div className="s-foot">
                <span className="s-fi">
                  {filtered.length === 0
                    ? 'No entries'
                    : `Showing ${Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)}–${Math.min(page*ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} intakes`
                  }
                </span>
                <div className="pgn">{renderPages()}</div>
              </div>
            </div>
          </div>

          <div className="s-pf">Student Management System</div>
        </div>
      </div>
    </>
  );
}
