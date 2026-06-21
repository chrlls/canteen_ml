import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import api from '../../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

export default function InventoryTable() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Adjust modal
    const [adjustId, setAdjustId] = useState(null);
    const [adjustItem, setAdjustItem] = useState(null);
    const [form, setForm] = useState({ quantity_change: '', reason: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Add Product modal
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', price: '', stock: '', category_id: '', is_available: true });
    const [addSaving, setAddSaving] = useState(false);
    const [addError, setAddError] = useState('');

    const fetchItems = () => {
        setLoading(true);
        api.get('/inventory')
            .then(res => setItems(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchItems();
        api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
    }, []);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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

    const sortedItems = [...filtered].sort((a, b) => {
        const { key, direction } = sortConfig;
        let aVal = a[key];
        let bVal = b[key];
        
        if (key === 'category') {
            aVal = a.category?.name || '';
            bVal = b.category?.name || '';
        }
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination logic
    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const lowCount = items.filter(i => i.stock < 10).length;

    const stockColor = (stock) => {
        if (stock <= 0) return { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Out' };
        if (stock < 5)  return { color: 'text-red-700', bg: 'bg-red-700/10', label: 'Critical' };
        if (stock < 10) return { color: 'text-warning', bg: 'bg-warning/10', label: 'Low' };
        if (stock < 30) return { color: 'text-success', bg: 'bg-success/10', label: 'Good' };
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'High' };
    };

    return (
        <Layout hideNavbar={true}>
            <div className="flex flex-col gap-6 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[#1e293b]">
                            Inventory Management
                        </h1>
                        <p className="text-[15px] font-medium text-slate-500/90 mt-1.5 tracking-wide">Manage stock levels and view adjustment history</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lowCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive text-xs font-bold whitespace-nowrap border border-destructive/20">
                                ⚠️ {lowCount} Low Stock
                            </div>
                        )}
                        <Button onClick={() => setShowAdd(true)} className="font-bold shadow-sm">
                            + Add Product
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Stock Overview</span>
                    <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-background border-border/50 text-base shadow-sm"
                    />
                </div>

                {/* Table Card */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                                        Item {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('category')}>
                                        Category {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('stock')}>
                                        Stock {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('is_available')}>
                                        Availability {sortConfig.key === 'is_available' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                    </TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6} className="h-16">
                                                <div className="w-full h-8 bg-muted/50 animate-pulse rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : paginatedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <p className="font-medium text-sm">No items found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedItems.map(item => {
                                        const s = stockColor(item.stock);
                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="font-bold text-foreground text-sm">{item.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground font-medium">{item.category?.name || '—'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`font-extrabold text-base ${s.color}`}>{item.stock}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.color}`}>
                                                        {s.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.is_available ? 'bg-success/15 text-success border border-success/20' : 'bg-destructive/15 text-destructive border border-destructive/20'}`}>
                                                        {item.is_available ? '● Available' : '○ Unavailable'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" className="font-semibold text-xs border-border/50 h-8" onClick={() => openAdjust(item)}>
                                                        Adjust Stock
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} 
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink 
                                        href="#" 
                                        isActive={currentPage === i + 1}
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} 
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}

                {/* Adjust Stock Dialog */}
                <Dialog open={!!adjustId} onOpenChange={(open) => !open && closeAdjust()}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Adjust Stock</DialogTitle>
                            <DialogDescription>
                                {adjustItem?.name} — Current stock: <strong className="text-destructive font-bold">{adjustItem?.stock}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdjust}>
                            <div className="grid gap-4 py-4">
                                {error && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">⚠️ {error}</div>}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity_change">Quantity Change</Label>
                                    <Input
                                        id="quantity_change"
                                        type="number"
                                        placeholder="e.g. 10 to add, -5 to remove"
                                        value={form.quantity_change}
                                        onChange={e => setForm({ ...form, quantity_change: e.target.value })}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">Use positive to restock, negative to reduce</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Input
                                        id="reason"
                                        type="text"
                                        placeholder="e.g. Restock, Spoilage, Manual count..."
                                        value={form.reason}
                                        onChange={e => setForm({ ...form, reason: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeAdjust}>Cancel</Button>
                                <Button type="submit" disabled={saving || !form.quantity_change || !form.reason}>
                                    {saving ? 'Saving...' : 'Apply Adjustment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add Product Dialog */}
                <Dialog open={showAdd} onOpenChange={(open) => !open && closeAdd()}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Product</DialogTitle>
                            <DialogDescription>Add a new item to inventory</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct}>
                            <div className="grid gap-4 py-4">
                                {addError && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">⚠️ {addError}</div>}
                                <div className="space-y-2">
                                    <Label htmlFor="add_name">Product Name</Label>
                                    <Input
                                        id="add_name"
                                        type="text"
                                        placeholder="e.g. Chicken Adobo"
                                        value={addForm.name}
                                        onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="add_price">Price (₱)</Label>
                                        <Input
                                            id="add_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={addForm.price}
                                            onChange={e => setAddForm({ ...addForm, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add_stock">Initial Stock</Label>
                                        <Input
                                            id="add_stock"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={addForm.stock}
                                            onChange={e => setAddForm({ ...addForm, stock: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add_cat">Category</Label>
                                    <select
                                        id="add_cat"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                <div className="flex items-center space-x-2 mt-2">
                                    <button 
                                        type="button"
                                        role="switch"
                                        aria-checked={addForm.is_available}
                                        onClick={() => setAddForm({ ...addForm, is_available: !addForm.is_available })}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${addForm.is_available ? 'bg-primary' : 'bg-input'}`}
                                    >
                                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${addForm.is_available ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <Label className="font-medium cursor-pointer" onClick={() => setAddForm({ ...addForm, is_available: !addForm.is_available })}>
                                        Mark as Available
                                    </Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeAdd}>Cancel</Button>
                                <Button type="submit" disabled={addSaving || !addForm.name || !addForm.price || !addForm.stock || !addForm.category_id}>
                                    {addSaving ? 'Adding...' : 'Add Product'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}