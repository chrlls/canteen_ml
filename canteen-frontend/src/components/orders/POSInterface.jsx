import React, { useState, useCallback } from 'react';
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
import { ShoppingCart, Plus, Minus, X, Flame, Store, ListOrdered, Loader2, Utensils } from 'lucide-react';

function POSInterface() {
    const [items, setItems] = useState([]);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [predictions, setPredictions] = useState({});
    const { cart, addToCart, removeFromCart, adjustQuantity, updateQuantity, clearCart, total } = useCart();
    const { user } = useAuth();

    // Fetch menu and refresh stock in real-time
    const fetchMenu = useCallback(() => {
        api.get('/menu').then(res => setItems(res.data.filter(i => i.is_available)));
        api.get('/predict').then(res => {
            const predMap = {};
            res.data.forEach(p => { predMap[p.menu_item_id] = p; });
            setPredictions(predMap);
        }).catch(() => {});
    }, []);

    const fetchOrderHistory = useCallback(() => {
        setLoadingHistory(true);
        orderService.getOrders()
            .then(res => setOrderHistory(res.data))
            .finally(() => setLoadingHistory(false));
    }, []);

    // Poll menu + predictions every 5s
    usePolling(fetchMenu, 5000);

    // Poll customer order history every 5s (skips for non-customers)
    usePolling(useCallback(() => {
        if (user?.role === 'customer') fetchOrderHistory();
    }, [user?.role, fetchOrderHistory]), 5000);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        setPlacingOrder(true);
        try {
            const payload = cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }));
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
                                🍔 Order Food
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
                                                onClick={() => addToCart(item)}
                                                className="group bg-card rounded-xl border border-border/60 p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden flex flex-col items-center justify-center text-center gap-2"
                                            >
                                                <div className="text-3xl transition-transform group-hover:scale-110">
                                                    <Utensils className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/70" />
                                                </div>
                                                <div className="w-full">
                                                    <p className="font-bold text-[13px] text-foreground leading-tight mb-1">{item.name}</p>
                                                    <p className="text-primary font-extrabold text-sm">₱{Number(item.price).toFixed(2)}</p>
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${item.stock > 10 ? 'text-success' : item.stock > 0 ? 'text-warning' : 'text-destructive'}`}>
                                                    {item.stock} in stock
                                                </p>
                                                
                                                {predictions[item.id]?.predicted_label === 'High Demand' && (
                                                    <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                                                        <Flame className="w-3 h-3" /> HOT
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
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : orderHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60">
                                            <ListOrdered className="w-12 h-12" />
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
                                    <ShoppingCart className="w-4 h-4" /> My Cart
                                </h2>
                            </div>

                            <ScrollArea className="flex-1 p-5">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60 min-h-[200px]">
                                        <ShoppingCart className="w-12 h-12" />
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
                                                        <Minus className="w-3 h-3" />
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
                                                        <Plus className="w-3 h-3" />
                                                    </LongPressBtn>
                                                </div>
                                                <button 
                                                    onClick={() => removeFromCart(item.id)} 
                                                    className="mt-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
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
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
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
    return (
        <Layout>
            <div className="flex flex-col gap-6 w-full h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Store className="w-6 h-6 text-primary" /> Orders Hub
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage POS transactions and active order tickets</p>
                    </div>
                </div>

                <Tabs defaultValue="pos" className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className="w-fit mb-4">
                        <TabsTrigger value="pos" className="font-bold flex items-center gap-2 px-6">
                            <ShoppingCart className="w-4 h-4" /> New Order
                        </TabsTrigger>
                        <TabsTrigger value="queue" className="font-bold flex items-center gap-2 px-6">
                            <ListOrdered className="w-4 h-4" /> Order Queue
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pos" className="flex-1 min-h-0 m-0 border-none p-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            {/* Menu Items (Left Side) */}
                            <div className="lg:col-span-2 flex flex-col min-h-0 bg-background/50 rounded-2xl border border-border/50 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="text-base font-bold text-foreground">Select Items</h2>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/20 text-[10px] font-bold text-success uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(39,174,96,0.6)]" />
                                        Stock Live
                                    </div>
                                </div>
                                
                                <ScrollArea className="flex-1 -mx-2 px-2 pb-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {items.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => addToCart(item)}
                                                className="group bg-card rounded-xl border border-border/60 p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden flex flex-col items-center justify-center text-center gap-2"
                                            >
                                                <div className="text-3xl transition-transform group-hover:scale-110">
                                                    <Utensils className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/70" />
                                                </div>
                                                <div className="w-full">
                                                    <p className="font-bold text-[13px] text-foreground leading-tight mb-1">{item.name}</p>
                                                    <p className="text-primary font-extrabold text-sm">₱{Number(item.price).toFixed(2)}</p>
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${item.stock > 10 ? 'text-success' : item.stock > 0 ? 'text-warning' : 'text-destructive'}`}>
                                                    {item.stock} in stock
                                                </p>
                                                
                                                {predictions[item.id]?.predicted_label === 'High Demand' && (
                                                    <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                                                        <Flame className="w-3 h-3" /> HOT
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Cart Sidebar (Right Side) */}
                            <Card className="flex flex-col h-full border-border/50 shadow-sm overflow-hidden">
                                <div className="bg-muted/30 px-5 py-4 border-b border-border/50">
                                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" /> Current Cart
                                    </h2>
                                </div>

                                <ScrollArea className="flex-1 p-5">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-60 min-h-[200px]">
                                            <ShoppingCart className="w-12 h-12" />
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
                                                            <Minus className="w-3 h-3" />
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
                                                            <Plus className="w-3 h-3" />
                                                        </LongPressBtn>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeFromCart(item.id)} 
                                                        className="mt-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
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
                                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                        ) : (
                                            'Place Order'
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="queue" className="flex-1 min-h-0 m-0 border-none p-0 outline-none h-full">
                        <ScrollArea className="h-full">
                            <OrderQueue />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
            </div>
        </Layout>
    );
}

export default POSInterface;