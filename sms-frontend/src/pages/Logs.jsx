import { BASE_URL } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
};
const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD','#e67e22'];
const avatarColor = (str) => { let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };

const ACTION_STYLES = {
  CREATE:       { bg:'#dcfce7', color:'#166534', label:'SUCCESS' },
  UPDATE:       { bg:'#dbeafe', color:'#1e40af', label:'INFO' },
  DELETE:       { bg:'#fee2e2', color:'#dc2626', label:'CRITICAL' },
  ASSIGN:       { bg:'#fef3c7', color:'#92400e', label:'ASSIGN' },
  REMOVE:       { bg:'#fce7f3', color:'#9d174d', label:'REMOVE' },
};
const actionStyle = (type) => ACTION_STYLES[type] || { bg:'#f3f4f6', color:'#374151', label: type };

const ACTION_TYPES = ['CREATE','UPDATE','DELETE','ASSIGN','REMOVE'];

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
  .s-sub { font-size:13px; color:var(--text2); margin-top:3px; max-width:520px; line-height:1.5; }
  .s-icon-btn { display:flex; align-items:center; gap:6px; height:40px; padding:0 16px; border-radius:8px; border:1.5px solid var(--border); background:#fff; font-family:var(--fb); font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s; }
  .s-icon-btn:hover { border-color:var(--accent); color:var(--accent); }
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
  table.st td { padding:13px 16px; font-size:13px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  table.st tr:last-child td { border-bottom:none; }
  table.st tbody tr { transition:background .12s; }
  table.st tbody tr:hover td { background:#fafbff; }
  .a-av { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:11px; font-weight:700; color:#fff; }
  .a-name { font-weight:600; font-size:13px; }
  .action-badge { display:inline-flex; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:.04em; }
  .entity-chip { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; background:#f3f4f6; color:var(--text2); margin-right:6px; text-transform:uppercase; }
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
  .ts { font-family:'Sora',monospace; font-size:12px; color:var(--text3); white-space:nowrap; }
`;

const Ic = {
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  export: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  refresh:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

const ITEMS_PER_PAGE = 20;

export default function Logs() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');

  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [actionF,  setActionF]  = useState('all');
  const token = localStorage.getItem('token');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/logs?page=${p}&limit=${ITEMS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.admin_name||'').toLowerCase().includes(q) ||
      (l.admin_username||'').toLowerCase().includes(q) ||
      (l.details||'').toLowerCase().includes(q) ||
      (l.entity_type||'').toLowerCase().includes(q) ||
      (l.action_type||'').toLowerCase().includes(q);
    const matchAction = actionF === 'all' || l.action_type === actionF;
    return matchSearch && matchAction;
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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

  const handleExport = () => {
    const csv = [
      ['Timestamp','Admin','Action','Entity','Entity ID','Details'],
      ...logs.map(l => [
        formatDateTime(l.timestamp),
        l.admin_name || l.admin_username || '—',
        l.action_type,
        l.entity_type,
        l.entity_id || '—',
        l.details || '—'
      ])
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit_logs_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sl">
        <Sidebar/>
        <div className="sm">

          <header className="s-topbar">
            <div className="s-bc">
              <a href="/dashboard">Dashboard</a>
              <span style={{color:'var(--text3)'}}>›</span>
              <strong>System Audit Logs</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,color:'var(--text2)',fontWeight:600}}>{admin.username}</span>
              <button className="s-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('admin'); navigate('/login',{replace:true}); }}>Sign Out</button>
            </div>
          </header>

          <div className="sc-wrap">
            <div className="s-head">
              <div>
                <div className="s-title">System Audit Logs</div>
                <div className="s-sub">Real-time monitoring of all administrative operations. Track modifications, deletions, and access patterns to ensure institutional security and accountability.</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button className="s-icon-btn" onClick={() => load(page)}>{Ic.refresh} Refresh</button>
                <button className="s-icon-btn" onClick={handleExport}>{Ic.export} Export CSV</button>
              </div>
            </div>

            <div className="s-card">
              <div className="s-card-top">
                <div className="search-wrap">
                  {Ic.search}
                  <input className="s-search" placeholder="Search by Admin, Action, or Details…" value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <select className="s-fsel" value={actionF} onChange={e => setActionF(e.target.value)}>
                  <option value="all">All Actions</option>
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <table className="st">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:6}).map((_,i) => (
                        <tr key={i}>
                          {[130,140,80,260,80].map((w,j) => <td key={j}><div className="sh-bar" style={{width:w}}/></td>)}
                        </tr>
                      ))
                    : filtered.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:48,color:'var(--text3)'}}>No log entries found.</td></tr>
                    : filtered.map(l => {
                        const as = actionStyle(l.action_type);
                        const initials = l.admin_name
                          ? l.admin_name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
                          : (l.admin_username||'?').substring(0,2).toUpperCase();
                        return (
                          <tr key={l.id}>
                            <td><span className="ts">{formatDateTime(l.timestamp)}</span></td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div className="a-av" style={{background:avatarColor(l.admin_username||'')}}>{initials}</div>
                                <div>
                                  <div className="a-name">{l.admin_name || l.admin_username || '—'}</div>
                                  <div style={{fontSize:11.5,color:'var(--text3)'}}>@{l.admin_username || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="entity-chip">{l.entity_type}</span>
                            </td>
                            <td style={{maxWidth:320}}>
                              <div style={{fontSize:13,color:'var(--text)',fontWeight:500}}>{l.details || '—'}</div>
                              {l.entity_id && <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>ID: {l.entity_id}</div>}
                            </td>
                            <td>
                              <span className="action-badge" style={{background:as.bg,color:as.color}}>{as.label}</span>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>

              <div className="s-foot">
                <span className="s-fi">
                  {total === 0 ? 'No entries' : `Showing ${Math.min((page-1)*ITEMS_PER_PAGE+1, total)}–${Math.min(page*ITEMS_PER_PAGE, total)} of ${total} entries`}
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