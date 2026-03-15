import { BASE_URL } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminCount, fetchIntakeCount, fetchCourseCount, fetchStudents } from '../services/api';
import Sidebar from '../components/Sidebar';

const formatDate = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  );
};

const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD'];
const avatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (name||'').charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (name) => (name||'?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const ACTION_STYLES = {
  CREATE: { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'SUCCESS' },
  UPDATE: { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6', label:'INFO' },
  DELETE: { bg:'#fee2e2', color:'#dc2626', dot:'#ef4444', label:'CRITICAL' },
  ASSIGN: { bg:'#fef3c7', color:'#92400e', dot:'#f59e0b', label:'ASSIGN' },
  REMOVE: { bg:'#fce7f3', color:'#9d174d', dot:'#ec4899', label:'REMOVE' },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body, #root { width:100%; min-height:100vh; }
  :root {
    --sb-w:228px; --sb-bg:#1a1d27; --accent:#E8403A; --accent-soft:rgba(232,64,58,0.12);
    --white:#fff; --bg:#f5f6fa; --card:#eef1f8; --border:#e5e7eb;
    --text:#111827; --text2:#6b7280; --text3:#9ca3af; --r:12px;
    --fh:'Sora',sans-serif; --fb:'DM Sans',sans-serif;
  }
  .dl { display:flex; min-height:100vh; background:var(--bg); font-family:var(--fb); }
  .dm { margin-left:var(--sb-w); flex:1; display:flex; flex-direction:column; min-height:100vh; }

  .topbar {
    background:var(--white); border-bottom:1px solid var(--border);
    padding:0 28px; height:52px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:50;
  }
  .topbar-title { font-family:var(--fh); font-size:15px; font-weight:700; color:var(--text); }
  .topbar-r { display:flex; align-items:center; gap:10px; }
  .topbar-name { font-size:13px; font-weight:600; color:var(--text2); }
  .btn-out {
    height:32px; padding:0 12px; border-radius:7px;
    border:1.5px solid var(--border); background:#fff;
    font-family:var(--fb); font-size:12.5px; font-weight:600;
    color:var(--text2); cursor:pointer; transition:border-color .15s,color .15s;
  }
  .btn-out:hover { border-color:var(--accent); color:var(--accent); }

  .dc { padding:26px 28px; display:flex; flex-direction:column; gap:22px; }

  .sg { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .sc {
    background:var(--card); border-radius:var(--r); padding:20px 22px;
    display:flex; flex-direction:column; gap:10px;
    border:1px solid transparent; transition:border-color .18s,box-shadow .18s,transform .18s;
    animation:fadeUp .4s ease both;
  }
  .sc:hover { border-color:var(--border); box-shadow:0 4px 16px rgba(0,0,0,.07); transform:translateY(-2px); }
  .sc:nth-child(1){animation-delay:.05s} .sc:nth-child(2){animation-delay:.1s}
  .sc:nth-child(3){animation-delay:.15s} .sc:nth-child(4){animation-delay:.2s}
  .sc-top { display:flex; align-items:flex-start; justify-content:space-between; }
  .sc-icon { width:42px; height:42px; border-radius:10px; background:#1a1d27; display:flex; align-items:center; justify-content:center; color:#fff; }
  .sc-badge { font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; }
  .bg-g { background:#dcfce7; color:#166534; }
  .bg-b { background:#dbeafe; color:#1e40af; }
  .bg-o { background:#ffedd5; color:#9a3412; }
  .bg-p { background:#ede9fe; color:#5b21b6; }
  .sc-label { font-size:12.5px; color:var(--text2); font-weight:500; }
  .sc-val { font-family:var(--fh); font-size:28px; font-weight:700; color:var(--text); line-height:1; }
  .sc-shimmer { height:28px; width:80px; border-radius:6px; background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

  .ac { background:var(--white); border-radius:var(--r); border:1px solid var(--border); overflow:hidden; animation:fadeUp .4s ease .25s both; }
  .ac-head { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 24px 16px; border-bottom:1px solid var(--border); }
  .ac-title { font-family:var(--fh); font-size:15px; font-weight:700; color:var(--text); }
  .ac-sub { font-size:12.5px; color:var(--text3); margin-top:2px; }
  .btn-exp { display:flex; align-items:center; gap:6px; background:none; border:1px solid var(--border); border-radius:7px; padding:7px 13px; font-size:12.5px; font-weight:600; color:var(--text2); cursor:pointer; font-family:inherit; transition:border-color .18s,color .18s; white-space:nowrap; }
  .btn-exp:hover { border-color:var(--accent); color:var(--accent); }

  table { width:100%; border-collapse:collapse; }
  thead tr { background:#fafafa; }
  th { text-align:left; padding:11px 20px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text3); border-bottom:1px solid var(--border); }
  td { padding:13px 20px; font-size:13.5px; color:var(--text); border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tbody tr { transition:background .12s; }
  tbody tr:hover td { background:#fafbff; }

  .uc { display:flex; align-items:center; gap:9px; }
  .uav { width:29px; height:29px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:#fff; }
  .unm { font-weight:600; font-size:13.5px; }
  .sbadge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11.5px; font-weight:600; }
  .sdot { width:6px; height:6px; border-radius:50%; }
  .act-btn { background:none; border:none; cursor:pointer; color:var(--text3); padding:4px 8px; border-radius:6px; font-size:18px; line-height:1; transition:background .12s,color .12s; }
  .act-btn:hover { background:#f3f4f6; color:var(--text); }

  .ac-foot { padding:12px 20px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .ac-count { font-size:12.5px; color:var(--text3); }
  .pgn { display:flex; gap:6px; }
  .pg-btn { width:30px; height:30px; border-radius:7px; border:1px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); transition:border-color .15s,color .15s; }
  .pg-btn:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); }
  .pg-btn:disabled { opacity:.35; cursor:not-allowed; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes shimmer { to{background-position:-200% 0} }
  @media (max-width:1100px) { .sg { grid-template-columns:repeat(2,1fr); } }
`;

const Icon = {
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  export: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

const STAT_ICONS = {
  students: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  courses:  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>,
  intakes:  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>,
  admins:   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>,
};

const ITEMS_PER_PAGE = 5;

export default function Dashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin"}');
  const token  = localStorage.getItem('token');

  const [totalStudents, setTotalStudents] = useState(null);
  const [totalCourses,  setTotalCourses]  = useState(null);
  const [totalIntakes,  setTotalIntakes]  = useState(null);
  const [totalAdmins,   setTotalAdmins]   = useState(null);
  const [activity,      setActivity]      = useState([]);
  const [page,          setPage]          = useState(1);

  const totalPages  = Math.ceil(activity.length / ITEMS_PER_PAGE);
  const visibleRows = activity.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  useEffect(() => {
    fetchCourseCount().then(d => setTotalCourses(d.count)).catch(() => setTotalCourses('—'));
    fetchIntakeCount().then(d => setTotalIntakes(d.count)).catch(() => setTotalIntakes('—'));
    fetchAdminCount().then(d  => setTotalAdmins(d.count)).catch(() => setTotalAdmins('—'));
    fetchStudents({ limit:1 }).then(d => setTotalStudents(d.pagination?.total ?? (d.data||[]).length)).catch(() => setTotalStudents('—'));

    fetch(`http://localhost:5000/api/logs?limit=20`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setActivity(d.data || []))
      .catch(() => setActivity([]));
  }, []);

  const CARDS = [
    { icon: STAT_ICONS.students, label:'Total Students',  value: totalStudents, badge:'Live', cls:'bg-g' },
    { icon: STAT_ICONS.courses,  label:'Active Courses',  value: totalCourses,  badge:'Live', cls:'bg-b' },
    { icon: STAT_ICONS.intakes,  label:'Current Intakes', value: totalIntakes,  badge:'Live', cls:'bg-o' },
    { icon: STAT_ICONS.admins,   label:'System Admins',   value: totalAdmins,   badge:'Live', cls:'bg-p' },
  ];

  const handleExport = () => {
    const csv = [
      ['Timestamp','Admin','Action','Details'],
      ...activity.map(l => [
        formatDate(l.timestamp),
        l.admin_name || l.admin_username || '—',
        l.action_type,
        l.details || '—'
      ])
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `activity_report_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dl">
        <Sidebar/>
        <div className="dm">

          <header className="topbar">
            <span className="topbar-title">Dashboard Overview</span>
            <div className="topbar-r">
              <span className="topbar-name">{admin.username}</span>
              <button className="btn-out" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('admin'); navigate('/login',{replace:true}); }}>Sign Out</button>
            </div>
          </header>

          <main className="dc">
            <div className="sg">
              {CARDS.map(({ icon, label, value, badge, cls }) => (
                <div className="sc" key={label}>
                  <div className="sc-top">
                    <div className="sc-icon">{icon}</div>
                    <span className={`sc-badge ${cls}`}>{badge}</span>
                  </div>
                  <div className="sc-label">{label}</div>
                  {value === null
                    ? <div className="sc-shimmer"/>
                    : <div className="sc-val">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                  }
                </div>
              ))}
            </div>

            <div className="ac">
              <div className="ac-head">
                <div>
                  <div className="ac-title">Recent Activity</div>
                  <div className="ac-sub">Real-time system updates and actions</div>
                </div>
                <button className="btn-exp" onClick={handleExport}>{Icon.export} Export Report</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Admin / User</th>
                    <th>Action Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.length === 0
                    ? <tr><td colSpan={5} style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>No recent activity yet.</td></tr>
                    : visibleRows.map(row => {
                        const s = ACTION_STYLES[row.action_type] || ACTION_STYLES.UPDATE;
                        const adminName = row.admin_name || row.admin_username || 'System';
                        return (
                          <tr key={row.id}>
                            <td style={{color:'var(--text2)',fontSize:'13px'}}>{formatDate(row.timestamp)}</td>
                            <td>
                              <div className="uc">
                                <div className="uav" style={{background:avatarColor(adminName)}}>{initials(adminName)}</div>
                                <span className="unm">{adminName}</span>
                              </div>
                            </td>
                            <td style={{color:'var(--text2)'}}>{row.details || `${row.action_type} ${row.entity_type}`}</td>
                            <td>
                              <span className="sbadge" style={{background:s.bg,color:s.color}}>
                                <span className="sdot" style={{background:s.dot}}/>
                                {s.label}
                              </span>
                            </td>
                            <td><button className="act-btn" title="More">⋮</button></td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>

              <div className="ac-foot">
                <span className="ac-count">Showing {visibleRows.length} of {activity.length} recent entries</span>
                <div className="pgn">
                  <button className="pg-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>{Icon.chevL}</button>
                  <button className="pg-btn" onClick={() => setPage(p=>p+1)} disabled={page===totalPages||totalPages===0}>{Icon.chevR}</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}