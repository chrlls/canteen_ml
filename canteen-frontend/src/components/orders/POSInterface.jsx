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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

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

    const { cart, addToCart, removeFromCart, adjustQuantity, updateQuantity, clearCart, total } = useCart();
    const { user } = useAuth();

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
            .then(res => setOrderHistory(res.data))
            .finally(() => setLoadingHistory(false));
    }, []);

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


    // ─── Customer View ───
    if (user?.role === 'customer') {
        return (
            <Layout>
                <div className="flex flex-col gap-6 w-full h-[calc(100vh-8rem)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                Order Food
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Select items to add to your cart</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/20 text-[10px] font-bold text-success uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(39,174,96,0.6)]" />
                            Live
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6">
                        {/* Main Content (Menu + History) */}
                        <div className="flex-1 flex flex-col min-h-0 gap-6">

                            {/* Menu Grid */}
                            <div className="flex flex-col bg-background/50 rounded-2xl border border-border/50 p-4 shadow-sm flex-1 min-h-0">
                                <h2 className="text-base font-bold text-foreground mb-4 px-1">Menu Items</h2>
                                <ScrollArea className="flex-1 -mx-2 px-2 pb-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {items.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => item.stock > 0 && addToCart(item)}
                                                className={`group bg-card rounded-2xl border border-border/60 cursor-pointer transition-all relative overflow-hidden flex flex-col h-full ${item.stock > 0 ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-70 grayscale-[0.5]'}`}
                                            >
                                                {/* Image Area */}
                                                <div className="w-full h-32 bg-muted/40 flex items-center justify-center p-4">
                                                    {item.image ? (
                                                        <img
                                                            src={`${process.env.REACT_APP_API_BASE_URL}/storage/${item.image}`}
                                                            alt={item.name}
                                                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                                                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <div className="text-4xl text-muted-foreground/30 transition-transform group-hover:scale-110" style={{ display: item.image ? 'none' : 'flex' }}>
                                                        🍽️
                                                    </div>
                                                </div>

                                                {/* Details Area */}
                                                <div className="p-3 flex flex-col flex-1 bg-background">
                                                    <p className="font-bold text-[13px] text-foreground leading-tight mb-2 text-left truncate">{item.name}</p>

                                                    <div className="mt-auto flex items-center justify-between">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${(item.category?.name?.toLowerCase().includes('drink') || item.category?.name?.toLowerCase().includes('beverage')) ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                                                            {item.category?.name || 'Food'}
                                                        </span>
                                                        <span className="font-extrabold text-foreground text-sm">₱{Number(item.price).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* HOT Badge */}
                                                {predictions[item.id]?.predicted_label === 'High Demand' && (
                                                    <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                                                        HOT
                                                    </div>
                                                )}

                                                {/* Out of Stock Overlay */}
                                                {item.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20 cursor-not-allowed">
                                                        <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">Sold Out</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Order History */}
                            <div className="flex flex-col bg-background/50 rounded-2xl border border-border/50 p-4 shadow-sm h-64 shrink-0">
                                <h2 className="text-base font-bold text-foreground mb-4 px-1">My Orders</h2>
                                <ScrollArea className="flex-1 -mx-2 px-2 pb-2">
                                    {loadingHistory ? (
                                        <div className="flex items-center justify-center h-full">
                                            <span className="text-sm font-bold">Loading...</span>
                                        </div>
                                    ) : orderHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60">
                                            <p className="text-sm font-medium">No orders yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orderHistory.map(order => {
                                                const sc = ORDER_STATUS[order.status] || ORDER_STATUS.Pending;
                                                return (
                                                    <div key={order.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm">
                                                        <div>
                                                            <div className="font-bold text-foreground text-sm tracking-tight">{order.order_number}</div>
                                                            <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                                                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                                                            {order.order_items?.length || 0} item(s)
                                                        </div>
                                                        <div className="font-extrabold text-primary text-sm">
                                                            ₱{Number(order.total_amount).toFixed(2)}
                                                        </div>
                                                        <div>
                                                            <span
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md"
                                                                style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                                                            >
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Cart Sidebar (Right Side) */}
                        <Card className="flex flex-col w-full xl:w-[320px] h-full shrink-0 border-border/50 shadow-sm overflow-hidden">
                            <div className="bg-muted/30 px-5 py-4 border-b border-border/50">
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                    My Cart
                                </h2>
                            </div>

                            <ScrollArea className="flex-1 p-5">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60 min-h-[200px]">
                                        <p className="text-sm font-medium">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex items-start justify-between gap-3 group">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                                                    <p className="text-xs font-bold text-primary">₱{Number(item.price).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border/50">
                                                    <LongPressBtn
                                                        onTrigger={() => adjustQuantity(item.id, -1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-md bg-background shadow-sm hover:bg-muted text-foreground transition-colors"
                                                    >
                                                        <span className="text-xs font-bold">-</span>
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
                                                        className="w-8 text-center text-xs font-bold bg-transparent border-none focus:ring-0 p-0 m-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <LongPressBtn
                                                        onTrigger={() => adjustQuantity(item.id, 1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-md bg-background shadow-sm hover:bg-muted text-foreground transition-colors"
                                                    >
                                                        <span className="text-xs font-bold">+</span>
                                                    </LongPressBtn>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="mt-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Remove</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="p-5 bg-muted/10 border-t border-border/50 space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                                    <span>Total Amount</span>
                                    <span className="text-xl font-extrabold text-foreground tracking-tight">₱{(total || 0).toFixed(2)}</span>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={cart.length === 0 || placingOrder}
                                    className="w-full h-12 text-base font-bold shadow-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                                    {placingOrder ? (
                                        <>Processing...</>
                                    ) : (
                                        'Place Order'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
                </div>
            </Layout>
        );
    }

    // ─── Admin / Cashier POS View ───
    
    // Filter out only active orders for the top queue
    const activeOrders = orderHistory.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status));
    
    // Extract unique categories from items
    const categories = ['All Menu', ...new Set(items.map(i => i.category?.name || 'Food'))];
    
    // Filter items based on selected category
    const filteredItems = selectedCategory === 'All Menu' 
        ? items 
        : items.filter(i => (i.category?.name || 'Food') === selectedCategory);

    // Status progression logic
    const nextStatus = { Pending: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };
    const nextLabel = { Pending: 'Cook', Preparing: 'Finish', Ready: 'Complete' };

    const handleUpdateStatus = async (e, orderId, currentStatus) => {
        e.stopPropagation();
        const target = nextStatus[currentStatus];
        if (!target) return;
        try {
            await orderService.updateStatus(orderId, target);
            fetchOrderHistory();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <Layout hideNavbar={true}>
            <div className="flex flex-col xl:flex-row gap-6 w-full h-[calc(100vh-3rem)] min-h-0">
                {/* Left Side: Order List & Menu */}
                <div className="flex-1 flex flex-col gap-6 min-h-0 min-w-0">
                    {/* Top Section: Active Orders */}
                    <div className="flex flex-col gap-2 shrink-0">
                    {/* Horizontal Order Queue */}
                    <div className="w-full">
                        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            Order List <span className="text-muted-foreground text-xs font-normal">({activeOrders.length} Items)</span>
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
                                                <span className="font-bold text-sm text-foreground">Order #{order.id}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">#{order.id.toString().padStart(3, '0')}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>{order.order_items?.length || 0} Items • {order.order_type || 'Take Away'}</p>
                                            <p className="truncate text-foreground font-medium">
                                                {order.order_items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex justify-between items-center pt-2">
                                            <Button 
                                                size="sm" 
                                                variant={order.status === 'Pending' ? 'destructive' : 'default'}
                                                className={`h-7 px-4 text-[10px] font-bold uppercase tracking-wider rounded-md ${order.status === 'Pending' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20' : 'bg-success/10 text-success hover:bg-success/20 border-success/20'} border`}
                                                onClick={(e) => handleUpdateStatus(e, order.id, order.status)}
                                            >
                                                {nextLabel[order.status] || order.status}
                                            </Button>
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
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                Menu <span className="text-muted-foreground text-sm font-normal">({items.length} Items)</span>
                            </h2>
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

                {/* Cart Sidebar (Right Side - Narrower) */}
                <div className="shrink-0 h-full">
                    <Card className="flex flex-col w-full xl:w-[320px] h-full border-border/50 shadow-sm overflow-hidden bg-card/50">
                        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-background">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Current Order
                            </h2>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={clearCart}>
                                <span className="text-xs">🗑️</span>
                            </Button>
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
                                className="w-full h-10 text-sm font-bold shadow-md mt-2 bg-success hover:bg-success/90 text-success-foreground"
                            >
                                {placingOrder ? 'Processing...' : 'Place Order'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
            
            {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
        </Layout>
    );
}