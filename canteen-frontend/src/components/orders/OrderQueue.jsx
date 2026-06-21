import React, { useState, useCallback, useEffect } from 'react';
import orderService from '../../services/orderService';
import usePolling from '../../hooks/usePolling';
import ORDER_STATUS from '../../constants/orderStatus';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

const nextStatus = {
    Pending:   'Preparing',
    Preparing: 'Ready',
    Ready:     'Completed',
};

const nextLabel = {
    Pending:   'Cook',
    Preparing: 'Finish',
    Ready:     'Complete',
};

export default function OrderQueue() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [pulse, setPulse] = useState(false);
    const [updating, setUpdating] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'status_priority', direction: 'asc' });

    const fetchOrders = useCallback(async () => {
        try {
            const res = await orderService.getOrders();
            const priority = { Pending: 0, Preparing: 1, Ready: 2, Completed: 3, Cancelled: 4 };
            const withPriority = res.data.map(o => ({ ...o, status_priority: priority[o.status] ?? 9 }));
            setOrders(withPriority);
            setLastUpdate(new Date());
            setPulse(true);
            setTimeout(() => setPulse(false), 500);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    }, []);

    usePolling(fetchOrders, 5000);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await orderService.updateStatus(id, status);
            await fetchOrders();
        } catch {
            alert('Failed to update status.');
        } finally {
            setUpdating(null);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason) return;
        setUpdating(cancelOrderId);
        try {
            await orderService.cancelOrder(cancelOrderId, cancelReason);
            setCancelModalOpen(false);
            setCancelReason('');
            setCancelOrderId(null);
            await fetchOrders();
        } catch {
            alert('Failed to cancel order.');
        } finally {
            setUpdating(null);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60)   return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredOrders = orders.filter(o => 
        o.order_number?.toLowerCase().includes(search.toLowerCase()) || 
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.order_items?.some(item => item.menu_item?.name?.toLowerCase().includes(search.toLowerCase()))
    );

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const { key, direction } = sortConfig;
        let aVal = a[key];
        let bVal = b[key];
        
        if (key === 'user') {
            aVal = a.user?.name || '';
            bVal = b.user?.name || '';
        } else if (key === 'total_amount') {
            aVal = Number(a.total_amount);
            bVal = Number(b.total_amount);
        }
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
    const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="overflow-hidden border-border/50 shadow-sm relative group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 opacity-80 z-10"></div>
            
            <CardHeader className="flex flex-row items-start sm:items-center justify-between pb-4 border-b border-border/50">
                <div className="space-y-1 mt-1">
                    <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                        Order Queue
                    </CardTitle>
                    <CardDescription>
                        {lastUpdate ? `Updated ${timeAgo(lastUpdate.toISOString())}` : 'Loading...'}
                        {' · '}{orders.length} order{orders.length !== 1 ? 's' : ''}
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-auto">
                        <Input
                            type="text"
                            placeholder="Search order or customer..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-9 w-full sm:w-[250px] bg-background border-border/50 text-sm shadow-sm"
                        />
                    </div>

                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('order_number')}>
                                    Order {sortConfig.key === 'order_number' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('user')}>
                                    Customer {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Items</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('total_amount')}>
                                    Total {sortConfig.key === 'total_amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('status_priority')}>
                                    Status {sortConfig.key === 'status_priority' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="h-16">
                                            <div className="w-full h-8 bg-muted/50 animate-pulse rounded-md" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <p className="font-semibold text-sm">No orders yet</p>
                                            <p className="text-xs mt-1">New orders appear here automatically</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map(order => {
                                    const sc = ORDER_STATUS[order.status] || ORDER_STATUS.Pending;
                                    return (
                                        <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <div className="font-bold text-foreground text-sm tracking-tight">{order.order_number}</div>
                                                <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{order.created_at ? timeAgo(order.created_at) : ''}</div>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {order.user?.name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                                                    {order.order_items?.slice(0, 2).map((item, i) => (
                                                        <span key={i} className="truncate max-w-[180px]">{item.menu_item?.name || 'Item'} <strong className="text-foreground">×{item.quantity}</strong></span>
                                                    ))}
                                                    {order.order_items?.length > 2 && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">+{order.order_items.length - 2} more</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-extrabold text-primary text-sm">
                                                ₱{Number(order.total_amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <span 
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md"
                                                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                                                >
                                                    {order.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center justify-end">
                                                    {nextStatus[order.status] ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-8 text-xs font-bold shadow-sm"
                                                                disabled={updating === order.id}
                                                                onClick={() => {
                                                                    let target = nextStatus[order.status];
                                                                    if (order.status === 'Pending') {
                                                                        const requiresPrep = order.order_items?.some(i => i.menu_item?.requires_preparation !== false);
                                                                        if (!requiresPrep) target = 'Ready';
                                                                    }
                                                                    updateStatus(order.id, target);
                                                                }}
                                                            >
                                                                {updating === order.id ? 'Updating...' : (() => {
                                                                    if (order.status === 'Pending') {
                                                                        const requiresPrep = order.order_items?.some(i => i.menu_item?.requires_preparation !== false);
                                                                        return requiresPrep ? 'Cook' : 'Finish';
                                                                    }
                                                                    return nextLabel[order.status];
                                                                })()}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-8 text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                                                                disabled={updating === order.id}
                                                                onClick={() => {
                                                                    setCancelOrderId(order.id);
                                                                    setCancelReason('');
                                                                    setCancelModalOpen(true);
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : order.status === 'Cancelled' ? (
                                                        <span className="text-xs font-bold text-destructive px-2">CANCELLED</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-muted-foreground px-2">—</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {totalPages > 1 && (
                <div className="border-t border-border/50 p-4">
                    <Pagination>
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
                </div>
            )}

            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <DialogDescription>
                            Please select a reason for cancelling this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <select 
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        >
                            <option value="" disabled>Select a reason...</option>
                            <option value="Out of stock">Out of stock</option>
                            <option value="Customer changed mind">Customer changed mind</option>
                            <option value="Order error">Order error</option>
                            <option value="Payment issue">Payment issue</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Back</Button>
                        <Button 
                            variant="destructive" 
                            disabled={!cancelReason || updating === cancelOrderId}
                            onClick={handleCancelOrder}
                        >
                            {updating === cancelOrderId ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}