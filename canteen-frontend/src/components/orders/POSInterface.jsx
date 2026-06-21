import React, { useState, useCallback, useRef } from 'react';


import Layout from '../common/Layout';
import OrderQueue from './OrderQueue';
import OrderReceipt from './OrderReceipt';
import LongPressBtn from '../common/LongPressBtn';
import api from '../../services/api';
import orderService from '../../services/orderService';
import usePolling from '../../hooks/usePolling';
import ORDER_STATUS from '../../constants/orderStatus';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import { ShoppingCart, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

function useDragScroll() {
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(Date.now());
    const lastX = useRef(0);
    const animationFrameId = useRef(null);
    const containerRef = useRef(null);
    const hasDragged = useRef(false);

    const momentumLoop = () => {
        if (isDown.current) return;
        if (Math.abs(velocity.current) > 0.5) {
            if (containerRef.current) {
                containerRef.current.scrollLeft -= velocity.current;
            }
            velocity.current *= 0.94; // Friction
            animationFrameId.current = requestAnimationFrame(momentumLoop);
        } else {
            velocity.current = 0;
        }
    };

    const onMouseDown = (e) => {
        isDown.current = true;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        const container = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]') || e.currentTarget;
        containerRef.current = container;
        startX.current = e.pageX - container.offsetLeft;
        scrollLeft.current = container.scrollLeft;
        lastX.current = e.pageX;
        lastTime.current = Date.now();
        velocity.current = 0;
        hasDragged.current = false;
    };

    const onMouseLeave = () => { 
        if (!isDown.current) return;
        isDown.current = false; 
        momentumLoop();
    };

    const onMouseUp = () => { 
        isDown.current = false; 
        momentumLoop();
        // We do NOT reset hasDragged here so onClickCapture can intercept the click event
    };

    const onMouseMove = (e) => {
        if (!isDown.current) return;
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        container.scrollLeft = scrollLeft.current - walk;

        const now = Date.now();
        const dt = now - lastTime.current;
        if (dt > 0) {
            const dx = e.pageX - lastX.current;
            if (Math.abs(dx) > 2 || Math.abs(walk) > 5) {
                hasDragged.current = true;
            }
            // Negative because scrolling left means positive dx but we want the scrollLeft to go down
            velocity.current = dx / dt * 15; 
        }
        lastX.current = e.pageX;
        lastTime.current = now;
    };

    const onClickCapture = (e) => {
        if (hasDragged.current) {
            e.stopPropagation();
            e.preventDefault();
            hasDragged.current = false;
        }
    };

    return { onMouseDown, onMouseLeave, onMouseUp, onMouseMove, onClickCapture };
}

export default function POSInterface() {
    const [items, setItems] = useState([]);
    const dragScrollProps = useDragScroll();
    const [completedOrder, setCompletedOrder] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [predictions, setPredictions] = useState({});
    
    // UI States for Redesign
    const [selectedCategory, setSelectedCategory] = useState('All Menu');
    const [orderType, setOrderType] = useState('Take Away');
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    const { cart, addToCart, removeFromCart, adjustQuantity, updateQuantity, clearCart, total } = useCart();
    const { user } = useAuth();
    const { notify } = useToast();

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    
    const [allOrdersModalOpen, setAllOrdersModalOpen] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderPage, setOrderPage] = useState(1);
    const ordersPerPage = 10;
    
    const [menuSearch, setMenuSearch] = useState('');

    const prevOrdersRef = useRef([]);

    // Fetch menu and refresh stock in real-time
    const fetchMenu = useCallback(() => {
        api.get('/menu').then(res => setItems(res.data.filter(i => i.is_available)));
        api.get('/predict').then(res => {
            const predMap = {};
            res.data.forEach(p => { predMap[p.menu_item_id] = p; });
            setPredictions(predMap);
        }).catch(() => { });
    }, []);

    const fetchOrderHistory = useCallback(() => {
        setLoadingHistory(true);
        orderService.getOrders()
            .then(res => {
                const newOrders = res.data;
                if (user?.role === 'customer' && prevOrdersRef.current.length > 0) {
                    newOrders.forEach(newOrder => {
                        const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
                        if (oldOrder && oldOrder.status !== newOrder.status) {
                            if (newOrder.status === 'Preparing') {
                                notify(`Order #${newOrder.order_number} is now being processed!`, 'info');
                            } else if (newOrder.status === 'Ready') {
                                notify(`Order #${newOrder.order_number} is ready for pick up!`, 'success');
                            }
                        }
                    });
                }
                prevOrdersRef.current = newOrders;
                setOrderHistory(newOrders);
            })
            .finally(() => setLoadingHistory(false));
    }, [user?.role, notify]);

    // Poll menu + predictions every 5s
    usePolling(fetchMenu, 5000);

    // Poll order history every 5s (Admin sees all, Customer sees theirs)
    usePolling(fetchOrderHistory, 5000);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        setPlacingOrder(true);
        try {
            const payload = { 
                items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity })),
                order_type: orderType 
            };
            const res = await orderService.placeOrder(payload);
            setCompletedOrder(res.data);
            clearCart();
            // Immediately refresh menu stock and order history after placing order
            fetchMenu();
            if (user?.role === 'customer') fetchOrderHistory();
        } catch (err) {
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };


    // ─── Unified POS View ───
    
    // Filter out only active orders for the top queue
    const activeOrders = orderHistory.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status));
    
    // Extract unique categories from items
    const categories = ['All Menu', ...new Set(items.map(i => i.category?.name || 'Food'))];
    
    // Filter items based on selected category and search query
    const filteredItems = items.filter(i => {
        const matchCategory = selectedCategory === 'All Menu' || (i.category?.name || 'Food') === selectedCategory;
        const matchSearch = i.name.toLowerCase().includes(menuSearch.toLowerCase());
        return matchCategory && matchSearch;
    });

    // Status progression logic
    const nextStatus = { Pending: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };
    const nextLabel = { Pending: 'Cook', Preparing: 'Finish', Ready: 'Complete' };

    const handleUpdateStatus = async (e, order) => {
        e.stopPropagation();
        
        let target = nextStatus[order.status];
        if (order.status === 'Pending') {
            const requiresPrep = order.order_items?.some(item => item.menu_item?.requires_preparation !== false);
            if (!requiresPrep) target = 'Ready';
        }

        if (!target) return;
        try {
            await orderService.updateStatus(order.id, target);
            fetchOrderHistory();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason) return;
        try {
            await orderService.cancelOrder(cancelOrderId, cancelReason);
            setCancelModalOpen(false);
            setCancelReason('');
            setCancelOrderId(null);
            fetchOrderHistory();
        } catch {
            alert('Failed to cancel order.');
        }
    };

    return (
        <>
        <Layout hideNavbar={true}>
            <div className="flex flex-col xl:flex-row gap-6 w-full h-[calc(100vh-3rem)] min-h-0">
                {/* Left Side: Order List & Menu */}
                <div className="flex-1 flex flex-col gap-6 min-h-0 min-w-0">
                    {/* Top Section: Active Orders */}
                    <div className="flex flex-col gap-2 shrink-0">
                    {/* Horizontal Order Queue */}
                    <div className="w-full">
                        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            {user?.role === 'customer' ? 'My Active Orders' : 'Order List'} 
                            <button 
                                onClick={() => setAllOrdersModalOpen(true)}
                                className="text-muted-foreground text-xs font-normal hover:text-primary hover:underline transition-colors focus:outline-none"
                            >
                                ({activeOrders.length} Items)
                            </button>
                        </h2>
                        <ScrollArea 
                            className="w-full whitespace-nowrap pb-4 select-none cursor-grab active:cursor-grabbing"
                            onWheel={(e) => {
                                const container = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
                                if (container) container.scrollLeft += e.deltaY;
                            }}
                            {...dragScrollProps}
                        >
                            <div className="flex w-max gap-4 p-2">
                                {activeOrders.map(order => (
                                    <div 
                                        key={order.id} 
                                        onClick={() => setCompletedOrder(order)}
                                        className="w-[280px] bg-card rounded-2xl border border-border/50 p-4 shadow-sm flex flex-col gap-3 shrink-0 cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                                <span className="font-bold text-sm text-foreground">Order #{order.order_number || order.id}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">#{order.order_number || order.id.toString().padStart(3, '0')}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>{order.order_items?.length || 0} Items • {order.order_type || 'Take Away'}</p>
                                            <p className="truncate text-foreground font-medium">
                                                {order.order_items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex justify-between items-center pt-2">
                                            {user?.role === 'customer' ? (
                                                <div className="flex gap-2">
                                                    <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${order.status === 'Pending' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                        {order.status}
                                                    </span>
                                                    {order.status === 'Pending' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCancelOrderId(order.id);
                                                                // Fast-track cancellation reason for customers
                                                                setCancelReason('Customer changed mind');
                                                                setCancelModalOpen(true);
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant={order.status === 'Pending' ? 'destructive' : 'default'}
                                                        className={`h-7 px-4 text-[10px] font-bold uppercase tracking-wider rounded-md ${order.status === 'Pending' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20' : 'bg-success/10 text-success hover:bg-success/20 border-success/20'} border`}
                                                        onClick={(e) => handleUpdateStatus(e, order)}
                                                    >
                                                        {(() => {
                                                            if (order.status === 'Pending') {
                                                                const requiresPrep = order.order_items?.some(i => i.menu_item?.requires_preparation !== false);
                                                                return requiresPrep ? 'Cook' : 'Finish';
                                                            }
                                                            return nextLabel[order.status];
                                                        })()}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost"
                                                        className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCancelOrderId(order.id);
                                                            setCancelReason('');
                                                            setCancelModalOpen(true);
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                            <span className="font-bold text-sm text-foreground">₱{Number(order.total_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                {activeOrders.length === 0 && (
                                    <div className="w-[280px] h-[120px] flex items-center justify-center border border-dashed border-border/50 rounded-2xl text-muted-foreground text-sm font-medium">
                                        No active orders
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                Menu <span className="text-muted-foreground text-sm font-normal">({filteredItems.length} Items)</span>
                            </h2>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search menu..." 
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    className="w-full sm:w-64 h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                        </div>

                        {/* Category Filters */}
                        <ScrollArea 
                            className="w-full whitespace-nowrap mb-6 shrink-0 pb-2 select-none cursor-grab active:cursor-grabbing"
                            onWheel={(e) => {
                                const container = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
                                if (container) container.scrollLeft += e.deltaY;
                            }}
                            {...dragScrollProps}
                        >
                            <div className="flex w-max gap-3">
                                {categories.map(cat => {
                                    const isSelected = selectedCategory === cat;
                                    const count = cat === 'All Menu' ? items.length : items.filter(i => (i.category?.name || 'Food') === cat).length;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`flex flex-col items-center justify-center px-6 py-2 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'}`}
                                        >
                                            <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{cat}</span>
                                            <span className={`text-[10px] font-medium ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>({count} Items)</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Menu Grid */}
                        <ScrollArea className="flex-1 -mx-2 px-2 pb-2">
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => item.stock > 0 && addToCart(item)}
                                        className={`group bg-card rounded-2xl border border-border/60 cursor-pointer transition-all relative overflow-hidden flex flex-col h-full ${item.stock > 0 ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-70 grayscale-[0.5]'}`}
                                    >
                                        {/* Image Area */}
                                        <div className="w-full h-28 bg-background flex items-center justify-center p-3">
                                            {item.image ? (
                                                <img
                                                    src={`${process.env.REACT_APP_API_BASE_URL}/storage/${item.image}`}
                                                    alt={item.name}
                                                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <div className="text-3xl text-muted-foreground/30 transition-transform group-hover:scale-110" style={{ display: item.image ? 'none' : 'flex' }}>
                                                🍽️
                                            </div>
                                        </div>

                                        {/* Details Area */}
                                        <div className="p-3 flex flex-col flex-1 bg-background border-t border-border/30">
                                            <p className="font-bold text-xs text-foreground leading-tight mb-2 text-left line-clamp-2">{item.name}</p>

                                            <div className="mt-auto flex items-center justify-between">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${(item.category?.name?.toLowerCase().includes('drink') || item.category?.name?.toLowerCase().includes('beverage')) ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                                                    {item.category?.name || 'Food'}
                                                </span>
                                                <span className="font-extrabold text-foreground text-sm">₱{Number(item.price).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* HOT Badge */}
                                        {predictions[item.id]?.predicted_label === 'High Demand' && (
                                            <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm z-10">
                                                HOT
                                            </div>
                                        )}

                                        {/* Out of Stock */}
                                        {item.stock <= 0 && (
                                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20 cursor-not-allowed">
                                                <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">Sold Out</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Mobile Floating Cart Button */}
                {!mobileCartOpen && cart.length > 0 && (
                    <div className="xl:hidden fixed bottom-6 right-6 z-30 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                        <Button 
                            onClick={() => setMobileCartOpen(true)} 
                            className="h-12 rounded-full shadow-lg px-5 flex items-center gap-3 bg-foreground hover:bg-foreground/90 text-background font-medium tracking-wide transition-all"
                        >
                            <ShoppingCart size={18} />
                            <span className="text-sm">{cart.length} {cart.length === 1 ? 'Item' : 'Items'}</span>
                            <span className="text-sm font-bold border-l border-background/30 pl-3">₱{(total || 0).toFixed(2)}</span>
                        </Button>
                    </div>
                )}

                {/* Mobile Cart Overlay Backdrop */}
                {mobileCartOpen && (
                    <div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 xl:hidden animate-in fade-in duration-300"
                        onClick={() => setMobileCartOpen(false)}
                    />
                )}

                {/* Cart Sidebar (Right Side - Narrower) */}
                <div className={`fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[340px] transform transition-transform duration-300 ease-in-out xl:relative xl:transform-none xl:w-auto xl:flex shrink-0 h-full ${mobileCartOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
                    <Card className="flex flex-col w-full xl:w-[320px] h-full border-l xl:border border-border/50 shadow-2xl xl:shadow-sm overflow-hidden bg-card rounded-none xl:rounded-xl">
                        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-background shrink-0">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Current Order
                            </h2>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={clearCart}>
                                    <span className="text-sm">🗑️</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 xl:hidden text-foreground bg-muted hover:bg-muted/80 rounded-full" onClick={() => setMobileCartOpen(false)}>
                                    <X size={14} />
                                </Button>
                            </div>
                        </div>

                        {/* Order Type Toggle */}
                        <div className="px-3 py-2 border-b border-border/50 flex gap-1 bg-muted/20">
                            <button
                                onClick={() => setOrderType('Take Away')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${orderType === 'Take Away' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                            >
                                Take Away
                            </button>
                            <button
                                onClick={() => setOrderType('Dine In')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${orderType === 'Dine In' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                            >
                                Dine In
                            </button>
                        </div>

                        <ScrollArea className="flex-1 p-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60 min-h-[200px]">
                                    <p className="text-xs font-medium">Cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col gap-2 group p-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                            <div className="flex items-center gap-2">
                                                {/* Thumbnail Image */}
                                                <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.image ? (
                                                        <img src={`${process.env.REACT_APP_API_BASE_URL}/storage/${item.image}`} alt={item.name} className="w-full h-full object-contain p-0.5" />
                                                    ) : (
                                                        <span className="text-[10px]">🍽️</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-primary">₱{Number(item.price).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-muted-foreground hover:text-destructive font-bold underline underline-offset-2">
                                                    Remove
                                                </button>
                                                <div className="flex items-center gap-1.5 bg-background rounded-md p-0.5 border border-border/50">
                                                    <LongPressBtn onTrigger={() => adjustQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground transition-colors">
                                                        <span className="text-[10px] font-bold">-</span>
                                                    </LongPressBtn>
                                                    
                                                    <input
                                                        type="number"
                                                        value={item.quantity === '' ? '' : item.quantity}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '') {
                                                                updateQuantity(item.id, '');
                                                            } else {
                                                                const parsed = parseInt(val);
                                                                if (!isNaN(parsed) && parsed > 0) {
                                                                    updateQuantity(item.id, parsed);
                                                                }
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                                                                updateQuantity(item.id, 1);
                                                            }
                                                        }}
                                                        className="w-5 text-center text-[10px] font-bold bg-transparent border-none focus:ring-0 p-0 m-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />

                                                    <LongPressBtn onTrigger={() => adjustQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground transition-colors">
                                                        <span className="text-[10px] font-bold">+</span>
                                                    </LongPressBtn>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-4 bg-muted/10 border-t border-border/50 space-y-3">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-muted-foreground font-medium">
                                    <span>Sub Total</span>
                                    <span>₱{(total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground font-medium">
                                    <span>Tax (0%)</span>
                                    <span>₱0.00</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm font-extrabold text-foreground">
                                <span>Total</span>
                                <span className="text-lg">₱{(total || 0).toFixed(2)}</span>
                            </div>

                            <div className="pt-2 space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Method</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 border border-border/50 rounded-md bg-background hover:border-primary transition-colors flex justify-center items-center">
                                        <span className="text-xs">💳</span>
                                    </button>
                                    <button className="flex-1 py-1.5 border border-primary bg-primary/5 rounded-md transition-colors flex justify-center items-center">
                                        <span className="text-xs font-bold text-primary">CASH</span>
                                    </button>
                                    <button className="flex-1 py-1.5 border border-border/50 rounded-md bg-background hover:border-primary transition-colors flex justify-center items-center">
                                        <span className="text-xs font-bold">QR</span>
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || placingOrder}
                                className="w-full h-10 text-sm font-bold shadow-md mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {placingOrder ? 'Processing...' : 'Place Order'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
            
            {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
        </Layout>

        {/* Cancel Modal */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription>
                        {user?.role === 'customer' 
                            ? 'Are you sure you want to cancel this order?' 
                            : 'Please select a reason for cancelling this order.'}
                    </DialogDescription>
                </DialogHeader>
                {user?.role !== 'customer' && (
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
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Back</Button>
                    <Button 
                        variant="destructive" 
                        disabled={!cancelReason}
                        onClick={handleCancelOrder}
                    >
                        Confirm Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* All Orders Modal */}
        <Dialog open={allOrdersModalOpen} onOpenChange={setAllOrdersModalOpen}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>All Orders</DialogTitle>
                    <DialogDescription>
                        View all your orders, including cancelled and completed ones.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <input 
                        type="text" 
                        placeholder="Search by Order # or Status..." 
                        value={orderSearch}
                        onChange={(e) => {
                            setOrderSearch(e.target.value);
                            setOrderPage(1);
                        }}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    
                    <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                        <div className="space-y-3 pr-4">
                            {(() => {
                                const searchLower = orderSearch.toLowerCase();
                                const filteredOrders = orderHistory.filter(o => 
                                    o.order_number?.toLowerCase().includes(searchLower) || 
                                    o.id.toString().includes(searchLower) ||
                                    o.status.toLowerCase().includes(searchLower)
                                );
                                
                                const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
                                const startIndex = (orderPage - 1) * ordersPerPage;
                                const displayedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

                                if (filteredOrders.length === 0) {
                                    return <p className="text-center text-muted-foreground py-8">No orders found.</p>;
                                }

                                return (
                                    <>
                                        {displayedOrders.map(order => (
                                            <div key={order.id} className="bg-card border border-border/50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold">Order #{order.order_number || order.id}</span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${order.status === 'Cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' : order.status === 'Completed' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {order.order_items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-extrabold text-foreground">₱{Number(order.total_amount).toFixed(2)}</p>
                                                    <p className="text-[10px] text-muted-foreground">{order.order_type || 'Take Away'}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 pb-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    disabled={orderPage === 1}
                                                    onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                    Page {orderPage} of {totalPages}
                                                </span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    disabled={orderPage === totalPages}
                                                    onClick={() => setOrderPage(p => Math.min(totalPages, p + 1))}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}