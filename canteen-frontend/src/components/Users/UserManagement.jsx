import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import api from '../../services/api';

const RC = {
  admin:    { color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',   icon: '👑' },
  cashier:  { color: '#27ae60', bg: 'rgba(39,174,96,0.1)',   icon: '💰' },
  customer: { color: '#3498db', bg: 'rgba(52,152,219,0.1)',  icon: '👤' },
};
const AVATAR_COLORS = ['#e74c3c','#3498db','#27ae60','#f39c12','#9b59b6','#1abc9c'];
const avatarColor = id => AVATAR_COLORS[id % AVATAR_COLORS.length];
const initials = name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'customer' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [show, setShow]           = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => { setLoading(false); setTimeout(() => setShow(true), 60); });
  };
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'customer' });
      fetchUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch {
      alert('Failed to delete user.');
    }
  };

  const STATS = [
    { label: 'Total Users', value: users.length,                               color: '#e74c3c', bg: 'rgba(231,76,60,0.08)',  icon: '👥' },
    { label: 'Admins',      value: users.filter(u => u.role === 'admin').length,   color: '#f39c12', bg: 'rgba(243,156,18,0.08)', icon: '👑' },
    { label: 'Cashiers',    value: users.filter(u => u.role === 'cashier').length, color: '#27ae60', bg: 'rgba(39,174,96,0.08)',  icon: '💰' },
    { label: 'Customers',   value: users.filter(u => u.role === 'customer').length,color: '#3498db', bg: 'rgba(52,152,219,0.08)', icon: '👤' },
  ];

  return (
    <Layout>
      <style>{`
        .um { font-family:'Poppins',sans-serif; }
        .um-title { font-size:1.45rem;font-weight:800;color:#1a1a2e;margin-bottom:2px;letter-spacing:-0.3px; }
        .um-sub   { font-size:0.8rem;color:#aaa;margin-bottom:1.4rem; }
        .um-stats { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.25rem; }
        .um-stat {
          background:#fff;border-radius:16px;padding:1.1rem 1.3rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.055);border:1px solid #f0f0f0;
          display:flex;align-items:center;gap:0.85rem;
          opacity:0;transform:translateY(14px);transition:opacity 0.45s ease,transform 0.45s ease;
        }
        .um-stat.show{opacity:1;transform:translateY(0);}
        .um-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0;}
        .um-stat-label{font-size:0.68rem;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;}
        .um-stat-value{font-size:1.5rem;font-weight:700;}
        .um-card{background:#fff;border-radius:18px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.055);overflow:hidden;position:relative;}
        .um-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);background-size:200% 100%;animation:shimBarAnim 3s linear infinite;z-index:2;}
        .um-toolbar{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;}
        .um-search-wrap{position:relative;flex:1;min-width:180px;}
        .um-search-icon{position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:#ccc;font-size:0.85rem;}
        .um-search{width:100%;padding:0.6rem 0.85rem 0.6rem 2.3rem;background:#f7f7f7;border:1.5px solid #e8e8e8;border-radius:10px;font-family:'Poppins',sans-serif;font-size:0.85rem;color:#1a1a2e;outline:none;transition:border-color 0.2s;}
        .um-search:focus{border-color:#e74c3c;background:#fff;}
        .um-search::placeholder{color:#ccc;}
        .um-add-btn{padding:0.58rem 1.2rem;border:none;border-radius:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-family:'Poppins',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap;box-shadow:0 3px 10px rgba(231,76,60,0.3);transition:transform 0.18s;}
        .um-add-btn:hover{transform:translateY(-1px);}
        .um-table{width:100%;border-collapse:collapse;}
        .um-table th{padding:0.65rem 1.25rem;font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#bbb;text-align:left;background:#fafafa;border-bottom:1px solid #f0f0f0;}
        .um-table td{padding:0.9rem 1.25rem;font-size:0.875rem;color:#1a1a2e;border-bottom:1px solid #f7f7f7;}
        .um-table tr:last-child td{border:none;}
        .um-table tr:hover td{background:#fdfafa;}
        .um-user-cell{display:flex;align-items:center;gap:0.75rem;}
        .um-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0;}
        .um-user-name{font-weight:600;font-size:0.875rem;color:#1a1a2e;}
        .um-user-email{font-size:0.72rem;color:#bbb;}
        .um-role-badge{display:inline-flex;align-items:center;gap:4px;padding:0.2rem 0.7rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;}
        .um-del-btn{padding:0.3rem 0.75rem;border-radius:8px;border:1.5px solid rgba(231,76,60,0.2);background:transparent;color:#e74c3c;font-family:'Poppins',sans-serif;font-size:0.74rem;font-weight:600;cursor:pointer;transition:all 0.18s;}
        .um-del-btn:hover{background:rgba(231,76,60,0.08);border-color:#e74c3c;}
        .um-shimmer{background:linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;height:52px;margin-bottom:3px;}
        .um-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;}
        .um-modal{background:#fff;border-radius:20px;box-shadow:0 16px 48px rgba(0,0,0,0.16);width:100%;max-width:420px;font-family:'Poppins',sans-serif;animation:mIn 0.25s cubic-bezier(0.16,1,0.3,1);}
        @keyframes mIn{from{opacity:0;transform:scale(0.93) translateY(14px)}
        .um-m-head{padding:1.2rem 1.5rem 0.9rem;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;}
        .um-m-title{font-size:1rem;font-weight:700;color:#1a1a2e;}
        .um-m-close{background:none;border:none;font-size:1.1rem;cursor:pointer;color:#bbb;transition:color 0.15s;}
        .um-m-close:hover{color:#e74c3c;}
        .um-m-body{padding:1.2rem 1.5rem;display:flex;flex-direction:column;gap:0.85rem;}
        .um-m-label{display:block;font-size:0.68rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.38rem;}
        .um-m-input,.um-m-select{width:100%;padding:0.7rem 1rem;background:#f7f7f7;border:1.5px solid #e8e8e8;border-radius:10px;font-family:'Poppins',sans-serif;font-size:0.875rem;color:#1a1a2e;outline:none;transition:border-color 0.2s;box-sizing:border-box;}
        .um-m-input:focus,.um-m-select:focus{border-color:#e74c3c;background:#fff;}
        .um-m-error{background:#fff0ef;border:1px solid #ffc5c0;border-radius:10px;padding:0.65rem 1rem;font-size:0.8rem;color:#c0392b;font-weight:500;}
        .um-m-foot{padding:0.85rem 1.5rem 1.2rem;display:flex;gap:0.75rem;justify-content:flex-end;}
        .um-m-cancel{padding:0.58rem 1.2rem;border-radius:10px;border:1.5px solid #e8e8e8;background:transparent;font-family:'Poppins',sans-serif;font-size:0.85rem;color:#888;cursor:pointer;}
        .um-m-save{padding:0.58rem 1.4rem;border-radius:10px;border:none;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-family:'Poppins',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:opacity 0.18s;}
        .um-m-save:disabled{opacity:0.55;cursor:not-allowed;}
        .um-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:6px;}
        }
      `}</style>

      <div className="um">
        <div className="um-title">👥 User Management</div>
        <div className="um-sub">Manage system users and their roles</div>

        <div className="um-stats">
          {STATS.map((s, i) => (
            <div key={i} className={`um-stat${show ? ' show' : ''}`} style={{ transitionDelay: `${0.05 + i * 0.07}s` }}>
              <div className="um-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div className="um-stat-label">{s.label}</div>
                <div className="um-stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="um-card">
          <div className="um-toolbar">
            <div className="um-search-wrap">
              <span className="um-search-icon">🔍</span>
              <input className="um-search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="um-add-btn" onClick={() => setShowModal(true)}>+ Add User</button>
          </div>

          {loading
            ? <div style={{ padding: '1rem 1.25rem' }}>{[1,2,3,4].map(i => <div key={i} className="um-shimmer" />)}</div>
            : <div style={{ overflowX: 'auto' }}>
                <table className="um-table">
                  <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
                  <tbody>
                    {filtered.map(u => {
                      const rc = RC[u.role] || RC.customer;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="um-user-cell">
                              <div className="um-avatar" style={{ background: avatarColor(u.id) }}>{initials(u.name)}</div>
                              <div>
                                <div className="um-user-name">{u.name}</div>
                                <div className="um-user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="um-role-badge" style={{ background: rc.bg, color: rc.color }}>{rc.icon} {u.role}</span></td>
                          <td style={{ color: '#bbb', fontSize: '0.78rem' }}>
                            {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td><button className="um-del-btn" onClick={() => handleDelete(u.id, u.name)}>Delete</button></td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#bbb', padding: '2rem' }}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>

      {showModal && (
        <div className="um-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-m-head">
              <span className="um-m-title">Add New User</span>
              <button className="um-m-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="um-m-body">
              {error && <div className="um-m-error">⚠️ {error}</div>}
              <div>
                <label className="um-m-label">Full Name</label>
                <input className="um-m-input" placeholder="Juan dela Cruz" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="um-m-label">Email</label>
                <input className="um-m-input" type="email" placeholder="juan@school.edu" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="um-m-label">Password</label>
                <input className="um-m-input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="um-m-label">Role</label>
                <select className="um-m-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="um-m-foot">
              <button className="um-m-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="um-m-save" onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password}>
                {saving && <span className="um-spin" />}{saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}