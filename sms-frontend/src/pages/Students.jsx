// src/pages/Students.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchStudents, createStudent, updateStudent, deleteStudent, fetchIntakes, fetchCourses, fetchStudentCourses, assignCourseToStudent, removeCourseFromStudent } from '../services/api';

const initials = (first, last) => `${(first||'')[0]||''}${(last||'')[0]||''}`.toUpperCase();
const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22','#2ecc71'];
const avatarColor = (str) => { let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };
const formatDate = (iso) => { if(!iso) return '—'; return new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); };
const getStatusClass = (s) => { if(!s) return 's-active'; const v=s.toLowerCase(); if(v==='active') return 's-active'; if(v==='graduated') return 's-graduated'; if(v==='suspended') return 's-suspended'; return 's-inactive'; };

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
  .s-topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 28px; height:52px; position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; }
  .s-bc { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text2); }
  .s-bc a { color:var(--text2); text-decoration:none; }
  .s-bc a:hover { color:var(--accent); }
  .s-bc strong { color:var(--text); font-weight:600; }
  .s-out-btn { height:32px; padding:0 12px; border-radius:7px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:12.5px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s; }
  .s-out-btn:hover { border-color:var(--accent); color:var(--accent); }
  .s-search-row { padding:12px 28px; background:var(--white); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .s-sw { flex:1; position:relative; }
  .s-si { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; display:flex; }
  .s-input { width:100%; height:38px; border:1.5px solid var(--border); border-radius:8px; padding:0 14px 0 36px; font-family:var(--fb); font-size:13.5px; color:var(--text); background:#fafafa; outline:none; transition:border-color .2s,box-shadow .2s; }
  .s-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }
  .s-input::placeholder { color:var(--text3); }
  .s-icon-btn { display:flex; align-items:center; gap:6px; height:38px; padding:0 14px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; white-space:nowrap; transition:border-color .15s,color .15s; }
  .s-icon-btn:hover { border-color:var(--accent); color:var(--accent); }
  .s-icon-btn.active { border-color:var(--accent); color:var(--accent); background:var(--accent-soft); }

  /* Filter bar */
  .filter-bar { padding:10px 28px; background:#fafafa; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; animation:fadeUp .2s ease; }
  .filter-label { font-size:12.5px; font-weight:600; color:var(--text2); white-space:nowrap; }
  .fse-sm { height:34px; border:1.5px solid var(--border); border-radius:8px; padding:0 28px 0 10px; font-family:var(--fb); font-size:13px; color:var(--text); background:#fff; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; transition:border-color .15s; }
  .fse-sm:focus { border-color:var(--accent); outline:none; }
  .filter-clear { height:34px; padding:0 12px; border-radius:8px; border:none; background:#fee2e2; color:#dc2626; font-family:var(--fb); font-size:12.5px; font-weight:600; cursor:pointer; }
  .filter-clear:hover { background:#fecaca; }

  .sc-wrap { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }
  .s-head { display:flex; align-items:flex-start; justify-content:space-between; }
  .s-title { font-family:var(--fh); font-size:22px; font-weight:700; color:var(--text); }
  .s-sub { font-size:13px; color:var(--text2); margin-top:3px; }
  .s-add-btn { display:flex; align-items:center; gap:7px; height:40px; padding:0 18px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(232,64,58,0.30); transition:background .18s,transform .12s; white-space:nowrap; }
  .s-add-btn:hover { background:#d43530; transform:translateY(-1px); }
  .s-card { background:var(--white); border-radius:var(--r); border:1px solid var(--border); overflow:hidden; animation:fadeUp .35s ease both; }
  .s-card-top { padding:12px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-show { font-size:13px; color:var(--text2); font-weight:500; }
  .s-show strong { color:var(--text); }
  .s-sort { font-size:12px; color:var(--text3); display:flex; align-items:center; gap:5px; }
  table.st { width:100%; border-collapse:collapse; }
  table.st thead tr { background:#fafafa; }
  table.st th { text-align:left; padding:11px 16px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text3); border-bottom:1px solid var(--border); }
  table.st td { padding:13px 16px; font-size:13.5px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  table.st tr:last-child td { border-bottom:none; }
  table.st tbody tr { cursor:pointer; transition:background .12s; }
  table.st tbody tr:hover td { background:#fafbff; }
  .st-id { color:var(--accent); font-weight:700; font-size:13px; font-family:var(--fh); }
  .st-nc { display:flex; align-items:center; gap:10px; }
  .st-av { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; }
  .st-n { font-weight:600; font-size:13.5px; }
  .st-e { font-size:11.5px; color:var(--text3); margin-top:1px; }
  .st-d { font-weight:600; font-size:13px; }
  .st-dp { font-size:11px; color:var(--text3); text-transform:uppercase; letter-spacing:.04em; margin-top:1px; }
  .sbadge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11.5px; font-weight:700; }
  .sdot { width:6px; height:6px; border-radius:50%; }
  .s-active    { background:#dcfce7; color:#166534; } .s-active .sdot    { background:#22c55e; }
  .s-graduated { background:#dbeafe; color:#1e40af; } .s-graduated .sdot { background:#3b82f6; }
  .s-suspended { background:#fef3c7; color:#92400e; } .s-suspended .sdot { background:#f59e0b; }
  .s-inactive  { background:#f3f4f6; color:#6b7280; } .s-inactive .sdot  { background:#9ca3af; }
  .s-foot { padding:12px 20px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-fi { font-size:12.5px; color:var(--text3); }
  .pgn { display:flex; align-items:center; gap:4px; }
  .pg-btn { min-width:30px; height:30px; padding:0 6px; border-radius:7px; border:1.5px solid var(--border); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:600; color:var(--text2); transition:border-color .15s,color .15s,background .15s; }
  .pg-btn:hover:not(:disabled):not(.pga) { border-color:var(--accent); color:var(--accent); }
  .pg-btn:disabled { opacity:.35; cursor:not-allowed; }
  .pga { background:var(--accent); border-color:var(--accent); color:#fff; }
  .pg-el { font-size:13px; color:var(--text3); padding:0 4px; }
  .s-pf { padding:14px 28px; text-align:center; font-size:11.5px; color:var(--text3); letter-spacing:.04em; }
  .sh-bar { height:14px; border-radius:6px; background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  @keyframes shimmer { to { background-position:-200% 0; } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  .ov { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:200; opacity:0; pointer-events:none; transition:opacity .25s; }
  .ov.open { opacity:1; pointer-events:all; }
  .sp { position:fixed; top:0; right:0; bottom:0; width:480px; background:#fff; box-shadow:-8px 0 32px rgba(0,0,0,0.12); z-index:201; display:flex; flex-direction:column; transform:translateX(100%); transition:transform .3s cubic-bezier(.22,.68,0,1.1); }
  .sp.open { transform:translateX(0); }
  .ph { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .ph-t { font-family:var(--fh); font-size:16px; font-weight:700; color:var(--text); }
  .ph-s { font-size:12.5px; color:var(--text2); margin-top:2px; }
  .ph-x { width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); font-size:18px; transition:border-color .15s,color .15s; }
  .ph-x:hover { border-color:var(--accent); color:var(--accent); }
  .pb { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:20px; }
  .fs { display:flex; flex-direction:column; gap:14px; }
  .fst { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); }
  .fr { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fg { display:flex; flex-direction:column; gap:5px; }
  .fg.full { grid-column:1/-1; }
  .fl { font-size:12.5px; font-weight:600; color:var(--text); }
  .fi, .fse { height:40px; border:1.5px solid var(--border); border-radius:8px; padding:0 12px; font-family:var(--fb); font-size:13.5px; color:var(--text); background:#fafafa; outline:none; width:100%; transition:border-color .2s,box-shadow .2s; }
  .fi:focus, .fse:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }
  .fi::placeholder { color:var(--text3); }
  .fse { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; background-size:12px; padding-right:32px; background-color:#fafafa; }
  .fe { font-size:11.5px; color:var(--accent); margin-top:2px; }
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
  .gerr { background:#fff0f0; border:1px solid #fca5a5; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; }
  .p-hero { background:linear-gradient(135deg,#1a1d27 0%,#2d3148 100%); border-radius:10px; padding:20px; display:flex; align-items:center; gap:16px; }
  .p-av { width:56px; height:56px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; color:#fff; border:3px solid rgba(255,255,255,0.15); }
  .p-name { font-family:var(--fh); font-size:16px; font-weight:700; color:#fff; }
  .p-id { font-size:12px; color:rgba(255,255,255,0.5); margin-top:3px; font-family:var(--fh); }
  .sec-blk { display:flex; flex-direction:column; gap:10px; }
  .sec-t { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .dg { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .di { display:flex; flex-direction:column; gap:3px; }
  .dl2 { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text3); }
  .dv { font-size:13.5px; font-weight:600; color:var(--text); }
  .i-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; background:#f3f4f6; font-size:13px; font-weight:600; color:var(--text); }
  .empty { text-align:center; padding:20px; color:var(--text3); font-size:13px; }
  .info-n { display:flex; align-items:flex-start; gap:8px; padding:10px 14px; border-radius:8px; background:#eff6ff; border:1px solid #bfdbfe; font-size:12.5px; color:#1e40af; line-height:1.5; }
`;

const Ic = {
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  export: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  plus:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  az:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  info:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

const ITEMS_PER_PAGE = 10;
const EMPTY_FORM = { first_name:'', last_name:'', address:'', birthday:'', national_id:'', degree_program:'', intake_id:'' };

const Students = () => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');

  const [students,       setStudents]       = useState([]);
  const [intakes,        setIntakes]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState('');
  const [filterIntake,   setFilterIntake]   = useState('');
  const [showFilters,    setShowFilters]    = useState(false);
  const searchTimer = useRef(null);

  const [panel,          setPanel]          = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formErr,        setFormErr]        = useState({});
  const [saving,         setSaving]         = useState(false);
  const [gErr,           setGErr]           = useState('');

  const [studentCourses, setStudentCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assigning,      setAssigning]      = useState(false);
  const [courses,        setCourses]        = useState([]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const load = async (p = 1, q = '', intakeId = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit: ITEMS_PER_PAGE };
      if (q) params.search = q;
      if (intakeId) params.intake_id = intakeId;
      const res = await fetchStudents(params);
      setStudents(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, '', ''); }, []);
  useEffect(() => { fetchIntakes().then(r => setIntakes(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { fetchCourses().then(r => setCourses(r.data || [])).catch(() => {}); }, []);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v, filterIntake); }, 400);
  };

  const handleFilterIntake = (v) => {
    setFilterIntake(v);
    setPage(1);
    load(1, search, v);
  };

  const clearFilters = () => {
    setFilterIntake('');
    setSearch('');
    setPage(1);
    load(1, '', '');
  };

  const handleExport = () => {
    const headers = ['Student ID','First Name','Last Name','National ID','Degree Program','Intake','Status','Date Enrolled'];
    const rows = students.map(s => [
      s.student_number || s.id,
      s.first_name,
      s.last_name,
      s.national_id,
      s.degree_program,
      intakes.find(i => String(i.id) === String(s.intake_id))?.name || '—',
      s.status || 'Active',
      formatDate(s.created_at)
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `students_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleAssignCourse = async () => {
    if (!assignCourseId) return;
    setAssigning(true);
    try {
      await assignCourseToStudent(selected.id, assignCourseId);
      setAssignCourseId('');
      const r = await fetchStudentCourses(selected.id);
      setStudentCourses(r.data || []);
    } catch (err) { alert(err.message || 'Failed to assign.'); }
    finally { setAssigning(false); }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!window.confirm('Remove this course from the student?')) return;
    try {
      await removeCourseFromStudent(selected.id, courseId);
      const r = await fetchStudentCourses(selected.id);
      setStudentCourses(r.data || []);
    } catch (err) { alert(err.message || 'Failed to remove.'); }
  };

  const goPage = (p) => { setPage(p); load(p, search, filterIntake); window.scrollTo(0,0); };

  const openAdd     = () => { setForm(EMPTY_FORM); setFormErr({}); setGErr(''); setPanel('add'); };
  const openProfile = (s) => {
    setSelected(s); setAssignCourseId(''); setStudentCourses([]);
    setPanel('profile');
    setLoadingCourses(true);
    fetchStudentCourses(s.id)
      .then(r => setStudentCourses(r.data || []))
      .catch(() => setStudentCourses([]))
      .finally(() => setLoadingCourses(false));
  };
  const openEdit = () => {
    setForm({
      first_name: selected.first_name||'', last_name: selected.last_name||'',
      address: selected.address||'', birthday: selected.birthday ? selected.birthday.split('T')[0] : '',
      national_id: selected.national_id||'', degree_program: selected.degree_program||'',
      intake_id: selected.intake_id||'',
    });
    setFormErr({}); setGErr(''); setPanel('edit');
  };
  const closePanel = () => { setPanel(null); setSelected(null); setGErr(''); };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim())     e.first_name     = 'Required';
    if (!form.last_name.trim())      e.last_name      = 'Required';
    if (!form.address.trim())        e.address        = 'Required';
    if (!form.birthday)              e.birthday       = 'Required';
    if (!form.national_id.trim())    e.national_id    = 'Required';
    if (!form.degree_program.trim()) e.degree_program = 'Required';
    if (!form.intake_id)             e.intake_id      = 'Required';
    setFormErr(e); return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setGErr('');
    try {
      if (panel === 'add') await createStudent(form);
      else await updateStudent(selected.id, form);
      closePanel(); load(page, search, filterIntake);
    } catch (err) { setGErr(err.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selected.first_name} ${selected.last_name}? This cannot be undone.`)) return;
    try { await deleteStudent(selected.id); closePanel(); load(page, search, filterIntake); }
    catch (err) { alert(err.message || 'Failed to delete.'); }
  };

  const renderPages = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const addPage = (n) => <button key={n} className={`pg-btn${page===n?' pga':''}`} onClick={() => goPage(n)}>{n}</button>;
    pages.push(<button key="prev" className="pg-btn" onClick={() => goPage(page-1)} disabled={page===1}>{Ic.chevL}</button>);
    if (totalPages <= 7) { for(let i=1;i<=totalPages;i++) pages.push(addPage(i)); }
    else {
      pages.push(addPage(1));
      if (page > 3) pages.push(<span key="e1" className="pg-el">…</span>);
      for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++) pages.push(addPage(i));
      if (page < totalPages-2) pages.push(<span key="e2" className="pg-el">…</span>);
      pages.push(addPage(totalPages));
    }
    pages.push(<button key="next" className="pg-btn" onClick={() => goPage(page+1)} disabled={page===totalPages}>{Ic.chevR}</button>);
    return pages;
  };

  const isOpen = panel !== null;
  const profileColor = selected ? avatarColor(`${selected.first_name}${selected.last_name}`) : '';
  const profileIntake = selected ? intakes.find(i => String(i.id) === String(selected.intake_id))?.name || '—' : '—';
  const profileStatusCls = selected ? getStatusClass(selected.status) : '';
  const hasFilters = !!filterIntake;

  return (
    <>
      <style>{styles}</style>
      <div className={`ov${isOpen?' open':''}`} onClick={closePanel}/>

      <div className={`sp${isOpen?' open':''}`}>
        {(panel==='add' || panel==='edit') && <>
          <div className="ph">
            <div>
              <div className="ph-t">{panel==='add' ? 'Add New Student' : 'Edit Student'}</div>
              <div className="ph-s">{panel==='add' ? 'Fill in the registration details below' : `Editing ${selected?.first_name} ${selected?.last_name}`}</div>
            </div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Personal Information</div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">First Name</label>
                  <input className="fi" placeholder="e.g. John" value={form.first_name} onChange={e => setForm(f=>({...f,first_name:e.target.value}))}/>
                  {formErr.first_name && <span className="fe">{formErr.first_name}</span>}
                </div>
                <div className="fg">
                  <label className="fl">Last Name</label>
                  <input className="fi" placeholder="e.g. Doe" value={form.last_name} onChange={e => setForm(f=>({...f,last_name:e.target.value}))}/>
                  {formErr.last_name && <span className="fe">{formErr.last_name}</span>}
                </div>
              </div>
              <div className="fg full">
                <label className="fl">Address</label>
                <input className="fi" placeholder="e.g. 123 Main St, Colombo" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))}/>
                {formErr.address && <span className="fe">{formErr.address}</span>}
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Date of Birth</label>
                  <input className="fi" type="date" value={form.birthday} onChange={e => setForm(f=>({...f,birthday:e.target.value}))}/>
                  {formErr.birthday && <span className="fe">{formErr.birthday}</span>}
                </div>
                <div className="fg">
                  <label className="fl">National ID</label>
                  <input className="fi" placeholder="e.g. 123456789V" value={form.national_id} onChange={e => setForm(f=>({...f,national_id:e.target.value}))}/>
                  {formErr.national_id && <span className="fe">{formErr.national_id}</span>}
                </div>
              </div>
            </div>
            <div className="fs">
              <div className="fst">Academic Details</div>
              <div className="fg full">
                <label className="fl">Degree Program</label>
                <input className="fi" placeholder="e.g. B.Sc Computer Science" value={form.degree_program} onChange={e => setForm(f=>({...f,degree_program:e.target.value}))}/>
                {formErr.degree_program && <span className="fe">{formErr.degree_program}</span>}
              </div>
              <div className="fg full">
                <label className="fl">Intake</label>
                <select className="fse" value={form.intake_id} onChange={e => setForm(f=>({...f,intake_id:e.target.value}))}>
                  <option value="">Select intake period</option>
                  {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                {formErr.intake_id && <span className="fe">{formErr.intake_id}</span>}
              </div>
            </div>
            <div className="info-n">{Ic.info}<span>The student ID will be generated automatically upon registration.</span></div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : Ic.save}
              {saving ? 'Saving…' : panel==='add' ? 'Save Student' : 'Update Student'}
            </button>
          </div>
        </>}

        {panel==='profile' && selected && <>
          <div className="ph">
            <div><div className="ph-t">Student Profile</div><div className="ph-s">Full record for {selected.first_name} {selected.last_name}</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            <div className="p-hero">
              <div className="p-av" style={{background:profileColor}}>{initials(selected.first_name,selected.last_name)}</div>
              <div>
                <div className="p-name">{selected.first_name} {selected.last_name}</div>
                <div className="p-id">{selected.student_number || `ID: ${selected.id}`}</div>
                <div style={{marginTop:6}}><span className={`sbadge ${profileStatusCls}`}><span className="sdot"/>{selected.status||'Active'}</span></div>
              </div>
            </div>
            <div className="sec-blk">
              <div className="sec-t">Personal Details</div>
              <div className="dg">
                <div className="di"><span className="dl2">National ID</span><span className="dv">{selected.national_id||'—'}</span></div>
                <div className="di"><span className="dl2">Date of Birth</span><span className="dv">{formatDate(selected.birthday)}</span></div>
                <div className="di" style={{gridColumn:'1/-1'}}><span className="dl2">Address</span><span className="dv">{selected.address||'—'}</span></div>
                <div className="di"><span className="dl2">Degree Program</span><span className="dv">{selected.degree_program||'—'}</span></div>
                <div className="di"><span className="dl2">Date Enrolled</span><span className="dv">{formatDate(selected.created_at)}</span></div>
              </div>
            </div>
            <div className="sec-blk">
              <div className="sec-t">Assigned Intake</div>
              {profileIntake !== '—' ? <div className="i-chip">🎓 {profileIntake}</div> : <div className="empty">No intake assigned</div>}
            </div>
            <div className="sec-blk">
              <div className="sec-t">Current Courses</div>
              {loadingCourses
                ? <div className="empty">Loading…</div>
                : studentCourses.filter(c => !c.removed_at).length === 0
                ? <div className="empty">No courses currently assigned.</div>
                : studentCourses.filter(c => !c.removed_at).map(c => (
                    <div key={c.course_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:8,background:'#fafafa',border:'1px solid var(--border)'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{c.course_name}</div>
                        <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>{c.course_code}{c.semester?` · Sem ${c.semester}`:''}{c.year?` · ${c.year}`:''} · <span style={{textTransform:'capitalize'}}>{c.status}</span></div>
                      </div>
                      <button onClick={() => handleRemoveCourse(c.course_id)} style={{height:26,padding:'0 10px',borderRadius:6,background:'#fee2e2',color:'#dc2626',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>Remove</button>
                    </div>
                  ))
              }
              {courses.filter(c => !studentCourses.find(sc => String(sc.course_id)===String(c.id) && !sc.removed_at)).length > 0 && (
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <select className="fse" value={assignCourseId} onChange={e => setAssignCourseId(e.target.value)} style={{flex:1}}>
                    <option value="">Assign a course…</option>
                    {courses.filter(c => !studentCourses.find(sc => String(sc.course_id)===String(c.id) && !sc.removed_at)).map(c => <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>)}
                  </select>
                  <button onClick={handleAssignCourse} disabled={!assignCourseId||assigning} style={{height:38,padding:'0 14px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',fontFamily:'var(--fb)',fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',opacity:(!assignCourseId||assigning)?0.6:1}}>
                    {assigning ? '…' : '+ Assign'}
                  </button>
                </div>
              )}
            </div>
            {studentCourses.filter(c => c.removed_at).length > 0 && (
              <div className="sec-blk">
                <div className="sec-t">Course History</div>
                {studentCourses.filter(c => c.removed_at).map(c => (
                  <div key={`h-${c.course_id}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:8,background:'#fafafa',border:'1px solid var(--border)',opacity:0.7}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{c.course_name}</div>
                      <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>{c.course_code} · Removed {formatDate(c.removed_at)}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:20,background:'#f3f4f6',color:'var(--text3)'}}>Removed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pft">
            <button className="btn-del" onClick={handleDelete}>{Ic.trash} Delete</button>
            <button className="btn-cancel" onClick={closePanel}>Close</button>
            <button className="btn-save" onClick={openEdit}>{Ic.edit} Edit Student</button>
          </div>
        </>}
      </div>

      <div className="sl">
        <Sidebar/>
        <div className="sm">
          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>Students Directory</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('admin'); navigate('/login',{replace:true}); }}>Sign Out</button>
            </div>
          </header>

          <div className="s-search-row">
            <div className="s-sw">
              <span className="s-si">{Ic.search}</span>
              <input className="s-input" placeholder="Search by name, student ID, or course…" value={search} onChange={e => handleSearch(e.target.value)}/>
            </div>
            <button className={`s-icon-btn${showFilters?' active':''}`} onClick={() => setShowFilters(v => !v)}>
              {Ic.filter} Filters {hasFilters && <span style={{background:'var(--accent)',color:'#fff',borderRadius:20,padding:'1px 6px',fontSize:11,fontWeight:700}}>1</span>}
            </button>
            <button className="s-icon-btn" onClick={handleExport}>{Ic.export} Export</button>
          </div>

          {showFilters && (
            <div className="filter-bar">
              <span className="filter-label">Filter by:</span>
              <select className="fse-sm" value={filterIntake} onChange={e => handleFilterIntake(e.target.value)}>
                <option value="">All Intakes</option>
                {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              {hasFilters && <button className="filter-clear" onClick={clearFilters}>Clear Filters</button>}
            </div>
          )}

          <div className="sc-wrap">
            <div className="s-head">
              <div>
                <div className="s-title">Students Directory</div>
                <div className="s-sub">Manage all university student records from a central location.</div>
              </div>
              <button className="s-add-btn" onClick={openAdd}>{Ic.plus} Add Student</button>
            </div>

            <div className="s-card">
              <div className="s-card-top">
                <span className="s-show">
                  SHOW <strong>{ITEMS_PER_PAGE} rows</strong>
                  {hasFilters && <span style={{marginLeft:8,fontSize:12,color:'var(--accent)',fontWeight:600}}>· Filtered by {intakes.find(i=>String(i.id)===String(filterIntake))?.name}</span>}
                </span>
                <span className="s-sort">Sorted by Date Added (Newest) {Ic.az}</span>
              </div>
              <table className="st">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Course / Department</th>
                    <th>Intake</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:5}).map((_,i) => (
                        <tr key={i}>
                          {[90,160,180,80,60,40].map((w,j) => <td key={j}><div className="sh-bar" style={{width:w}}/></td>)}
                        </tr>
                      ))
                    : students.length === 0
                    ? <tr><td colSpan={6} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No students found.</td></tr>
                    : students.map(s => {
                        const color      = avatarColor(`${s.first_name}${s.last_name}`);
                        const intakeName = intakes.find(i => String(i.id)===String(s.intake_id))?.name || '—';
                        const sc         = getStatusClass(s.status);
                        return (
                          <tr key={s.id} onClick={() => openProfile(s)}>
                            <td><span className="st-id">{s.student_number||`#${s.id}`}</span></td>
                            <td>
                              <div className="st-nc">
                                <div className="st-av" style={{background:color}}>{initials(s.first_name,s.last_name)}</div>
                                <div><div className="st-n">{s.first_name} {s.last_name}</div><div className="st-e">{s.national_id}</div></div>
                              </div>
                            </td>
                            <td><div className="st-d">{s.degree_program}</div><div className="st-dp">Student</div></td>
                            <td style={{fontSize:13.5,color:'var(--text2)'}}>{intakeName}</td>
                            <td><span className={`sbadge ${sc}`}><span className="sdot"/>{s.status||'Active'}</span></td>
                            <td onClick={e => e.stopPropagation()}>
                              <button className="s-icon-btn" style={{height:30,padding:'0 10px',fontSize:12}} onClick={() => openProfile(s)}>View</button>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
              <div className="s-foot">
                <span className="s-fi">{total===0 ? 'No entries' : `Showing ${(page-1)*ITEMS_PER_PAGE+1} to ${Math.min(page*ITEMS_PER_PAGE,total)} of ${total.toLocaleString()} entries`}</span>
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

export default Students;