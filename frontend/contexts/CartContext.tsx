'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string; // unique id for cart item (e.g., product_id + variant_id + type)
  productId: string;
  variantId?: string;
  title: string;
  variantName?: string;
  price: number;
  quantity: number;
  type: 'buy' | 'rent';
  image?: string;
  rentDays?: number; // Only for rentals
  // Optional rental period dates (ISO strings)
  rentStartDate?: string;
  rentEndDate?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  // Helper to update arbitrary fields (e.g., dates) on a cart item
  updateItem: (id: string, updates: Partial<Omit<CartItem, 'id' | 'productId' | 'variantId' | 'type'>>) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('graceled_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setMounted(true);
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('graceled_cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.productId}-${newItem.variantId || 'base'}-${newItem.type}`;
    
    setItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => 
          item.id === id 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, { ...newItem, id }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  const updateItem = (
  id: string,
  updates: Partial<Omit<CartItem, 'id' | 'productId' | 'variantId' | 'type'>>
) => {
  setItems(prev =>
    prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  );
};


  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((total, item) => {
    const itemTotal = item.type === 'rent' 
      ? item.price * item.quantity * (item.rentDays || 1)
      : item.price * item.quantity;
    return total + itemTotal;
  }, 0);

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, updateItem, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
