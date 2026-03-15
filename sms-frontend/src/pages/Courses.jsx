// src/pages/Courses.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchCourses, createCourse, updateCourse, deleteCourse, fetchIntakes, assignCourseToIntake, removeCourseFromIntake } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};
const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22'];
const codeColor = (str) => {
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body, #root { width:100%; min-height:100vh; }

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
    height:32px; padding:0 12px; border-radius:7px;
    border:1.5px solid var(--border); background:#fff;
    font-family:var(--fb); font-size:12.5px; font-weight:600;
    color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s;
  }
  .s-out-btn:hover { border-color:var(--accent); color:var(--accent); }

  .s-search-row {
    padding:12px 28px; background:var(--white);
    border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:10px;
  }
  .s-sw { flex:1; position:relative; }
  .s-si { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; display:flex; }
  .s-input {
    width:100%; height:38px; border:1.5px solid var(--border);
    border-radius:8px; padding:0 14px 0 36px;
    font-family:var(--fb); font-size:13.5px; color:var(--text);
    background:#fafafa; outline:none; transition:border-color .2s,box-shadow .2s;
  }
  .s-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }
  .s-input::placeholder { color:var(--text3); }
  .s-icon-btn {
    display:flex; align-items:center; gap:6px; height:38px; padding:0 14px;
    border-radius:8px; border:1.5px solid var(--border); background:#fff;
    font-family:var(--fb); font-size:13px; font-weight:600;
    color:var(--text2); cursor:pointer; white-space:nowrap;
    transition:border-color .15s,color .15s;
  }
  .s-icon-btn:hover { border-color:var(--accent); color:var(--accent); }

  .sc-wrap { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }
  .s-head  { display:flex; align-items:flex-start; justify-content:space-between; }
  .s-title { font-family:var(--fh); font-size:22px; font-weight:700; color:var(--text); }
  .s-sub   { font-size:13px; color:var(--text2); margin-top:3px; }
  .s-add-btn {
    display:flex; align-items:center; gap:7px; height:40px; padding:0 18px;
    border-radius:8px; background:var(--accent); color:#fff; border:none;
    font-family:var(--fb); font-size:13.5px; font-weight:700;
    cursor:pointer; box-shadow:0 4px 12px rgba(232,64,58,0.30);
    transition:background .18s,transform .12s; white-space:nowrap;
  }
  .s-add-btn:hover { background:#d43530; transform:translateY(-1px); }

  .s-card { background:var(--white); border-radius:var(--r); border:1px solid var(--border); overflow:hidden; animation:fadeUp .35s ease both; }
  .s-card-top { padding:12px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-show { font-size:13px; color:var(--text2); font-weight:500; }
  .s-show strong { color:var(--text); }
  .s-sort { font-size:12px; color:var(--text3); display:flex; align-items:center; gap:5px; }

  table.st { width:100%; border-collapse:collapse; }
  table.st thead tr { background:#fafafa; }
  table.st th {
    text-align:left; padding:11px 16px;
    font-size:10.5px; font-weight:700; letter-spacing:.07em;
    text-transform:uppercase; color:var(--text3);
    border-bottom:1px solid var(--border);
  }
  table.st td { padding:13px 16px; font-size:13.5px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  table.st tr:last-child td { border-bottom:none; }
  table.st tbody tr { cursor:pointer; transition:background .12s; }
  table.st tbody tr:hover td { background:#fafbff; }

  .c-code-chip {
    display:inline-flex; align-items:center; justify-content:center;
    padding:4px 10px; border-radius:7px;
    font-family:var(--fh); font-size:12px; font-weight:700; color:#fff;
    letter-spacing:.04em;
  }
  .c-name  { font-weight:600; font-size:13.5px; }
  .c-desc  { font-size:11.5px; color:var(--text3); margin-top:2px; max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .intake-count {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:20px;
    background:#f3f4f6; font-size:12px; font-weight:600; color:var(--text2);
  }

  .s-foot { padding:12px 20px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-fi   { font-size:12.5px; color:var(--text3); }
  .pgn    { display:flex; align-items:center; gap:4px; }
  .pg-btn {
    min-width:30px; height:30px; padding:0 6px; border-radius:7px;
    border:1.5px solid var(--border); background:#fff;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    font-size:12.5px; font-weight:600; color:var(--text2);
    transition:border-color .15s,color .15s,background .15s;
  }
  .pg-btn:hover:not(:disabled):not(.pga) { border-color:var(--accent); color:var(--accent); }
  .pg-btn:disabled { opacity:.35; cursor:not-allowed; }
  .pga { background:var(--accent); border-color:var(--accent); color:#fff; }
  .pg-el { font-size:13px; color:var(--text3); padding:0 4px; }

  .s-pf { padding:14px 28px; text-align:center; font-size:11.5px; color:var(--text3); letter-spacing:.04em; }

  .sh-bar { height:14px; border-radius:6px; background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  @keyframes shimmer { to { background-position:-200% 0; } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

  /* Panels */
  .ov { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:200; opacity:0; pointer-events:none; transition:opacity .25s; }
  .ov.open { opacity:1; pointer-events:all; }
  .sp {
    position:fixed; top:0; right:0; bottom:0; width:500px;
    background:#fff; box-shadow:-8px 0 32px rgba(0,0,0,0.12);
    z-index:201; display:flex; flex-direction:column;
    transform:translateX(100%); transition:transform .3s cubic-bezier(.22,.68,0,1.1);
  }
  .sp.open { transform:translateX(0); }

  .ph { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .ph-t { font-family:var(--fh); font-size:16px; font-weight:700; color:var(--text); }
  .ph-s { font-size:12.5px; color:var(--text2); margin-top:2px; }
  .ph-x { width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); font-size:18px; transition:border-color .15s,color .15s; }
  .ph-x:hover { border-color:var(--accent); color:var(--accent); }

  .pb { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:20px; }

  .fs  { display:flex; flex-direction:column; gap:14px; }
  .fst { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); }
  .fr  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fg  { display:flex; flex-direction:column; gap:5px; }
  .fg.full { grid-column:1/-1; }
  .fl  { font-size:12.5px; font-weight:600; color:var(--text); }
  .fi, .fta {
    border:1.5px solid var(--border); border-radius:8px;
    padding:0 12px; font-family:var(--fb); font-size:13.5px; color:var(--text);
    background:#fafafa; outline:none; width:100%; transition:border-color .2s,box-shadow .2s;
  }
  .fi  { height:40px; }
  .fta { height:80px; padding:10px 12px; resize:vertical; }
  .fi:focus, .fta:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }
  .fi::placeholder, .fta::placeholder { color:var(--text3); }
  .fe  { font-size:11.5px; color:var(--accent); margin-top:2px; }

  .pft { padding:16px 24px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-shrink:0; background:#fff; }
  .btn-cancel { height:38px; padding:0 18px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:13.5px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s; }
  .btn-cancel:hover { border-color:var(--text2); color:var(--text); }
  .btn-save { height:38px; padding:0 22px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; transition:background .18s; display:flex; align-items:center; gap:7px; }
  .btn-save:hover:not(:disabled) { background:#d43530; }
  .btn-save:disabled { opacity:.6; cursor:not-allowed; }
  .btn-del { height:38px; padding:0 18px; border-radius:8px; background:#fee2e2; color:#dc2626; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; transition:background .15s; margin-right:auto; display:flex; align-items:center; gap:6px; }
  .btn-del:hover { background:#fecaca; }

  .spin { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .gerr { background:#fff0f0; border:1px solid #fca5a5; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; animation:shake .3s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }

  /* Profile */
  .c-hero { border-radius:10px; padding:20px; display:flex; align-items:center; gap:16px; }
  .c-hero-code { width:60px; height:60px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:13px; font-weight:700; color:#fff; flex-shrink:0; letter-spacing:.04em; border:3px solid rgba(255,255,255,0.15); }
  .c-hero-name { font-family:var(--fh); font-size:16px; font-weight:700; color:#fff; }
  .c-hero-code-text { font-size:12px; color:rgba(255,255,255,0.5); margin-top:3px; }

  .sec-blk { display:flex; flex-direction:column; gap:10px; }
  .sec-t   { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .btn-xs  { height:26px; padding:0 10px; border-radius:6px; background:var(--accent-soft); color:var(--accent); border:none; font-family:var(--fb); font-size:12px; font-weight:700; cursor:pointer; }
  .btn-xs:hover { background:rgba(232,64,58,0.18); }

  .dg  { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .di  { display:flex; flex-direction:column; gap:3px; }
  .dl2 { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text3); }
  .dv  { font-size:13.5px; font-weight:600; color:var(--text); }

  .intake-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 12px; border-radius:8px; background:#fafafa; border:1px solid var(--border);
  }
  .intake-row-name { font-size:13px; font-weight:600; color:var(--text); }
  .intake-row-dates { font-size:11.5px; color:var(--text3); margin-top:2px; }
  .btn-unlink { height:26px; padding:0 10px; border-radius:6px; background:#fee2e2; color:#dc2626; border:none; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--fb); }
  .btn-unlink:hover { background:#fecaca; }

  .assign-row { display:flex; align-items:center; gap:8px; }
  .fse {
    flex:1; height:38px; border:1.5px solid var(--border); border-radius:8px;
    padding:0 12px; font-family:var(--fb); font-size:13px; color:var(--text);
    background:#fafafa; outline:none; cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center; background-size:12px;
    padding-right:32px; background-color:#fafafa;
    transition:border-color .2s;
  }
  .fse:focus { border-color:var(--accent); outline:none; }
  .btn-assign { height:38px; padding:0 14px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; }
  .btn-assign:hover { background:#d43530; }
  .btn-assign:disabled { opacity:.6; cursor:not-allowed; }

  .empty { text-align:center; padding:20px; color:var(--text3); font-size:13px; }
  .desc-box { background:#fafafa; border:1px solid var(--border); border-radius:8px; padding:12px 14px; font-size:13.5px; color:var(--text2); line-height:1.6; }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  az:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>,
  book:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

const ITEMS_PER_PAGE = 10;
const EMPTY_FORM = { course_code:'', course_name:'', description:'', intake_id:'' };

// ── Component ─────────────────────────────────────────────────────────────────
const Courses = () => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');

  const [courses,  setCourses]  = useState([]);
  const [intakes,  setIntakes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const searchTimer = useRef(null);

  const [panel,    setPanel]    = useState(null); // 'add' | 'edit' | 'profile'
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState({});
  const [saving,   setSaving]   = useState(false);
  const [gErr,     setGErr]     = useState('');

  // Intake assignment state
  const [assignIntakeId, setAssignIntakeId] = useState('');
  const [assigning,      setAssigning]      = useState(false);
  const [assignedIntakes, setAssignedIntakes] = useState([]);
  const [loadingIntakes,  setLoadingIntakes]  = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // ── Load courses ────────────────────────────────────────────────────────────
  const load = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: ITEMS_PER_PAGE };
      if (q) params.search = q;
      const res = await fetchCourses(params);
      setCourses(res.data || []);
      setTotal(res.pagination?.total || res.data?.length || 0);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);
  useEffect(() => { fetchIntakes().then(r => setIntakes(r.data || [])).catch(() => {}); }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v); }, 400);
  };

  const goPage = (p) => { setPage(p); load(p, search); };

  // ── Load intakes assigned to this course ────────────────────────────────────
  const loadCourseIntakes = async (courseId) => {
    setLoadingIntakes(true);
    try {
      const res = await fetchCourses({ id: courseId }); // will use fetchCourseIntakes below
      // Use the dedicated endpoint
      const token = localStorage.getItem('token');
      const r = await fetch(`http://localhost:5000/api/courses/${courseId}/intakes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      setAssignedIntakes(data.data || []);
    } catch { setAssignedIntakes([]); }
    finally { setLoadingIntakes(false); }
  };

  // ── Panels ──────────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setGErr(''); setPanel('add'); };
  const openProfile = (c) => {
    setSelected(c); setAssignIntakeId(''); setAssignedIntakes([]);
    setPanel('profile'); loadCourseIntakes(c.id);
  };
  const openEdit = () => {
    setForm({ course_code: selected.course_code||'', course_name: selected.course_name||'', description: selected.description||'' });
    setFormErr({}); setGErr(''); setPanel('edit');
  };
  const closePanel = () => { setPanel(null); setSelected(null); setGErr(''); };

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.course_code.trim()) e.course_code = 'Required';
    if (!form.course_name.trim()) e.course_name = 'Required';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setGErr('');
    try {
      let savedCourse;
      if (panel === 'add') savedCourse = await createCourse({ course_code: form.course_code, course_name: form.course_name, description: form.description });
      else savedCourse = await updateCourse(selected.id, { course_code: form.course_code, course_name: form.course_name, description: form.description });

      // If an intake was selected, assign it
      if (form.intake_id && panel === 'add') {
        const courseId = savedCourse?.data?.id || savedCourse?.id;
        if (courseId) await assignCourseToIntake(form.intake_id, courseId).catch(()=>{});
      }

      closePanel(); load(page, search);
    } catch (err) { setGErr(err.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selected.course_name}"? This cannot be undone.`)) return;
    try { await deleteCourse(selected.id); closePanel(); load(page, search); }
    catch (err) { alert(err.message || 'Failed to delete.'); }
  };

  // ── Assign intake to course ─────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignIntakeId) return;
    setAssigning(true);
    try {
      await assignCourseToIntake(assignIntakeId, selected.id);
      setAssignIntakeId('');
      loadCourseIntakes(selected.id);
    } catch (err) { alert(err.message || 'Failed to assign.'); }
    finally { setAssigning(false); }
  };

  // ── Remove intake from course ───────────────────────────────────────────────
  const handleUnassign = async (intakeId) => {
    if (!window.confirm('Remove this intake assignment?')) return;
    try {
      await removeCourseFromIntake(intakeId, selected.id);
      loadCourseIntakes(selected.id);
    } catch (err) { alert(err.message || 'Failed to remove.'); }
  };

  // ── Pagination ──────────────────────────────────────────────────────────────
  const renderPages = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const addPage = (n) => (
      <button key={n} className={`pg-btn${page===n?' pga':''}`} onClick={() => goPage(n)}>{n}</button>
    );
    pages.push(<button key="prev" className="pg-btn" onClick={() => goPage(page-1)} disabled={page===1}>{Ic.chevL}</button>);
    if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) pages.push(addPage(i)); }
    else {
      pages.push(addPage(1));
      if (page > 3) pages.push(<span key="e1" className="pg-el">…</span>);
      for (let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pages.push(addPage(i));
      if (page < totalPages-2) pages.push(<span key="e2" className="pg-el">…</span>);
      pages.push(addPage(totalPages));
    }
    pages.push(<button key="next" className="pg-btn" onClick={() => goPage(page+1)} disabled={page===totalPages}>{Ic.chevR}</button>);
    return pages;
  };

  // ── Available intakes for assignment (not already assigned) ─────────────────
  const availableIntakes = intakes.filter(i => !assignedIntakes.find(a => String(a.id) === String(i.id)));

  // ── Form Panel ──────────────────────────────────────────────────────────────
const FormPanel = () => (
    <>
      <div className="ph">
        <div>
          <div className="ph-t">{panel==='add' ? 'Add New Course' : 'Edit Course'}</div>
          <div className="ph-s">{panel==='add' ? 'Enter the course details below' : `Editing ${selected?.course_code} — ${selected?.course_name}`}</div>
        </div>
        <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
      </div>
      <div className="pb">
        {gErr && <div className="gerr">{gErr}</div>}
        <div className="fs">
          <div className="fst">Course Information</div>
          <div className="fr">
            <div className="fg">
              <label className="fl">Course Code</label>
              <input className="fi" placeholder="e.g. CS101" value={form.course_code} onChange={e=>setForm(f=>({...f,course_code:e.target.value.toUpperCase()}))}/>
              {formErr.course_code && <span className="fe">{formErr.course_code}</span>}
            </div>
            <div className="fg">
              <label className="fl">Course Name</label>
              <input className="fi" placeholder="e.g. Introduction to Computing" value={form.course_name} onChange={e=>setForm(f=>({...f,course_name:e.target.value}))}/>
              {formErr.course_name && <span className="fe">{formErr.course_name}</span>}
            </div>
          </div>
          <div className="fg full">
            <label className="fl">Description <span style={{color:'var(--text3)',fontWeight:400}}>(optional)</span></label>
            <textarea className="fta" placeholder="Brief description of the course content…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>
        </div>

        <div className="fs">
          <div className="fst">Intake Assignment <span style={{color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:11}}>(optional)</span></div>
          <div className="fg full">
            <label className="fl">Assign to Intake</label>
            <select className="fse" value={form.intake_id||''} onChange={e=>setForm(f=>({...f,intake_id:e.target.value}))}>
              <option value="">Skip for now</option>
              {intakes.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <span style={{fontSize:12,color:'var(--text3)',marginTop:4}}>You can also assign intakes later from the course profile.</span>
          </div>
        </div>
      </div>
      <div className="pft">
        <button className="btn-cancel" onClick={closePanel}>Cancel</button>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spin"/> : Ic.save}
          {saving ? 'Saving…' : panel==='add' ? 'Save Course' : 'Update Course'}
        </button>
      </div>
    </>
  );

  // ── Profile Panel ───────────────────────────────────────────────────────────
  const ProfilePanel = () => {
    if (!selected) return null;
    const color = codeColor(selected.course_code);
    return (
      <>
        <div className="ph">
          <div>
            <div className="ph-t">Course Details</div>
            <div className="ph-s">{selected.course_code} — {selected.course_name}</div>
          </div>
          <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
        </div>
        <div className="pb">
          {/* Hero */}
          <div className="c-hero" style={{background:`linear-gradient(135deg, ${color}dd, ${color}99)`}}>
            <div className="c-hero-code" style={{background:'rgba(0,0,0,0.2)'}}>{selected.course_code}</div>
            <div>
              <div className="c-hero-name">{selected.course_name}</div>
              <div className="c-hero-code-text">Added {formatDate(selected.created_at)}</div>
            </div>
          </div>

          {/* Description */}
          {selected.description && (
            <div className="sec-blk">
              <div className="sec-t">Description</div>
              <div className="desc-box">{selected.description}</div>
            </div>
          )}

          {/* Assigned Intakes */}
          <div className="sec-blk">
            <div className="sec-t">
              Assigned Intakes
              <span style={{fontSize:12,color:'var(--text2)',fontWeight:500,textTransform:'none',letterSpacing:0}}>
                {loadingIntakes ? 'Loading…' : `${assignedIntakes.length} intake${assignedIntakes.length!==1?'s':''}`}
              </span>
            </div>
            {loadingIntakes
              ? <div className="empty">Loading…</div>
              : assignedIntakes.length === 0
              ? <div className="empty">No intakes assigned yet.</div>
              : assignedIntakes.map(i => (
                  <div className="intake-row" key={i.id}>
                    <div>
                      <div className="intake-row-name">{i.name}</div>
                      <div className="intake-row-dates">{formatDate(i.start_date)} — {formatDate(i.end_date)}</div>
                    </div>
                    <button className="btn-unlink" onClick={() => handleUnassign(i.id)}>Remove</button>
                  </div>
                ))
            }
            {/* Assign form */}
            {availableIntakes.length > 0 && (
              <div className="assign-row">
                <select className="fse" value={assignIntakeId} onChange={e=>setAssignIntakeId(e.target.value)}>
                  <option value="">Assign to intake…</option>
                  {availableIntakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <button className="btn-assign" onClick={handleAssign} disabled={!assignIntakeId||assigning}>
                  {assigning ? '…' : '+ Assign'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="pft">
          <button className="btn-del" onClick={handleDelete}>{Ic.trash} Delete</button>
          <button className="btn-cancel" onClick={closePanel}>Close</button>
          <button className="btn-save" onClick={openEdit}>{Ic.edit} Edit Course</button>
        </div>
      </>
    );
  };

const isOpen = panel !== null;

return (
    <>
      <style>{styles}</style>
      <div className={`ov${isOpen?' open':''}`} onClick={closePanel}/>
      <div className={`sp${isOpen?' open':''}`}>

        {/* ── Form Panel ── */}
        {(panel==='add'||panel==='edit') && (
          <>
            <div className="ph">
              <div>
                <div className="ph-t">{panel==='add' ? 'Add New Course' : 'Edit Course'}</div>
                <div className="ph-s">{panel==='add' ? 'Enter the course details below' : `Editing ${selected?.course_code} — ${selected?.course_name}`}</div>
              </div>
              <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
            </div>
            <div className="pb">
              {gErr && <div className="gerr">{gErr}</div>}
              <div className="fs">
                <div className="fst">Course Information</div>
                <div className="fr">
                  <div className="fg">
                    <label className="fl">Course Code</label>
                    <input className="fi" placeholder="e.g. CS101" value={form.course_code} onChange={e=>setForm(f=>({...f,course_code:e.target.value.toUpperCase()}))}/>
                    {formErr.course_code && <span className="fe">{formErr.course_code}</span>}
                  </div>
                  <div className="fg">
                    <label className="fl">Course Name</label>
                    <input className="fi" placeholder="e.g. Introduction to Computing" value={form.course_name} onChange={e=>setForm(f=>({...f,course_name:e.target.value}))}/>
                    {formErr.course_name && <span className="fe">{formErr.course_name}</span>}
                  </div>
                </div>
                <div className="fg full">
                  <label className="fl">Description <span style={{color:'var(--text3)',fontWeight:400}}>(optional)</span></label>
                  <textarea className="fta" placeholder="Brief description of the course content…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
                </div>
              </div>
              <div className="fs">
                <div className="fst">Intake Assignment <span style={{color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:11}}>(optional)</span></div>
                <div className="fg full">
                  <label className="fl">Assign to Intake</label>
                  <select className="fse" value={form.intake_id||''} onChange={e=>setForm(f=>({...f,intake_id:e.target.value}))}>
                    <option value="">Skip for now</option>
                    {intakes.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <span style={{fontSize:12,color:'var(--text3)',marginTop:4}}>You can also assign intakes later from the course profile.</span>
                </div>
              </div>
            </div>
            <div className="pft">
              <button className="btn-cancel" onClick={closePanel}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spin"/> : Ic.save}
                {saving ? 'Saving…' : panel==='add' ? 'Save Course' : 'Update Course'}
              </button>
            </div>
          </>
        )}

        {/* ── Profile Panel ── */}
        {panel==='profile' && selected && (() => {
          const color = codeColor(selected.course_code);
          return (
            <>
              <div className="ph">
                <div>
                  <div className="ph-t">Course Details</div>
                  <div className="ph-s">{selected.course_code} — {selected.course_name}</div>
                </div>
                <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
              </div>
              <div className="pb">
                <div className="c-hero" style={{background:`linear-gradient(135deg, ${color}dd, ${color}99)`}}>
                  <div className="c-hero-code" style={{background:'rgba(0,0,0,0.2)'}}>{selected.course_code}</div>
                  <div>
                    <div className="c-hero-name">{selected.course_name}</div>
                    <div className="c-hero-code-text">Added {formatDate(selected.created_at)}</div>
                  </div>
                </div>
                {selected.description && (
                  <div className="sec-blk">
                    <div className="sec-t">Description</div>
                    <div className="desc-box">{selected.description}</div>
                  </div>
                )}
                <div className="sec-blk">
                  <div className="sec-t">
                    Assigned Intakes
                    <span style={{fontSize:12,color:'var(--text2)',fontWeight:500,textTransform:'none',letterSpacing:0}}>
                      {loadingIntakes ? 'Loading…' : `${assignedIntakes.length} intake${assignedIntakes.length!==1?'s':''}`}
                    </span>
                  </div>
                  {loadingIntakes
                    ? <div className="empty">Loading…</div>
                    : assignedIntakes.length === 0
                    ? <div className="empty">No intakes assigned yet.</div>
                    : assignedIntakes.map(i => (
                        <div className="intake-row" key={i.id}>
                          <div>
                            <div className="intake-row-name">{i.name}</div>
                            <div className="intake-row-dates">{formatDate(i.start_date)} — {formatDate(i.end_date)}</div>
                          </div>
                          <button className="btn-unlink" onClick={() => handleUnassign(i.id)}>Remove</button>
                        </div>
                      ))
                  }
                  {availableIntakes.length > 0 && (
                    <div className="assign-row">
                      <select className="fse" value={assignIntakeId} onChange={e=>setAssignIntakeId(e.target.value)}>
                        <option value="">Assign to intake…</option>
                        {availableIntakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <button className="btn-assign" onClick={handleAssign} disabled={!assignIntakeId||assigning}>
                        {assigning ? '…' : '+ Assign'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="pft">
                <button className="btn-del" onClick={handleDelete}>{Ic.trash} Delete</button>
                <button className="btn-cancel" onClick={closePanel}>Close</button>
                <button className="btn-save" onClick={openEdit}>{Ic.edit} Edit Course</button>
              </div>
            </>
          );
        })()}

      </div>

      <div className="sl">
        <Sidebar/>
        <div className="sm">
          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>Courses</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('admin');navigate('/login',{replace:true});}}>Sign Out</button>
            </div>
          </header>

          <div className="s-search-row">
            <div className="s-sw">
              <span className="s-si">{Ic.search}</span>
              <input className="s-input" placeholder="Search by course code or name…" value={search} onChange={e=>handleSearch(e.target.value)}/>
            </div>
          </div>

          <div className="sc-wrap">
            <div className="s-head">
              <div>
                <div className="s-title">Courses</div>
                <div className="s-sub">Manage all courses and their intake assignments.</div>
              </div>
              <button className="s-add-btn" onClick={openAdd}>{Ic.plus} Add Course</button>
            </div>

            <div className="s-card">
              <div className="s-card-top">
                <span className="s-show">SHOW <strong>{ITEMS_PER_PAGE} rows</strong></span>
                <span className="s-sort">Sorted by Date Added (Newest) {Ic.az}</span>
              </div>
              <table className="st">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:5}).map((_,i)=>(
                        <tr key={i}>
                          <td><div className="sh-bar" style={{width:70}}/></td>
                          <td><div className="sh-bar" style={{width:200}}/></td>
                          <td><div className="sh-bar" style={{width:220}}/></td>
                          <td><div className="sh-bar" style={{width:80}}/></td>
                          <td><div className="sh-bar" style={{width:50}}/></td>
                        </tr>
                      ))
                    : courses.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No courses found.</td></tr>
                    : courses.map(c => {
                        const color = codeColor(c.course_code);
                        return (
                          <tr key={c.id} onClick={()=>openProfile(c)}>
                            <td><span className="c-code-chip" style={{background:color}}>{c.course_code}</span></td>
                            <td><div className="c-name">{c.course_name}</div></td>
                            <td><div className="c-desc">{c.description || <span style={{color:'var(--text3)'}}>No description</span>}</div></td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatDate(c.created_at)}</td>
                            <td onClick={e=>e.stopPropagation()}>
                              <button className="s-icon-btn" style={{height:30,padding:'0 10px',fontSize:12}} onClick={()=>openProfile(c)}>View</button>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
              <div className="s-foot">
                <span className="s-fi">
                  {total === 0 ? 'No entries' : `Showing ${(page-1)*ITEMS_PER_PAGE+1} to ${Math.min(page*ITEMS_PER_PAGE,total)} of ${total.toLocaleString()} entries`}
                </span>
                <div className="pgn">{renderPages()}</div>
              </div>
            </div>
          </div>

          <div className="s-pf">© 2024 University Student Management System • Version 1.0</div>
        </div>
      </div>
    </>
  );
  

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className={`ov${isOpen?' open':''}`} onClick={closePanel}/>
      <div className={`sp${isOpen?' open':''}`}>
        {(panel==='add'||panel==='edit') && <FormPanel/>}
        {panel==='profile' && <ProfilePanel/>}
      </div>

      <div className="sl">
        <Sidebar/>
        <div className="sm">

          {/* Topbar */}
          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>Courses</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('admin');navigate('/login',{replace:true});}}>Sign Out</button>
            </div>
          </header>

          {/* Search Row */}
          <div className="s-search-row">
            <div className="s-sw">
              <span className="s-si">{Ic.search}</span>
              <input className="s-input" placeholder="Search by course code or name…" value={search} onChange={e=>handleSearch(e.target.value)}/>
            </div>
          </div>

          {/* Content */}
          <div className="sc-wrap">
            <div className="s-head">
              <div>
                <div className="s-title">Courses</div>
                <div className="s-sub">Manage all courses and their intake assignments.</div>
              </div>
              <button className="s-add-btn" onClick={openAdd}>{Ic.plus} Add Course</button>
            </div>

            <div className="s-card">
              <div className="s-card-top">
                <span className="s-show">SHOW <strong>{ITEMS_PER_PAGE} rows</strong></span>
                <span className="s-sort">Sorted by Date Added (Newest) {Ic.az}</span>
              </div>

              <table className="st">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:5}).map((_,i)=>(
                        <tr key={i}>
                          <td><div className="sh-bar" style={{width:70}}/></td>
                          <td><div className="sh-bar" style={{width:200}}/></td>
                          <td><div className="sh-bar" style={{width:220}}/></td>
                          <td><div className="sh-bar" style={{width:80}}/></td>
                          <td><div className="sh-bar" style={{width:50}}/></td>
                        </tr>
                      ))
                    : courses.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No courses found.</td></tr>
                    : courses.map(c => {
                        const color = codeColor(c.course_code);
                        return (
                          <tr key={c.id} onClick={()=>openProfile(c)}>
                            <td>
                              <span className="c-code-chip" style={{background:color}}>{c.course_code}</span>
                            </td>
                            <td>
                              <div className="c-name">{c.course_name}</div>
                            </td>
                            <td>
                              <div className="c-desc">{c.description || <span style={{color:'var(--text3)'}}>No description</span>}</div>
                            </td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatDate(c.created_at)}</td>
                            <td onClick={e=>e.stopPropagation()}>
                              <button className="s-icon-btn" style={{height:30,padding:'0 10px',fontSize:12}} onClick={()=>openProfile(c)}>View</button>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>

              <div className="s-foot">
                <span className="s-fi">
                  {total === 0 ? 'No entries' : `Showing ${(page-1)*ITEMS_PER_PAGE+1} to ${Math.min(page*ITEMS_PER_PAGE,total)} of ${total.toLocaleString()} entries`}
                </span>
                <div className="pgn">{renderPages()}</div>
              </div>
            </div>
          </div>

          <div className="s-pf">© 2024 University Student Management System • Version 1.0</div>
        </div>
      </div>
    </>
  );
};

export default Courses;