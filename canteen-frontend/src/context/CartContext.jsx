import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };


    const adjustQuantity = (id, delta) => {
        setCart(prev => {
            return prev.map(i => {
                if (i.id === id) {
                    const newQty = i.quantity + delta;
                    return { ...i, quantity: newQty };
                }
                return i;
            }).filter(i => i.quantity > 0);
        });
    };

    const updateQuantity = (id, quantity) => {
        setCart(prev => {
            return prev.map(i => {
                if (i.id === id) {
                    return { ...i, quantity: Math.max(1, quantity) };
                }
                return i;
            });
        });
    };

    const clearCart = () => setCart([]);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, adjustQuantity, updateQuantity, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}