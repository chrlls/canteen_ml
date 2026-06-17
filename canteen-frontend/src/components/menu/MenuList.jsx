import React, { useEffect, useState } from 'react';
import Layout from '../common/Layout';
import MenuItemCard from './MenuItemCard';
import MenuForm from './MenuForm';
import OrderReceipt from '../orders/OrderReceipt';
import LongPressBtn from '../common/LongPressBtn';
import api from '../../services/api';
import orderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, ShoppingCart, Plus, X, Trash2, PartyPopper } from 'lucide-react';

export default function MenuList() {
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
    const [orderError, setOrderError] = useState('');
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
        try {
            const items = cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }));
            const res = await orderService.placeOrder(items);
            setCompletedOrder(res.data);
            clearCart();
            setShowCart(false);
        } catch (err) {
            setOrderError(err.response?.data?.message || 'Failed to place order. Please try again.');
        }
    };

    const filtered = items.filter(item => {
        const matchCat = selectedCategory === 'All' || item.category?.name === selectedCategory;
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchAvail = user?.role !== 'customer' || item.is_available;
        return matchCat && matchSearch && matchAvail;
    });

    const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <Layout>
            <div className="flex flex-col h-full">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {user?.role === 'customer' ? <><span>🍔</span> Browse Menu</> : <><span>🍽️</span> Menu Management</>}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{filtered.length} items available</p>
                    </div>
                    <div className="flex gap-3">
                        {user?.role === 'customer' && (
                            <Button onClick={() => { setShowCart(true); setOrderError(''); }} className="relative font-bold shadow-sm">
                                <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-background text-primary border-2 border-primary text-[10px] font-extrabold rounded-full w-6 h-6 flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Button>
                        )}
                        {user?.role === 'admin' && (
                            <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="font-bold shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        )}
                    </div>
                </div>

                {/* Section divider */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Browse & Filter</span>
                    <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Search menu items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-12 bg-background border-border/50 text-base"
                    />
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button 
                        onClick={() => setSelectedCategory('All')} 
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${selectedCategory === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'}`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.name)} 
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${selectedCategory === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="bg-muted/40 animate-pulse rounded-xl h-[320px] border border-border/50" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="text-5xl mb-4">🍽️</div>
                        <p className="font-semibold text-lg text-foreground">No menu items found.</p>
                        <p className="text-sm mt-1">Try a different search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                        {filtered.map(item => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                userRole={user?.role}
                                onDelete={fetchItems}
                                onToggle={fetchItems}
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

                {/* Cart Sidebar / Slide-over */}
                {showCart && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-background h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative border-l border-border">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50"></div>
                            
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                                <div>
                                    <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">🛒 My Cart</h2>
                                    <p className="text-xs font-semibold text-muted-foreground mt-1 tracking-widest uppercase">{cartItemCount} items</p>
                                </div>
                                <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-destructive transition-colors p-2 -mr-2">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-20">
                                        <div className="text-6xl mb-4">🛒</div>
                                        <p className="font-bold text-foreground">Your cart is empty</p>
                                        <p className="text-xs mt-1">Add items from the menu</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex items-center gap-4 bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group">
                                                <div className="text-3xl shrink-0">🍽️</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-foreground truncate">{item.name}</div>
                                                    <div className="font-bold text-xs text-primary mt-0.5">₱{item.price}</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 bg-muted/50 rounded-lg p-1 border border-border/50">
                                                    <LongPressBtn className="w-7 h-7 flex items-center justify-center rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:bg-muted font-bold" onTrigger={() => adjustQuantity(item.id, -1)}>−</LongPressBtn>
                                                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                                                    <LongPressBtn className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm hover:opacity-90 font-bold" onTrigger={() => adjustQuantity(item.id, 1)}>+</LongPressBtn>
                                                </div>
                                                <button className="text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive transition-all shrink-0 p-1 -mr-1" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-background border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-2">
                                    <span>Subtotal</span>
                                    <span>₱{(total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-extrabold text-foreground mb-5 tracking-tight">
                                    <span>Total</span>
                                    <span className="text-primary">₱{(total || 0).toFixed(2)}</span>
                                </div>
                                
                                {orderError && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium mb-4">
                                        ⚠️ {orderError}
                                    </div>
                                )}
                                
                                <Button 
                                    className="w-full h-12 text-base font-bold shadow-md relative overflow-hidden" 
                                    onClick={handlePlaceOrder} 
                                    disabled={cart.length === 0}
                                >
                                    <PartyPopper className="w-5 h-5 mr-2" /> Place Order
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-10 mt-2 text-muted-foreground font-semibold hover:bg-muted" 
                                    onClick={() => setShowCart(false)}
                                >
                                    Continue Shopping
                                </Button>
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