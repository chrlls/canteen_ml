import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../common/Layout';
import OrderQueue from './OrderQueue';
import OrderReceipt from './OrderReceipt';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const LongPressBtn = ({ onTrigger, className, children }) => {
    const timerRef = React.useRef(null);
    const intervalRef = React.useRef(null);

    const startPress = (e) => {
        e.preventDefault();
        onTrigger();
        timerRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                onTrigger();
            }, 50); // fast repeat
        }, 400); 
    };

    const stopPress = () => {
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
    };

    return (
        <button
            className={className}
            onMouseDown={startPress}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={startPress}
            onTouchEnd={stopPress}
        >
            {children}
        </button>
    );
};

function POSInterface() {
    const [items, setItems] = useState([]);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [predictions, setPredictions] = useState({});
    const { cart, addToCart, removeFromCart, adjustQuantity, clearCart, total } = useCart();
    const { user } = useAuth();

    // ✅ Fetch menu and refresh stock in real-time
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
        api.get('/orders')
            .then(res => setOrderHistory(res.data))
            .finally(() => setLoadingHistory(false));
    }, []);

    useEffect(() => {
        fetchMenu();
        if (user?.role === 'customer') fetchOrderHistory();

        // ✅ Real-time: refresh menu stock every 5 seconds
        const interval = setInterval(() => {
            fetchMenu();
            if (user?.role === 'customer') fetchOrderHistory();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchMenu, fetchOrderHistory, user?.role]);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        setPlacingOrder(true);
        try {
            const payload = { items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity })) };
            const res = await api.post('/orders', payload);
            setCompletedOrder(res.data);
            clearCart();
            // ✅ Immediately refresh menu stock and order history after placing order
            fetchMenu();
            if (user?.role === 'customer') fetchOrderHistory();
        } catch (err) {
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    const STATUS_COLORS = {
        Pending:   'bg-yellow-100 text-yellow-600',
        Preparing: 'bg-blue-100 text-blue-600',
        Ready:     'bg-green-100 text-green-600',
        Completed: 'bg-gray-100 text-gray-500',
        Cancelled: 'bg-red-100 text-red-500',
    };

    // ─── Customer View ───
    if (user?.role === 'customer') {
        return (
            <Layout>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                    .pos-c { font-family: 'Poppins', sans-serif; }
                    .pos-c-title { font-size: 1.45rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1.5rem; }
                    .pos-menu-card {
                        background: #fff; border-radius: 16px; padding: 1rem;
                        border: 2px solid #f0f0f0; cursor: pointer;
                        transition: all 0.2s; text-align: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        position: relative; overflow: hidden;
                    }
                    .pos-menu-card:hover { border-color: #e74c3c; box-shadow: 0 6px 20px rgba(231,76,60,0.15); transform: translateY(-2px); }
                    .pos-menu-card::before {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
                        background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
                        background-size: 200% 100%; animation: posShim 3s linear infinite; opacity: 0;
                        transition: opacity 0.2s;
                    }
                    .pos-menu-card:hover::before { opacity: 1; }
                    @keyframes posShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                    .pos-menu-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
                    .pos-menu-name { font-size: 0.82rem; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
                    .pos-menu-price { font-size: 0.9rem; font-weight: 800; color: #e74c3c; }
                    .pos-menu-stock { font-size: 0.65rem; color: #bbb; margin-top: 2px; }

                    .pos-cart-card {
                        background: #fff; border-radius: 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        border: 1px solid #f0f0f0; padding: 1.25rem;
                        position: sticky; top: 1rem;
                    }
                    .pos-cart-title { font-size: 1rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1rem; }
                    .pos-cart-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
                    .pos-cart-item-name { font-size: 0.8rem; font-weight: 600; color: #1a1a2e; }
                    .pos-cart-item-price { font-size: 0.72rem; color: #e74c3c; font-weight: 600; }
                    .pos-qty-btn {
                        width: 26px; height: 26px; border-radius: 50%; border: none;
                        font-weight: 800; font-size: 0.9rem; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .pos-qty-minus { background: #f0f0f0; color: #555; }
                    .pos-qty-plus  { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }
                    .pos-place-btn {
                        width: 100%; padding: 0.85rem; border: none; border-radius: 14px;
                        background: linear-gradient(135deg, #e74c3c, #c0392b);
                        color: #fff; font-family: 'Poppins', sans-serif;
                        font-size: 0.95rem; font-weight: 700; cursor: pointer;
                        box-shadow: 0 4px 14px rgba(231,76,60,0.35);
                        transition: opacity 0.18s, transform 0.18s;
                    }
                    .pos-place-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                    .pos-place-btn:disabled { opacity: 0.45; cursor: not-allowed; }

                    .pos-live-badge {
                        display: inline-flex; align-items: center; gap: 5px;
                        background: #f8f8f8; border: 1px solid #ebebeb;
                        border-radius: 20px; padding: 0.25rem 0.65rem;
                        font-size: 0.65rem; font-weight: 600; color: #888;
                        margin-left: 0.75rem; vertical-align: middle;
                    }
                    .pos-live-dot {
                        width: 6px; height: 6px; border-radius: 50%; background: #27ae60;
                        animation: posPulse 2s infinite;
                    }
                    @keyframes posPulse {
                        0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)}
                    }
                `}</style>

                <div className="pos-c">
                    <h1 className="pos-c-title">
                        🍔 Order Food
                        <span className="pos-live-badge">
                            <span className="pos-live-dot" /> Live
                        </span>
                    </h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Menu Grid */}
                        <div>
                            <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', color: '#bbb', fontFamily: 'Poppins' }}>
                                Click an item to add to cart · Stock updates every 5s
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                {items.map(item => (
                                    <div key={item.id} className="pos-menu-card" onClick={() => addToCart(item)}>
                                        <div className="pos-menu-icon">🍽️</div>
                                        <div className="pos-menu-name">{item.name}</div>
                                        <div className="pos-menu-price">₱{Number(item.price).toFixed(2)}</div>
                                        <div className="pos-menu-stock"
                                            style={{ color: item.stock > 10 ? '#27ae60' : item.stock > 0 ? '#f39c12' : '#e74c3c' }}>
                                            {item.stock} in stock
                                        </div>
                                        {predictions[item.id]?.predicted_label === 'High Demand' && (
                                            <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(231,76,60,0.4)', transform: 'rotate(10deg)' }}>
                                                🔥 HOT
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cart */}
                        <div className="pos-cart-card">
                            <div className="pos-cart-title">🛒 My Cart</div>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#bbb', fontFamily: 'Poppins', fontSize: '0.82rem' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
                                    No items yet
                                </div>
                            ) : (
                                <div style={{ marginBottom: '1rem' }}>
                                    {cart.map(item => (
                                        <div key={item.id} className="pos-cart-item">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="pos-cart-item-name">{item.name}</div>
                                                <div className="pos-cart-item-price">₱{Number(item.price).toFixed(2)}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <LongPressBtn className="pos-qty-btn pos-qty-minus" onTrigger={() => adjustQuantity(item.id, -1)}>−</LongPressBtn>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 20, textAlign: 'center', fontFamily: 'Poppins' }}>{item.quantity}</span>
                                                <LongPressBtn className="pos-qty-btn pos-qty-plus" onTrigger={() => adjustQuantity(item.id, 1)}>+</LongPressBtn>
                                                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.85rem' }}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', marginBottom: '1rem' }}>
                                    <span>Total</span>
                                    <span style={{ color: '#e74c3c' }}>₱{(total || 0).toFixed(2)}</span>
                                </div>
                                <button onClick={handleSubmit} disabled={cart.length === 0 || placingOrder} className="pos-place-btn">
                                    {placingOrder ? '⏳ Placing...' : '🎉 Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order History — auto-refreshes every 5s */}
                    <div style={{ marginTop: '2rem' }}>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1rem' }}>
                            📋 My Orders
                            <span className="pos-live-badge">
                                <span className="pos-live-dot" /> Auto-refreshing
                            </span>
                        </h2>
                        {loadingHistory ? (
                            <p style={{ fontFamily: 'Poppins', color: '#bbb', fontSize: '0.82rem' }}>Loading...</p>
                        ) : orderHistory.length === 0 ? (
                            <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#bbb', fontFamily: 'Poppins', fontSize: '0.85rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                                No orders yet. Start ordering!
                            </div>
                        ) : (
                            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', fontFamily: 'Poppins', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#fafafa' }}>
                                        <tr style={{ color: '#bbb', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Order #</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Items</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Total</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderHistory.map(order => (
                                            <tr key={order.id} style={{ borderTop: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1a1a2e' }}>{order.order_number}</td>
                                                <td style={{ padding: '0.75rem 1rem', color: '#888' }}>{order.order_items?.length || 0} item(s)</td>
                                                <td style={{ padding: '0.75rem 1rem', color: '#e74c3c', fontWeight: 700 }}>₱{Number(order.total_amount).toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', color: '#bbb', fontSize: '0.72rem' }}>
                                                    {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
            </Layout>
        );
    }

    // ─── Admin / Cashier POS View ───
    return (
        <Layout>
            <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Menu Items */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Select Items
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: '#f8f8f8', border: '1px solid #ebebeb',
                                borderRadius: 20, padding: '0.2rem 0.65rem',
                                fontSize: '0.65rem', fontWeight: 600, color: '#888',
                                marginLeft: '0.75rem', verticalAlign: 'middle'
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27ae60', animation: 'posPulse 2s infinite', display: 'inline-block' }} />
                                Stock live
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md hover:border-orange-400 border-2 border-transparent transition relative overflow-hidden"
                                >
                                    <div className="text-3xl text-center mb-2">🍽️</div>
                                    <p className="font-semibold text-sm text-gray-800 text-center">{item.name}</p>
                                    <p className="text-orange-500 font-bold text-center">₱{Number(item.price).toFixed(2)}</p>
                                    <p style={{ textAlign: 'center', fontSize: '0.65rem', color: item.stock > 10 ? '#27ae60' : item.stock > 0 ? '#f39c12' : '#e74c3c', marginTop: 2 }}>
                                        {item.stock} in stock
                                    </p>
                                    {predictions[item.id]?.predicted_label === 'High Demand' && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[0.6rem] font-bold px-2 py-1 rounded-bl-lg shadow">
                                            🔥 HOT
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="bg-white rounded-2xl shadow p-5 flex flex-col h-fit sticky top-0">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">🛒 Cart</h2>
                        {cart.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center mt-10">No items added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700">{item.name}</p>
                                            <p className="text-xs text-orange-500">₱{Number(item.price).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <LongPressBtn onTrigger={() => adjustQuantity(item.id, -1)} className="bg-gray-200 px-2 py-1 rounded text-sm">-</LongPressBtn>
                                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                                            <LongPressBtn onTrigger={() => adjustQuantity(item.id, 1)} className="bg-gray-200 px-2 py-1 rounded text-sm">+</LongPressBtn>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-sm ml-1">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between font-bold text-gray-800 mb-4">
                                <span>Total</span>
                                <span className="text-orange-500">₱{(total || 0).toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || placingOrder}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                            >
                                {placingOrder ? '⏳ Placing...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Queue — has its own 5s polling */}
                <div className="mt-6">
                    <OrderQueue />
                </div>

                {completedOrder && <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />}
            </div>
        </Layout>
    );
}

export default POSInterface;