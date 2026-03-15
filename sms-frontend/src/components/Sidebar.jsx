// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import crest from '../assets/crest.png';

const AVATAR_COLORS = ['#3B5BDB','#0CA678','#F59F00','#E8403A','#7048E8','#1098AD'];
const avatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (name) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { label: 'Students',  path: '/students',  icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Courses',   path: '/courses',   icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { label: 'Intakes',   path: '/intakes',   icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { label: 'Admins',    path: '/admins',    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { label: 'Logs',      path: '/logs',      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
];

const sidebarStyles = `
  .sb { width:228px; min-height:100vh; background:#1a1d27; display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:100; }
  .sb-brand { display:flex; align-items:center; gap:10px; padding:18px 16px; border-bottom:1px solid rgba(255,255,255,0.07); text-decoration:none; }
  .sb-brand-img { width:34px; height:34px; object-fit:contain; background:#ffff; border-radius:8px; padding:3px; flex-shrink:0; }
  .sb-brand-name { font-family:'Sora',sans-serif; font-size:13px; font-weight:700; color:#fff; line-height:1.2; }
  .sb-brand-sub { font-size:10px; color:rgba(255,255,255,0.38); text-transform:uppercase; letter-spacing:.08em; }
  .sb-nav { flex:1; padding:14px 10px; display:flex; flex-direction:column; gap:2px; }
  .nav-link { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; color:rgba(255,255,255,0.52); font-size:13.5px; font-weight:500; text-decoration:none; transition:background .16s,color .16s; }
  .nav-link:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.88); }
  .nav-link.active { background:#E8403A; color:#fff; font-weight:600; }
  .sb-foot { padding:14px 16px; border-top:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:10px; }
  .sb-ava { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; }
  .sb-uname { font-size:12.5px; font-weight:600; color:#fff; line-height:1.2; }
  .sb-urole { font-size:10px; color:rgba(255,255,255,0.38); text-transform:uppercase; letter-spacing:.06em; }
  .sb-logout-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.35); padding:4px; transition:color .15s; }
  .sb-logout-btn:hover { color:#E8403A; }
`;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || '{"username":"Admin User"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside className="sb">
        <Link to="/dashboard" className="sb-brand">
          <img src={crest} alt="crest" className="sb-brand-img" />
          <div>
            <div className="sb-brand-name">SMS Admin</div>
            <div className="sb-brand-sub">Management Portal</div>
          </div>
        </Link>

        <nav className="sb-nav">
          {NAV.map(({ label, icon, path }) => (
            <Link key={path} to={path} className={`nav-link ${location.pathname === path ? 'active' : ''}`}>
              {icon} {label}
            </Link>
          ))}
        </nav>

        <div className="sb-foot">
          <div className="sb-ava" style={{ background: avatarColor(admin.username || 'A') }}>
            {initials(admin.username || 'Admin')}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sb-uname">{admin.username || 'Admin User'}</div>
            <div className="sb-urole">Super Admin</div>
          </div>
          <button className="sb-logout-btn" onClick={handleLogout} title="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
