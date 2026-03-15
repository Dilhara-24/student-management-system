import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin } from '../services/api';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};
const formatRelative = (iso) => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} min${mins!==1?'s':''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hour${hrs!==1?'s':''} ago`;
  return formatDate(iso);
};
const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22'];
const avatarColor = (str) => { let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };
const ROLE_COLORS = {
  'Super Admin':   { bg:'#fef3c7', color:'#92400e' },
  'Admin':         { bg:'#dbeafe', color:'#1e40af' },
  'Registrar':     { bg:'#dcfce7', color:'#166534' },
  'Faculty Admin': { bg:'#fce7f3', color:'#9d174d' },
  'IT Support':    { bg:'#ede9fe', color:'#5b21b6' },
  'Admissions':    { bg:'#e0f2fe', color:'#075985' },
};
const roleStyle = (role) => ROLE_COLORS[role] || { bg:'#f3f4f6', color:'#374151' };
const ROLES = ['Super Admin','Admin','Registrar','Faculty Admin','IT Support','Admissions'];

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
  .s-topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 28px; height:52px; position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; }
  .s-bc { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text2); }
  .s-bc a { color:var(--text2); text-decoration:none; }
  .s-bc a:hover { color:var(--accent); }
  .s-bc strong { color:var(--text); font-weight:600; }
  .s-out-btn { height:32px; padding:0 12px; border-radius:7px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:12.5px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s; }
  .s-out-btn:hover { border-color:var(--accent); color:var(--accent); }
  .sc-wrap { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }
  .s-head { display:flex; align-items:flex-start; justify-content:space-between; }
  .s-title { font-family:var(--fh); font-size:22px; font-weight:700; color:var(--text); }
  .s-sub { font-size:13px; color:var(--text2); margin-top:3px; }
  .s-add-btn { display:flex; align-items:center; gap:7px; height:40px; padding:0 18px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(232,64,58,0.30); transition:background .18s,transform .12s; }
  .s-add-btn:hover { background:#d43530; transform:translateY(-1px); }
  .s-card { background:var(--white); border-radius:var(--r); border:1px solid var(--border); overflow:hidden; animation:fadeUp .35s ease both; }
  .s-card-top { padding:12px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .search-wrap { position:relative; flex:1; }
  .search-wrap svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); pointer-events:none; }
  .s-search { width:100%; height:36px; border:1.5px solid var(--border); border-radius:8px; padding:0 12px 0 34px; font-family:var(--fb); font-size:13px; color:var(--text); background:#fafafa; outline:none; transition:border-color .2s; }
  .s-search:focus { border-color:var(--accent); background:#fff; }
  .s-search::placeholder { color:var(--text3); }
  .s-fsel { height:36px; border:1.5px solid var(--border); border-radius:8px; padding:0 28px 0 10px; font-family:var(--fb); font-size:12.5px; color:var(--text2); background:#fafafa; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
  .s-fsel:focus { border-color:var(--accent); }
  table.st { width:100%; border-collapse:collapse; }
  table.st thead tr { background:#fafafa; }
  table.st th { text-align:left; padding:11px 16px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text3); border-bottom:1px solid var(--border); }
  table.st td { padding:12px 16px; font-size:13.5px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  table.st tr:last-child td { border-bottom:none; }
  table.st tbody tr { cursor:pointer; transition:background .12s; }
  table.st tbody tr:hover td { background:#fafbff; }
  .a-av { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:12px; font-weight:700; color:#fff; }
  .a-name { font-weight:600; font-size:13.5px; }
  .a-user { font-size:11.5px; color:var(--text3); margin-top:1px; }
  .role-badge { display:inline-flex; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:700; }
  .tbl-btn { height:28px; width:28px; border-radius:6px; border:1.5px solid var(--border); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); transition:border-color .15s,color .15s; }
  .tbl-btn:hover { border-color:var(--accent); color:var(--accent); }
  .s-foot { padding:12px 20px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .s-fi { font-size:12.5px; color:var(--text3); }
  .pgn { display:flex; align-items:center; gap:4px; }
  .pg-btn { min-width:30px; height:30px; padding:0 6px; border-radius:7px; border:1.5px solid var(--border); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:600; color:var(--text2); transition:border-color .15s,color .15s; }
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
  .ph-x { width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); transition:border-color .15s,color .15s; }
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
  .btn-cancel { height:38px; padding:0 18px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:13.5px; font-weight:600; color:var(--text2); cursor:pointer; }
  .btn-save { height:38px; padding:0 22px; border-radius:8px; background:var(--accent); color:#fff; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; }
  .btn-save:hover:not(:disabled) { background:#d43530; }
  .btn-save:disabled { opacity:.6; cursor:not-allowed; }
  .btn-del { height:38px; padding:0 18px; border-radius:8px; background:#fee2e2; color:#dc2626; border:none; font-family:var(--fb); font-size:13.5px; font-weight:700; cursor:pointer; margin-right:auto; display:flex; align-items:center; gap:6px; }
  .btn-del:hover { background:#fecaca; }
  .spin { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .gerr { background:#fff0f0; border:1px solid #fca5a5; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; }
  .p-hero { background:linear-gradient(135deg,#1a1d27 0%,#2d3148 100%); border-radius:10px; padding:20px; display:flex; align-items:center; gap:16px; }
  .p-av { width:56px; height:56px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:18px; font-weight:700; color:#fff; border:3px solid rgba(255,255,255,0.15); }
  .p-name { font-family:var(--fh); font-size:17px; font-weight:700; color:#fff; }
  .p-sub { font-size:12px; color:rgba(255,255,255,0.5); margin-top:3px; }
  .sec-blk { display:flex; flex-direction:column; gap:10px; }
  .sec-t { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding-bottom:8px; border-bottom:1px solid var(--border); }
  .dg { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .di { display:flex; flex-direction:column; gap:3px; }
  .dl2 { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text3); }
  .dv { font-size:13.5px; font-weight:600; color:var(--text); }
  .pw-hint { font-size:11.5px; color:var(--text3); margin-top:3px; }
`;

const Ic = {
  plus:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  user:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const ITEMS_PER_PAGE = 10;
const EMPTY_FORM = { username:'', password:'', full_name:'', email:'', role:'Admin' };

export default function Admins() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');

  const [admins,   setAdmins]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleF,    setRoleF]    = useState('all');
  const [page,     setPage]     = useState(1);

  const [panel,    setPanel]    = useState(null); // 'add' | 'edit' | 'profile'
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState({});
  const [saving,   setSaving]   = useState(false);
  const [gErr,     setGErr]     = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await fetchAdmins(); setAdmins(r.data || []); }
    catch { setAdmins([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (a.full_name||'').toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q);
    const matchRole = roleF === 'all' || a.role === roleF;
    return matchSearch && matchRole;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const openAdd     = () => { setForm(EMPTY_FORM); setFormErr({}); setGErr(''); setPanel('add'); };
  const openProfile = (a) => { setSelected(a); setPanel('profile'); };
  const openEdit    = () => {
    setForm({ username: selected.username, password:'', full_name: selected.full_name||'', email: selected.email||'', role: selected.role||'Admin' });
    setFormErr({}); setGErr(''); setPanel('edit');
  };
  const closePanel  = () => { setPanel(null); setSelected(null); setGErr(''); };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Required';
    if (panel === 'add' && !form.password) e.password = 'Required';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setGErr('');
    try {
      if (panel === 'add') {
        await createAdmin(form);
      } else {
        const payload = { username: form.username, full_name: form.full_name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await updateAdmin(selected.id, payload);
      }
      closePanel(); load();
    } catch (err) { setGErr(err.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete admin "${selected.username}"? This cannot be undone.`)) return;
    try { await deleteAdmin(selected.id); closePanel(); load(); }
    catch (err) { alert(err.message || 'Failed to delete.'); }
  };

  const renderPages = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const addBtn = (n) => <button key={n} className={`pg-btn${page===n?' pga':''}`} onClick={() => setPage(n)}>{n}</button>;
    pages.push(<button key="prev" className="pg-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>{Ic.chevL}</button>);
    if (totalPages <= 7) { for(let i=1;i<=totalPages;i++) pages.push(addBtn(i)); }
    else {
      pages.push(addBtn(1));
      if (page > 3) pages.push(<span key="e1" className="pg-el">…</span>);
      for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++) pages.push(addBtn(i));
      if (page < totalPages-2) pages.push(<span key="e2" className="pg-el">…</span>);
      pages.push(addBtn(totalPages));
    }
    pages.push(<button key="next" className="pg-btn" onClick={() => setPage(p=>p+1)} disabled={page===totalPages}>{Ic.chevR}</button>);
    return pages;
  };

  const isOpen = panel !== null;
  const currentAdminId = JSON.parse(localStorage.getItem('admin') || '{}').id;

  return (
    <>
      <style>{styles}</style>
      <div className={`ov${isOpen?' open':''}`} onClick={closePanel}/>

      <div className={`sp${isOpen?' open':''}`}>

        {/* ADD */}
        {panel === 'add' && <>
          <div className="ph">
            <div><div className="ph-t">Add New Admin</div><div className="ph-s">Create a new system administrator account</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Account Details</div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input className="fi" placeholder="Dr. Jane Smith" value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))}/>
                </div>
                <div className="fg">
                  <label className="fl">Role</label>
                  <select className="fse" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg full">
                <label className="fl">Email</label>
                <input className="fi" type="email" placeholder="admin@university.edu" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/>
              </div>
              <div className="fst" style={{marginTop:4}}>Login Credentials</div>
              <div className="fg full">
                <label className="fl">Username</label>
                <input className="fi" placeholder="e.g. jsmith" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}/>
                {formErr.username && <span className="fe">{formErr.username}</span>}
              </div>
              <div className="fg full">
                <label className="fl">Password</label>
                <input className="fi" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}/>
                {formErr.password && <span className="fe">{formErr.password}</span>}
              </div>
            </div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : Ic.save}
              {saving ? 'Saving…' : 'Create Admin'}
            </button>
          </div>
        </>}

        {/* EDIT */}
        {panel === 'edit' && <>
          <div className="ph">
            <div><div className="ph-t">Edit Admin</div><div className="ph-s">Editing {selected?.username}</div></div>
            <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
          </div>
          <div className="pb">
            {gErr && <div className="gerr">{gErr}</div>}
            <div className="fs">
              <div className="fst">Account Details</div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input className="fi" placeholder="Dr. Jane Smith" value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))}/>
                </div>
                <div className="fg">
                  <label className="fl">Role</label>
                  <select className="fse" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg full">
                <label className="fl">Email</label>
                <input className="fi" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/>
              </div>
              <div className="fst" style={{marginTop:4}}>Login Credentials</div>
              <div className="fg full">
                <label className="fl">Username</label>
                <input className="fi" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}/>
                {formErr.username && <span className="fe">{formErr.username}</span>}
              </div>
              <div className="fg full">
                <label className="fl">New Password</label>
                <input className="fi" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}/>
                <span className="pw-hint">Leave blank to keep the current password.</span>
              </div>
            </div>
          </div>
          <div className="pft">
            <button className="btn-cancel" onClick={closePanel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : Ic.save}
              {saving ? 'Saving…' : 'Update Admin'}
            </button>
          </div>
        </>}

        {/* PROFILE */}
        {panel === 'profile' && selected && (() => {
          const rs = roleStyle(selected.role);
          const initials = selected.full_name
            ? selected.full_name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
            : selected.username.substring(0,2).toUpperCase();
          return <>
            <div className="ph">
              <div><div className="ph-t">Admin Profile</div><div className="ph-s">{selected.username}</div></div>
              <button className="ph-x" onClick={closePanel}>{Ic.close}</button>
            </div>
            <div className="pb">
              <div className="p-hero">
                <div className="p-av" style={{background: avatarColor(selected.username)}}>{initials}</div>
                <div>
                  <div className="p-name">{selected.full_name || selected.username}</div>
                  <div className="p-sub">@{selected.username}</div>
                  <div style={{marginTop:8}}>
                    <span className="role-badge" style={{background:rs.bg, color:rs.color}}>{selected.role || 'Admin'}</span>
                  </div>
                </div>
              </div>
              <div className="sec-blk">
                <div className="sec-t">Details</div>
                <div className="dg">
                  <div className="di"><span className="dl2">Full Name</span><span className="dv">{selected.full_name || '—'}</span></div>
                  <div className="di"><span className="dl2">Role</span><span className="dv">{selected.role || 'Admin'}</span></div>
                  <div className="di full" style={{gridColumn:'1/-1'}}><span className="dl2">Email</span><span className="dv">{selected.email || '—'}</span></div>
                  <div className="di"><span className="dl2">Username</span><span className="dv">@{selected.username}</span></div>
                  <div className="di"><span className="dl2">Last Active</span><span className="dv">{formatRelative(selected.last_active)}</span></div>
                  <div className="di"><span className="dl2">Member Since</span><span className="dv">{formatDate(selected.created_at)}</span></div>
                </div>
              </div>
            </div>
            <div className="pft">
              {selected.id !== currentAdminId && (
                <button className="btn-del" onClick={handleDelete}>{Ic.trash} Delete</button>
              )}
              <button className="btn-cancel" onClick={closePanel}>Close</button>
              <button className="btn-save" onClick={openEdit}>{Ic.edit} Edit</button>
            </div>
          </>;
        })()}
      </div>

      <div className="sl">
        <Sidebar/>
        <div className="sm">
          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>Admins</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('admin'); navigate('/login',{replace:true}); }}>Sign Out</button>
            </div>
          </header>

          <div className="sc-wrap">
            <div className="s-head">
              <div>
                <div className="s-title">Administrator Management</div>
                <div className="s-sub">Assign roles, monitor logins, and manage security permissions for all system users.</div>
              </div>
              <button className="s-add-btn" onClick={openAdd}>{Ic.user} Add New Admin</button>
            </div>

            <div className="s-card">
              <div className="s-card-top">
                <div className="search-wrap">
                  {Ic.search}
                  <input className="s-search" placeholder="Filter by name, email, or role…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
                </div>
                <select className="s-fsel" value={roleF} onChange={e => { setRoleF(e.target.value); setPage(1); }}>
                  <option value="all">Role: All</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <table className="st">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Role</th>
                    <th>Last Active</th>
                    <th>Member Since</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:5}).map((_,i) => (
                        <tr key={i}>
                          {[180,90,100,100,60].map((w,j) => <td key={j}><div className="sh-bar" style={{width:w}}/></td>)}
                        </tr>
                      ))
                    : paged.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No admins found.</td></tr>
                    : paged.map(a => {
                        const rs = roleStyle(a.role);
                        const initials = a.full_name
                          ? a.full_name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
                          : a.username.substring(0,2).toUpperCase();
                        return (
                          <tr key={a.id} onClick={() => openProfile(a)}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div className="a-av" style={{background:avatarColor(a.username)}}>{initials}</div>
                                <div>
                                  <div className="a-name">{a.full_name || a.username}</div>
                                  <div className="a-user">{a.email || `@${a.username}`}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="role-badge" style={{background:rs.bg,color:rs.color}}>{a.role||'Admin'}</span></td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatRelative(a.last_active)}</td>
                            <td style={{fontSize:13,color:'var(--text2)'}}>{formatDate(a.created_at)}</td>
                            <td onClick={e=>e.stopPropagation()}>
                              <div style={{display:'flex',gap:6}}>
                                <button className="tbl-btn" onClick={() => {
                                    setSelected(a);
                                    setForm({ username: a.username, password:'', full_name: a.full_name||'', email: a.email||'', role: a.role||'Admin' });
                                    setFormErr({}); setGErr(''); setPanel('edit');
                                  }} title="Edit">{Ic.edit}</button>
                                {a.id !== currentAdminId && (
                                  <button className="tbl-btn" onClick={() => {
                                    if(window.confirm(`Delete admin "${a.username}"?`)) {
                                      deleteAdmin(a.id).then(load).catch(err => alert(err.message));
                                    }
                                  }} title="Delete" style={{color:'#dc2626',borderColor:'#fca5a5'}}>{Ic.trash}</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>

              <div className="s-foot">
                <span className="s-fi">
                  {filtered.length === 0 ? 'No entries' : `Showing ${Math.min((page-1)*ITEMS_PER_PAGE+1,filtered.length)} to ${Math.min(page*ITEMS_PER_PAGE,filtered.length)} of ${filtered.length} administrators`}
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
}