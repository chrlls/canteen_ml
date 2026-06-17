import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import MenuItemCard from './MenuItemCard';
import MenuForm from './MenuForm';
import OrderReceipt from '../orders/OrderReceipt';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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

function MenuList() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [predictions, setPredictions] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const { user } = useAuth();
    const { cart, addToCart, removeFromCart, adjustQuantity, clearCart, total } = useCart();

    const fetchItems = () => {
        api.get('/menu').then(res => setItems(res.data)).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchItems();
        api.get('/categories').then(res => setCategories(res.data));
        api.get('/predict').then(res => {
            const predMap = {};
            res.data.forEach(p => { predMap[p.menu_item_id] = p; });
            setPredictions(predMap);
        }).catch(() => {});
    }, []);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        const payload = {
            items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
        };
        const res = await api.post('/orders', payload);
        setCompletedOrder(res.data);
        clearCart();
        setShowCart(false);
    };

    const filtered = items.filter(item => {
        const matchCat = selectedCategory === 'All' || item.category?.name === selectedCategory;
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchAvail = user?.role !== 'customer' || item.is_available;
        return matchCat && matchSearch && matchAvail;
    });

    return (
        <Layout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

                .ml-page { font-family: 'Poppins', sans-serif; }

                .ml-header {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;
                    margin-bottom: 1.75rem;
                }
                .ml-title { font-size: 1.45rem; font-weight: 800; color: #1a1a2e; margin-bottom: 2px; letter-spacing: -0.3px; }
                .ml-sub   { font-size: 0.8rem; color: #bbb; font-weight: 400; }

                .ml-cart-btn {
                    position: relative;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: #fff; border: none; border-radius: 12px;
                    padding: 0.62rem 1.25rem;
                    font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: transform 0.18s, box-shadow 0.18s;
                    box-shadow: 0 4px 14px rgba(231,76,60,0.32);
                }
                .ml-cart-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(231,76,60,0.42); }
                .ml-cart-badge {
                    background: #fff; color: #e74c3c;
                    font-size: 0.68rem; font-weight: 800; border-radius: 50%;
                    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
                }
                .ml-add-btn {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: #fff; border: none; border-radius: 12px;
                    padding: 0.62rem 1.25rem;
                    font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 600;
                    cursor: pointer; transition: transform 0.18s, box-shadow 0.18s;
                    box-shadow: 0 4px 14px rgba(231,76,60,0.32);
                }
                .ml-add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(231,76,60,0.42); }

                .ml-divider { display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem; }
                .ml-divider-line { flex:1;height:1px;background:#ebebeb; }
                .ml-divider-text { font-size:0.67rem;color:#ccc;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap; }

                .ml-search-wrap { position:relative; margin-bottom:0.85rem; }
                .ml-search-icon { position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:#ccc;font-size:0.88rem; }
                .ml-search {
                    width: 100%; padding: 0.75rem 1rem 0.75rem 2.6rem;
                    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 12px;
                    font-family: 'Poppins', sans-serif; font-size: 0.875rem; color: #1a1a2e;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                }
                .ml-search:focus { border-color: #e74c3c; box-shadow: 0 0 0 3px rgba(231,76,60,0.1); }
                .ml-search::placeholder { color: #bbb; }

                .ml-filters { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
                .ml-cat-btn {
                    padding: 0.38rem 1rem; border-radius: 20px;
                    border: 1.5px solid #e8e8e8; background: #fff;
                    font-family: 'Poppins', sans-serif; font-size: 0.78rem; font-weight: 500; color: #888;
                    cursor: pointer; transition: all 0.18s;
                }
                .ml-cat-btn:hover { border-color: #e74c3c; color: #e74c3c; }
                .ml-cat-btn.active {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    border-color: transparent; color: #fff;
                    box-shadow: 0 3px 10px rgba(231,76,60,0.3);
                }

                .ml-empty { text-align: center; padding: 4rem 1rem; color: #bbb; font-size: 0.9rem; }
                .ml-empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }

                .ml-shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
                    background-size: 200% 100%; animation: mlShim 1.4s infinite;
                    border-radius: 18px; height: 260px;
                }
                @keyframes mlShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

                .ml-cart-overlay {
                    position:fixed;inset:0;background:rgba(0,0,0,0.48);
                    backdrop-filter:blur(5px);z-index:50;display:flex;justify-content:flex-end;
                }
                .ml-cart-panel {
                    background:#fff;width:100%;max-width:370px;height:100%;
                    display:flex;flex-direction:column;
                    box-shadow:-8px 0 40px rgba(0,0,0,0.14);
                    font-family:'Poppins',sans-serif;
                    animation:slideLeft 0.28s ease;
                    position:relative;overflow:hidden;
                }
                .ml-cart-panel::before {
                    content:'';position:absolute;top:0;left:0;right:0;height:3px;
                    background:linear-gradient(90deg,#e74c3c,#ff8a80,#e74c3c);
                    background-size:200% 100%;animation:cpShim 3s linear infinite;z-index:2;
                }
                @keyframes cpShim  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                @keyframes slideLeft { from{transform:translateX(100%)} to{transform:translateX(0)} }

                .ml-cart-head {
                    display:flex;align-items:center;justify-content:space-between;
                    padding:1.35rem 1.5rem 1.1rem;border-bottom:1px solid #f0f0f0;
                }
                .ml-cart-title { font-size:1.1rem;font-weight:800;color:#1a1a2e; }
                .ml-cart-count { font-size:0.72rem;color:#bbb;font-weight:500;margin-top:2px; }
                .ml-cart-close { background:none;border:none;font-size:1.3rem;cursor:pointer;color:#bbb;transition:color 0.18s; }
                .ml-cart-close:hover { color:#e74c3c; }

                .ml-cart-body { flex:1;overflow-y:auto;padding:1.25rem 1.5rem; }
                .ml-cart-body::-webkit-scrollbar{width:4px;}
                .ml-cart-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:4px;}

                .ml-cart-empty { text-align:center;padding:3.5rem 0;color:#bbb; }
                .ml-cart-empty .big { font-size:3.5rem;margin-bottom:0.75rem; }

                .ml-cart-item {
                    display:flex;align-items:center;gap:0.85rem;
                    background:#fafafa;border-radius:14px;border:1px solid #f5f5f5;
                    padding:0.85rem 1rem;margin-bottom:0.75rem;
                    transition:box-shadow 0.18s;
                }
                .ml-cart-item:hover { box-shadow:0 2px 10px rgba(0,0,0,0.06); }
                .ml-cart-item:last-child { margin-bottom:0; }
                .ml-cart-item-emoji { font-size:1.8rem;flex-shrink:0; }
                .ml-cart-item-name  { font-size:0.85rem;font-weight:700;color:#1a1a2e;line-height:1.3; }
                .ml-cart-item-price { font-size:0.82rem;font-weight:700;color:#e74c3c;margin-top:2px; }

                .ml-qty-row { display:flex;align-items:center;gap:6px;flex-shrink:0; }
                .ml-qty-btn {
                    width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;
                    font-weight:800;font-size:0.95rem;
                    display:flex;align-items:center;justify-content:center;transition:opacity 0.15s;
                }
                .ml-qty-minus { background:#e8e8e8;color:#555; }
                .ml-qty-minus:hover { background:#d8d8d8; }
                .ml-qty-plus  { background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff; }
                .ml-qty-plus:hover { opacity:0.88; }
                .ml-qty-num { font-size:0.9rem;font-weight:700;min-width:22px;text-align:center;color:#1a1a2e; }
                .ml-cart-del { background:none;border:none;cursor:pointer;font-size:1rem;margin-left:2px;opacity:0.5;transition:opacity 0.18s; }
                .ml-cart-del:hover { opacity:1; }

                .ml-cart-foot { padding:1.25rem 1.5rem 1.5rem;border-top:1px solid #f0f0f0;background:#fff; }
                .ml-cart-subtotal { display:flex;justify-content:space-between;font-size:0.78rem;color:#bbb;margin-bottom:5px; }
                .ml-cart-total { display:flex;justify-content:space-between;font-size:1.25rem;font-weight:800;color:#1a1a2e;margin-bottom:1.1rem; }
                .ml-cart-total span:last-child { color:#e74c3c; }
                .ml-place-btn {
                    width:100%;padding:0.95rem;
                    background:linear-gradient(135deg,#e74c3c,#c0392b);
                    color:#fff;border:none;border-radius:14px;
                    font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;
                    cursor:pointer;transition:opacity 0.18s,transform 0.18s;
                    box-shadow:0 6px 20px rgba(231,76,60,0.38);
                    position:relative;overflow:hidden;
                }
                .ml-place-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 60%);pointer-events:none;}
                .ml-place-btn:hover:not(:disabled){opacity:0.9;transform:translateY(-2px);}
                .ml-place-btn:disabled{opacity:0.42;cursor:not-allowed;transform:none;}
                .ml-continue-btn {
                    width:100%;margin-top:0.6rem;padding:0.65rem;
                    background:#f7f7f7;color:#888;border:none;border-radius:12px;
                    font-family:'Poppins',sans-serif;font-size:0.875rem;cursor:pointer;transition:background 0.18s;
                }
                .ml-continue-btn:hover { background:#efefef; }
            `}</style>

            <div className="ml-page">

                {/* Header */}
                <div className="ml-header">
                    <div>
                        <h1 className="ml-title">
                            {user?.role === 'customer' ? '🍔 Browse Menu' : '🍽️ Menu Management'}
                        </h1>
                        <div className="ml-sub">{filtered.length} items available</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {user?.role === 'customer' && (
                            <button onClick={() => setShowCart(true)} className="ml-cart-btn">
                                🛒 Cart
                                {cart.length > 0 && (
                                    <span className="ml-cart-badge">
                                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                                    </span>
                                )}
                            </button>
                        )}
                        {user?.role === 'admin' && (
                            <button onClick={() => { setEditItem(null); setShowForm(true); }} className="ml-add-btn">
                                + Add Item
                            </button>
                        )}
                    </div>
                </div>

                {/* Section divider */}
                <div className="ml-divider">
                    <div className="ml-divider-line" />
                    <span className="ml-divider-text">Browse & Filter</span>
                    <div className="ml-divider-line" />
                </div>

                {/* Search */}
                <div className="ml-search-wrap">
                    <span className="ml-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ml-search"
                    />
                </div>

                {/* Category pills */}
                <div className="ml-filters">
                    <button onClick={() => setSelectedCategory('All')} className={`ml-cat-btn${selectedCategory === 'All' ? ' active' : ''}`}>All</button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`ml-cat-btn${selectedCategory === cat.name ? ' active' : ''}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'1rem' }}>
                        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="ml-shimmer" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="ml-empty">
                        <div className="ml-empty-icon">🍽️</div>
                        <p>No menu items found.</p>
                        <p style={{ fontSize:'0.78rem', marginTop:4 }}>Try a different search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(item => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                userRole={user?.role}
                                onDelete={fetchItems}   // ✅ just refresh
                                onToggle={fetchItems}   // ✅ just refresh
                                onEdit={() => { setEditItem(item); setShowForm(true); }}
                                onAddToCart={() => addToCart(item)}
                                prediction={predictions[item.id]}
                            />
                        ))}
                    </div>
                )}

                {/* Admin Form Modal */}
                {showForm && (
                    <MenuForm
                        item={editItem}
                        categories={categories}
                        onClose={() => setShowForm(false)}
                        onSaved={() => { setShowForm(false); fetchItems(); }}
                    />
                )}

                {/* Cart Sidebar */}
                {showCart && (
                    <div className="ml-cart-overlay">
                        <div className="ml-cart-panel">
                            <div className="ml-cart-head">
                                <div>
                                    <h2 className="ml-cart-title">🛒 My Cart</h2>
                                    <div className="ml-cart-count">{cart.reduce((s,i)=>s+i.quantity,0)} items</div>
                                </div>
                                <button onClick={() => setShowCart(false)} className="ml-cart-close">✕</button>
                            </div>

                            <div className="ml-cart-body">
                                {cart.length === 0 ? (
                                    <div className="ml-cart-empty">
                                        <div className="big">🛒</div>
                                        <p style={{ fontWeight:600, color:'#999' }}>Your cart is empty</p>
                                        <p style={{ fontSize:'0.78rem', marginTop:4 }}>Add items from the menu</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="ml-cart-item">
                                            <div className="ml-cart-item-emoji">🍽️</div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div className="ml-cart-item-name">{item.name}</div>
                                                <div className="ml-cart-item-price">₱{item.price}</div>
                                            </div>
                                            <div className="ml-qty-row">
                                                <LongPressBtn className="ml-qty-btn ml-qty-minus" onTrigger={() => adjustQuantity(item.id, -1)}>−</LongPressBtn>
                                                <span className="ml-qty-num">{item.quantity}</span>
                                                <LongPressBtn className="ml-qty-btn ml-qty-plus" onTrigger={() => adjustQuantity(item.id, 1)}>+</LongPressBtn>
                                                <button className="ml-cart-del" onClick={() => removeFromCart(item.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="ml-cart-foot">
                                <div className="ml-cart-subtotal">
                                    <span>Items ({cart.reduce((s,i)=>s+i.quantity,0)})</span>
                                    <span>₱{(total || 0).toFixed(2)}</span>
                                </div>
                                <div className="ml-cart-total">
                                    <span>Total</span>
                                    <span>₱{(total || 0).toFixed(2)}</span>
                                </div>
                                <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="ml-place-btn">
                                    Place Order 🎉
                                </button>
                                <button onClick={() => setShowCart(false)} className="ml-continue-btn">
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {completedOrder && (
                    <OrderReceipt order={completedOrder} onClose={() => setCompletedOrder(null)} />
                )}
            </div>
        </Layout>
    );
}

export default MenuList;