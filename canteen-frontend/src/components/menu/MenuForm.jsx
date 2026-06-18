import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function MenuForm({ item, categories, onClose, onSave, onSaved }) {
  const [form, setForm] = useState({ name: '', price: '', stock: '', category_id: '', is_available: true, image: null });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Accept both onSave and onSaved prop names
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Menu Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
              ⚠️ {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input 
              id="name"
              placeholder="e.g. Adobo Rice Meal" 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select 
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.category_id} 
              onChange={e => set('category_id', e.target.value)}
            >
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₱)</Label>
              <Input 
                id="price"
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={form.price} 
                onChange={e => set('price', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input 
                id="stock"
                type="number" 
                placeholder="0" 
                value={form.stock} 
                onChange={e => set('stock', e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input 
              id="image"
              type="file" 
              accept="image/*" 
              onChange={e => set('image', e.target.files[0])} 
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <button 
              type="button"
              role="switch"
              aria-checked={form.is_available}
              onClick={() => set('is_available', !form.is_available)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${form.is_available ? 'bg-primary' : 'bg-input'}`}
            >
              <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <Label className="font-medium cursor-pointer" onClick={() => set('is_available', !form.is_available)}>
              {form.is_available ? 'Available' : 'Unavailable'}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.price}>
            {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}