import React, { createContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem } from '../utils/storage';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getStoredItem('freshmart_cart', {}));

  useEffect(() => {
    setStoredItem('freshmart_cart', cart);
    setStoredItem('sabjihub_cart', cart);
  }, [cart]);

  const addItem = (product, qty = 1) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        ...product,
        qty: (prev[product.id]?.qty || 0) + qty
      }
    }));
  };

  const removeItem = (productId) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => setCart({});

  const itemCount = Object.values(cart).reduce((acc, it) => acc + (it.qty || 1), 0);
  const subtotal = Object.values(cart).reduce((acc, it) => acc + (Number(it.price || 0) * (it.qty || 1)), 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}
