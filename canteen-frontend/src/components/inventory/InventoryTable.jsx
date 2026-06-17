import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import api from '../../services/api';

function InventoryTable() {
    const [items, setItems]         = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');

    // Adjust modal
    const [adjustId, setAdjustId]     = useState(null);
    const [adjustItem, setAdjustItem] = useState(null);
    const [form, setForm]             = useState({ quantity_change: '', reason: '' });
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');

    // Add Product modal
    const [showAdd, setShowAdd]   = useState(false);
    const [addForm, setAddForm]   = useState({ name: '', price: '', stock: '', category_id: '', is_available: true });
    const [addSaving, setAddSaving] = useState(false);
    const [addError, setAddError] = useState('');

    const fetchItems = () => {
        setLoading(true);
        api.get('/inventory')
            .then(res => setItems(res.data))
            .catch(console.log)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchItems();
        api.get('/categories').then(res => setCategories(res.data)).catch(console.log);
    }, []);

    // ── Adjust Stock ──
    const handleAdjust = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await api.patch(`/inventory/${adjustId}/adjust`, {
                quantity_change: parseInt(form.quantity_change),
                reason: form.reason || 'Manual adjustment'
            });
            setAdjustId(null);
            setAdjustItem(null);
            setForm({ quantity_change: '', reason: '' });
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to adjust stock. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const openAdjust = (item) => {
        setAdjustId(item.id);
        setAdjustItem(item);
        setForm({ quantity_change: '', reason: '' });
        setError('');
    };

    const closeAdjust = () => {
        setAdjustId(null);
        setAdjustItem(null);
        setForm({ quantity_change: '', reason: '' });
        setError('');
    };

    // ── Add Product ──
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddSaving(true);
        try {
            await api.post('/menu', {
                name: addForm.name,
                price: parseFloat(addForm.price),
                stock: parseInt(addForm.stock),
                category_id: parseInt(addForm.category_id),
                is_available: addForm.is_available,
            });
            setShowAdd(false);
            setAddForm({ name: '', price: '', stock: '', category_id: '', is_available: true });
            fetchItems();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to add product.');
        } finally {
            setAddSaving(false);
        }
    };

    const closeAdd = () => {
        setShowAdd(false);
        setAddForm({ name: '', price: '', stock: '', category_id: '', is_available: true });
        setAddError('');
    };

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const lowCount = items.filter(i => i.stock < 10).length;

    const stockColor = (stock) => {
        if (stock <= 0) return { color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',  label: 'Out' };
        if (stock < 5)  return { color: '#c0392b', bg: 'rgba(192,57,43,0.1)',  label: 'Critical' };
        if (stock < 10) return { color: '#f39c12', bg: 'rgba(243,156,18,0.1)', label: 'Low' };
        if (stock < 30) return { color: '#27ae60', bg: 'rgba(39,174,96,0.1)',  label: 'Good' };
        return              { color: '#3498db', bg: 'rgba(52,152,219,0.1)', label: 'High' };
    };

    return (
        <Layout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                .inv { font-family: 'Poppins', sans-serif; }
                .inv-header { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.75rem; }
                .inv-title  { font-size:1.45rem;font-weight:800;color:#1a1a2e;margin-bottom:2px;letter-spacing:-0.3px; }
                .inv-sub    { font-size:0.8rem;color:#bbb;font-weight:400; }
                .inv-low-badge { background:rgba(231,76,60,0.1);color:#e74c3c;padding:0.3rem 0.85rem;border-radius:20px;font-size:0.75rem;font-weight:700;white-space:nowrap; }
                .inv-header-right { display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap; }
                .inv-add-btn {
                    padding:0.52rem 1.2rem;border:none;border-radius:10px;
                    background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;
                    font-family:'Poppins',sans-serif;font-size:0.85rem;font-weight:600;
                    cursor:pointer;white-space:nowrap;
                    box-shadow:0 3px 10px rgba(231,76,60,0.3);transition:transform 0.18s;
                }
                .inv-add-btn:hover { transform:translateY(-1px); }
                .inv-divider { display:flex;align-items:center;gap:0.75rem;margin-bottom:1.1rem; }
                .inv-divider-line { flex:1;height:1px;background:#ebebeb; }
                .inv-divider-text { font-size:0.67rem;color:#ccc;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap; }
                .inv-search-wrap { position:relative;margin-bottom:1.1rem; }
                .inv-search-icon { position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:#ccc;font-size:0.88rem; }
                .inv-search {
                    width:100%;padding:0.72rem 1rem 0.72rem 2.6rem;
                    background:#fff;border:1.5px solid #e8e8e8;border-radius:12px;
                    font-family:'Poppins',sans-serif;font-size:0.875rem;color:#1a1a2e;
                    outline:none;transition:border-color 0.2s,box-shadow 0.2s;
                }
                .inv-search:focus { border-color:#e74c3c;box-shadow:0 0 0 3px rgba(231,76,60,0.1); }
                .inv-search::placeholder { color:#bbb; }
                .inv-card {
                    background:#fff;border-radius:18px;border:1px solid #f0f0f0;
                    box-shadow:0 2px 12px rgba(0,0,0,0.055);overflow:hidden;position:relative;
                }
                .inv-card::before {
                    content:'';position:absolute;top:0;left:0;right:0;height:3px;
                    background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);
                    background-size:200% 100%;animation:invShim 3s linear infinite;z-index:1;
                }
                @keyframes invShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .inv-table { width:100%;border-collapse:collapse;font-size:0.875rem; }
                .inv-table th {
                    padding:0.85rem 1.25rem;background:#fafafa;font-size:0.67rem;font-weight:700;
                    color:#bbb;text-transform:uppercase;letter-spacing:0.1em;
                    text-align:left;border-bottom:1px solid #f0f0f0;
                }
                .inv-table td { padding:0.9rem 1.25rem;border-bottom:1px solid #f8f8f8;vertical-align:middle; }
                .inv-table tr:last-child td { border-bottom:none; }
                .inv-table tr:hover td { background:#fafafa; }
                .inv-item-name { font-weight:700;color:#1a1a2e;font-size:0.88rem; }
                .inv-item-cat  { font-size:0.75rem;color:#bbb;margin-top:2px; }
                .inv-stock-num { font-size:1rem;font-weight:800; }
                .inv-badge { display:inline-flex;align-items:center;gap:4px;padding:0.22rem 0.7rem;border-radius:20px;font-size:0.68rem;font-weight:700;letter-spacing:0.03em; }
                .inv-avail-badge { padding:0.22rem 0.7rem;border-radius:20px;font-size:0.68rem;font-weight:700; }
                .inv-adjust-btn {
                    padding:0.45rem 1rem;border:none;border-radius:10px;
                    background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;
                    font-family:'Poppins',sans-serif;font-size:0.78rem;font-weight:600;
                    cursor:pointer;transition:opacity 0.18s,transform 0.18s;
                    box-shadow:0 2px 8px rgba(231,76,60,0.28);
                }
                .inv-adjust-btn:hover { opacity:0.88;transform:translateY(-1px); }
                .inv-shimmer {
                    background:linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%);
                    background-size:200% 100%;animation:invSkShim 1.4s infinite;height:52px;
                }
                @keyframes invSkShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .inv-modal-overlay {
                    position:fixed;inset:0;background:rgba(0,0,0,0.48);
                    backdrop-filter:blur(5px);z-index:200;
                    display:flex;align-items:center;justify-content:center;padding:1rem;
                }
                .inv-modal {
                    background:#fff;border-radius:22px;width:100%;max-width:440px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.04);
                    animation:mIn 0.25s cubic-bezier(0.16,1,0.3,1);
                    font-family:'Poppins',sans-serif;overflow:hidden;position:relative;
                }
                .inv-modal::before {
                    content:'';position:absolute;top:0;left:0;right:0;height:3px;
                    background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);
                    background-size:200% 100%;animation:invShim 3s linear infinite;z-index:2;
                }
                @keyframes mIn { from{opacity:0;transform:scale(0.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
                .inv-modal-head {
                    padding:1.35rem 1.5rem 1rem;border-bottom:1px solid #f0f0f0;
                    display:flex;align-items:center;justify-content:space-between;
                }
                .inv-modal-title { font-size:1rem;font-weight:800;color:#1a1a2e; }
                .inv-modal-sub   { font-size:0.75rem;color:#bbb;margin-top:2px; }
                .inv-modal-close { background:none;border:none;font-size:1.2rem;cursor:pointer;color:#bbb;transition:color 0.18s; }
                .inv-modal-close:hover { color:#e74c3c; }
                .inv-modal-body  { padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem; }
                .inv-m-label { display:block;font-size:0.7rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:0.4rem; }
                .inv-m-input, .inv-m-select {
                    width:100%;padding:0.8rem 1rem;background:#f5f5f5;
                    border:1.5px solid #ebebeb;border-radius:12px;
                    font-family:'Poppins',sans-serif;font-size:0.875rem;color:#1a1a2e;
                    outline:none;transition:border-color 0.2s,box-shadow 0.2s;box-sizing:border-box;
                }
                .inv-m-input:focus, .inv-m-select:focus { border-color:#e74c3c;background:#fff;box-shadow:0 0 0 3px rgba(231,76,60,0.1); }
                .inv-m-input::placeholder { color:#bbb; }
                .inv-m-hint { font-size:0.72rem;color:#bbb;margin-top:4px; }
                .inv-m-error {
                    background:#fff0ef;border:1px solid #ffc5c0;border-radius:10px;
                    padding:0.65rem 1rem;font-size:0.8rem;color:#c0392b;font-weight:500;
                    display:flex;align-items:center;gap:6px;
                }
                .inv-m-row { display:grid;grid-template-columns:1fr 1fr;gap:0.85rem; }
                .inv-modal-foot { padding:0.85rem 1.5rem 1.35rem;display:flex;gap:0.75rem; }
                .inv-m-cancel {
                    flex:1;padding:0.72rem;border-radius:12px;
                    border:1.5px solid #e8e8e8;background:transparent;
                    font-family:'Poppins',sans-serif;font-size:0.875rem;color:#888;cursor:pointer;
                    transition:background 0.18s;
                }
                .inv-m-cancel:hover { background:#f7f7f7; }
                .inv-m-save {
                    flex:1;padding:0.72rem;border-radius:12px;border:none;
                    background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;
                    font-family:'Poppins',sans-serif;font-size:0.875rem;font-weight:700;
                    cursor:pointer;transition:opacity 0.18s;
                    box-shadow:0 4px 14px rgba(231,76,60,0.35);position:relative;overflow:hidden;
                }
                .inv-m-save::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 60%);pointer-events:none; }
                .inv-m-save:disabled { opacity:0.5;cursor:not-allowed; }
                .inv-m-save:hover:not(:disabled) { opacity:0.9; }
                .inv-m-spin { width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:6px; }
                @keyframes spin { to { transform:rotate(360deg) } }
                .inv-m-toggle { display:flex;align-items:center;gap:0.6rem;font-size:0.85rem;color:#555;cursor:pointer; }
                .inv-m-toggle input { accent-color:#e74c3c;width:16px;height:16px;cursor:pointer; }
            `}</style>

            <div className="inv">

                {/* Header */}
                <div className="inv-header">
                    <div>
                        <div className="inv-title">📦 Inventory Management</div>
                        <div className="inv-sub">Manage stock levels and view adjustment history</div>
                    </div>
                    <div className="inv-header-right">
                        {lowCount > 0 && (
                            <span className="inv-low-badge">⚠️ {lowCount} Low Stock</span>
                        )}
                        <button className="inv-add-btn" onClick={() => setShowAdd(true)}>
                            + Add Product
                        </button>
                    </div>
                </div>

                <div className="inv-divider">
                    <div className="inv-divider-line" />
                    <span className="inv-divider-text">Stock Overview</span>
                    <div className="inv-divider-line" />
                </div>

                <div className="inv-search-wrap">
                    <span className="inv-search-icon">🔍</span>
                    <input
                        className="inv-search"
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="inv-card">
                    <table className="inv-table">
                        <thead>
                            <tr>
                                <th>Item</th><th>Category</th><th>Stock</th>
                                <th>Status</th><th>Availability</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1,2,3,4,5].map(i => (
                                    <tr key={i}><td colSpan={6} style={{ padding: 0 }}><div className="inv-shimmer" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#bbb', fontSize: '0.9rem' }}>No items found</td></tr>
                            ) : (
                                filtered.map(item => {
                                    const s = stockColor(item.stock);
                                    return (
                                        <tr key={item.id}>
                                            <td><div className="inv-item-name">{item.name}</div></td>
                                            <td><div className="inv-item-cat">{item.category?.name || '—'}</div></td>
                                            <td><span className="inv-stock-num" style={{ color: s.color }}>{item.stock}</span></td>
                                            <td><span className="inv-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                                            <td>
                                                <span className="inv-avail-badge" style={{
                                                    background: item.is_available ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
                                                    color: item.is_available ? '#27ae60' : '#e74c3c',
                                                }}>
                                                    {item.is_available ? '● Available' : '○ Unavailable'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="inv-adjust-btn" onClick={() => openAdjust(item)}>
                                                    Adjust Stock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Adjust Stock Modal */}
                {adjustId && (
                    <div className="inv-modal-overlay" onClick={closeAdjust}>
                        <div className="inv-modal" onClick={e => e.stopPropagation()}>
                            <div className="inv-modal-head">
                                <div>
                                    <div className="inv-modal-title">Adjust Stock</div>
                                    <div className="inv-modal-sub">
                                        {adjustItem?.name} — Current: <strong style={{ color: '#e74c3c' }}>{adjustItem?.stock}</strong>
                                    </div>
                                </div>
                                <button className="inv-modal-close" onClick={closeAdjust}>✕</button>
                            </div>
                            <form onSubmit={handleAdjust}>
                                <div className="inv-modal-body">
                                    {error && <div className="inv-m-error">⚠️ {error}</div>}
                                    <div>
                                        <label className="inv-m-label">Quantity Change</label>
                                        <input
                                            className="inv-m-input"
                                            type="number"
                                            placeholder="e.g. 10 to add, -5 to remove"
                                            value={form.quantity_change}
                                            onChange={e => setForm({ ...form, quantity_change: e.target.value })}
                                            required autoFocus
                                        />
                                        <div className="inv-m-hint">Use positive to restock, negative to reduce</div>
                                    </div>
                                    <div>
                                        <label className="inv-m-label">Reason</label>
                                        <input
                                            className="inv-m-input"
                                            type="text"
                                            placeholder="e.g. Restock, Spoilage, Manual count..."
                                            value={form.reason}
                                            onChange={e => setForm({ ...form, reason: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="inv-modal-foot">
                                    <button type="button" className="inv-m-cancel" onClick={closeAdjust}>Cancel</button>
                                    <button type="submit" className="inv-m-save" disabled={saving || !form.quantity_change || !form.reason}>
                                        {saving && <span className="inv-m-spin" />}
                                        {saving ? 'Saving…' : 'Apply Adjustment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Product Modal */}
                {showAdd && (
                    <div className="inv-modal-overlay" onClick={closeAdd}>
                        <div className="inv-modal" onClick={e => e.stopPropagation()}>
                            <div className="inv-modal-head">
                                <div>
                                    <div className="inv-modal-title">Add Product</div>
                                    <div className="inv-modal-sub">Add a new item to inventory</div>
                                </div>
                                <button className="inv-modal-close" onClick={closeAdd}>✕</button>
                            </div>
                            <form onSubmit={handleAddProduct}>
                                <div className="inv-modal-body">
                                    {addError && <div className="inv-m-error">⚠️ {addError}</div>}
                                    <div>
                                        <label className="inv-m-label">Product Name</label>
                                        <input
                                            className="inv-m-input"
                                            type="text"
                                            placeholder="e.g. Chicken Adobo"
                                            value={addForm.name}
                                            onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                            required autoFocus
                                        />
                                    </div>
                                    <div className="inv-m-row">
                                        <div>
                                            <label className="inv-m-label">Price (₱)</label>
                                            <input
                                                className="inv-m-input"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={addForm.price}
                                                onChange={e => setAddForm({ ...addForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="inv-m-label">Initial Stock</label>
                                            <input
                                                className="inv-m-input"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={addForm.stock}
                                                onChange={e => setAddForm({ ...addForm, stock: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="inv-m-label">Category</label>
                                        <select
                                            className="inv-m-select"
                                            value={addForm.category_id}
                                            onChange={e => setAddForm({ ...addForm, category_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select a category...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <label className="inv-m-toggle">
                                        <input
                                            type="checkbox"
                                            checked={addForm.is_available}
                                            onChange={e => setAddForm({ ...addForm, is_available: e.target.checked })}
                                        />
                                        Mark as Available
                                    </label>
                                </div>
                                <div className="inv-modal-foot">
                                    <button type="button" className="inv-m-cancel" onClick={closeAdd}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="inv-m-save"
                                        disabled={addSaving || !addForm.name || !addForm.price || !addForm.stock || !addForm.category_id}
                                    >
                                        {addSaving && <span className="inv-m-spin" />}
                                        {addSaving ? 'Adding…' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}

export default InventoryTable;