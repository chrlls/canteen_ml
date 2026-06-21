import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';

const RC = {
  admin:    { color: 'text-red-600', bg: 'bg-red-100/50 border border-red-200' },
  cashier:  { color: 'text-green-600', bg: 'bg-green-100/50 border border-green-200' },
  customer: { color: 'text-blue-600', bg: 'bg-blue-100/50 border border-blue-200' },
};

const AVATAR_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-teal-500'];
const avatarColor = id => AVATAR_COLORS[id % AVATAR_COLORS.length];
const initials = name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  
  useEffect(() => { fetchUsers(); }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filtered].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aVal = a[key];
    let bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setError('');
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
    { label: 'Total Users', value: users.length, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Cashiers', value: users.filter(u => u.role === 'cashier').length, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Customers', value: users.filter(u => u.role === 'customer').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <Layout hideNavbar={true}>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1e293b]">
              User Management
            </h1>
            <p className="text-[15px] font-medium text-slate-500/90 mt-1.5 tracking-wide">Manage system users and their roles</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="font-bold shadow-sm">
            + Add User
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <Card key={i} className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${s.bg} ${s.color}`}>
                  {s.label[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-11 bg-background border-border/50 text-base shadow-sm"
          />
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                    User {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('role')}>
                    Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('created_at')}>
                    Joined {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="h-16">
                        <div className="w-full h-8 bg-muted/50 animate-pulse rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map(u => {
                    const rc = RC[u.role] || RC.customer;
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatarColor(u.id)}`}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${rc.bg} ${rc.color}`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id, u.name)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account and assign a role.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                {error && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">⚠️ {error}</div>}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Juan dela Cruz" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="juan@school.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.name || !form.email || !form.password}>
                  {saving ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}