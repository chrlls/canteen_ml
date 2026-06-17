import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function MenuForm({ item, categories, onClose, onSave, onSaved }) {
  const [form, setForm] = useState({ name: '', price: '', stock: '', category_id: '', is_available: true, image: null });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // ✅ Accept both onSave and onSaved prop names
  const handleDone = onSaved || onSave;

  useEffect(() => {
    if (item) setForm({
      name: item.name,
      price: item.price,
      stock: item.stock,
      category_id: item.category_id,
      is_available: item.is_available,
      image: null
    });
  }, [item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', form.price);
      fd.append('stock', form.stock);
      fd.append('category_id', form.category_id);
      fd.append('is_available', form.is_available ? 1 : 0);
      if (form.image) fd.append('image', form.image);

      if (item) {
        // ✅ Laravel method spoofing for PUT with FormData
        fd.append('_method', 'PUT');
        await api.post(`/menu/${item.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/menu', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      handleDone?.();
    } catch (e) {
      const msg = e.response?.data?.message
        || e.response?.data?.errors
        || 'Failed to save item.';
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .mf-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem; }
        .mf-modal { background:#fff;border-radius:22px;box-shadow:0 16px 48px rgba(0,0,0,0.16);width:100%;max-width:440px;overflow:hidden;animation:mIn 0.25s cubic-bezier(0.16,1,0.3,1);font-family:'Poppins',sans-serif;position:relative; }
        .mf-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);background-size:200% 100%;animation:mfShim 3s linear infinite;z-index:2;}
        @keyframes mfShim{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes mIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .mf-head { padding:1.25rem 1.5rem 1rem;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between; }
        .mf-title { font-size:1rem;font-weight:700;color:#1a1a2e; }
        .mf-close { background:none;border:none;font-size:1.2rem;cursor:pointer;color:#bbb;transition:color 0.15s; }
        .mf-close:hover{color:#e74c3c;}
        .mf-body { padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.9rem; }
        .mf-label { display:block;font-size:0.7rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.4rem; }
        .mf-input,.mf-select {
          width:100%;padding:0.72rem 1rem;background:#f7f7f7;border:1.5px solid #e8e8e8;border-radius:10px;
          font-family:'Poppins',sans-serif;font-size:0.875rem;color:#1a1a2e;outline:none;transition:border-color 0.2s;
        }
        .mf-input:focus,.mf-select:focus{border-color:#e74c3c;background:#fff;box-shadow:0 0 0 3px rgba(231,76,60,0.1);}
        .mf-input::placeholder{color:#ccc;}
        .mf-row { display:grid;grid-template-columns:1fr 1fr;gap:0.9rem; }
        .mf-toggle { display:flex;align-items:center;gap:10px; }
        .mf-toggle-label{font-size:0.875rem;font-weight:500;color:#1a1a2e;}
        .mf-switch { position:relative;width:40px;height:22px;cursor:pointer; }
        .mf-switch input{opacity:0;width:0;height:0;}
        .mf-slider { position:absolute;inset:0;background:#e8e8e8;border-radius:22px;transition:background 0.2s; }
        .mf-slider::before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform 0.2s;}
        input:checked + .mf-slider{background:#e74c3c;}
        input:checked + .mf-slider::before{transform:translateX(18px);}
        .mf-error { background:#fff0ef;border:1px solid #ffc5c0;border-radius:10px;padding:0.65rem 1rem;font-size:0.8rem;color:#c0392b;font-weight:500; }
        .mf-foot { padding:0.85rem 1.5rem 1.25rem;display:flex;gap:0.75rem;justify-content:flex-end; }
        .mf-cancel { padding:0.6rem 1.3rem;border-radius:10px;border:1.5px solid #e8e8e8;background:transparent;font-family:'Poppins',sans-serif;font-size:0.85rem;color:#888;cursor:pointer; }
        .mf-save { padding:0.6rem 1.5rem;border-radius:10px;border:none;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-family:'Poppins',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:opacity 0.18s; }
        .mf-save:disabled{opacity:0.55;cursor:not-allowed;}
        .mf-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:6px;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div className="mf-overlay" onClick={onClose}>
        <div className="mf-modal" onClick={e => e.stopPropagation()}>
          <div className="mf-head">
            <span className="mf-title">{item ? 'Edit Menu Item' : 'Add New Item'}</span>
            <button className="mf-close" onClick={onClose}>✕</button>
          </div>
          <div className="mf-body">
            {error && <div className="mf-error">⚠️ {error}</div>}
            <div>
              <label className="mf-label">Item Name</label>
              <input className="mf-input" placeholder="e.g. Adobo Rice Meal" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="mf-label">Category</label>
              <select className="mf-select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="mf-row">
              <div>
                <label className="mf-label">Price (₱)</label>
                <input className="mf-input" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label className="mf-label">Stock</label>
                <input className="mf-input" type="number" placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mf-label">Image</label>
              <input className="mf-input" type="file" accept="image/*" onChange={e => set('image', e.target.files[0])} />
            </div>
            <div className="mf-toggle">
              <label className="mf-switch">
                <input type="checkbox" checked={form.is_available} onChange={e => set('is_available', e.target.checked)} />
                <span className="mf-slider" />
              </label>
              <span className="mf-toggle-label">{form.is_available ? 'Available' : 'Unavailable'}</span>
            </div>
          </div>
          <div className="mf-foot">
            <button className="mf-cancel" onClick={onClose}>Cancel</button>
            <button className="mf-save" onClick={handleSave} disabled={saving || !form.name || !form.price}>
              {saving && <span className="mf-spin" />}
              {saving ? 'Saving…' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}