// Cart store using Zustand with localStorage persistence

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, CartItem, CartItemExtra } from '../types';
import { calculateItemTotal, calculateCartTotals, generateCartItemId } from '../types/cart';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  
  // Computed values (recalculated on each access)
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  
  // Actions
  addItem: (menuItem: MenuItem, quantity: number, selectedExtras: CartItemExtra[], specialInstructions?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateItemQuantity: (cartItemId: string, quantity: number) => void;
  updateItemExtras: (cartItemId: string, selectedExtras: CartItemExtra[]) => void;
  updateSpecialInstructions: (cartItemId: string, instructions: string) => void;
  clearCart: () => void;
  
  // Drawer actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      
      // Computed getters
      getSubtotal: () => {
        const totals = calculateCartTotals(get().items);
        return totals.subtotal;
      },
      
      getTax: () => {
        const totals = calculateCartTotals(get().items);
        return totals.tax;
      },
      
      getTotal: () => {
        const totals = calculateCartTotals(get().items);
        return totals.total;
      },
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      // Add item to cart
      addItem: (menuItem, quantity, selectedExtras, specialInstructions) => {
        const itemTotal = calculateItemTotal(menuItem, quantity, selectedExtras);
        
        const newItem: CartItem = {
          id: generateCartItemId(),
          menuItem,
          quantity,
          selectedExtras,
          specialInstructions,
          itemTotal,
        };
        
        set(state => ({
          items: [...state.items, newItem],
          isDrawerOpen: true, // Open drawer when item is added
        }));
      },
      
      // Remove item from cart
      removeItem: (cartItemId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== cartItemId),
        }));
      },
      
      // Update item quantity
      updateItemQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        
        set(state => ({
          items: state.items.map(item => {
            if (item.id !== cartItemId) return item;
            
            const newItemTotal = calculateItemTotal(
              item.menuItem,
              quantity,
              item.selectedExtras
            );
            
            return {
              ...item,
              quantity,
              itemTotal: newItemTotal,
            };
          }),
        }));
      },
      
      // Update item extras
      updateItemExtras: (cartItemId, selectedExtras) => {
        set(state => ({
          items: state.items.map(item => {
            if (item.id !== cartItemId) return item;
            
            const newItemTotal = calculateItemTotal(
              item.menuItem,
              item.quantity,
              selectedExtras
            );
            
            return {
              ...item,
              selectedExtras,
              itemTotal: newItemTotal,
            };
          }),
        }));
      },
      
      // Update special instructions
      updateSpecialInstructions: (cartItemId, instructions) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === cartItemId
              ? { ...item, specialInstructions: instructions }
              : item
          ),
        }));
      },
      
      // Clear entire cart
      clearCart: () => {
        set({ items: [] });
      },
      
      // Drawer controls
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set(state => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: 'mm-pizza-cart', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);

// Selector hooks for common operations
export const useCartItems = () => useCartStore(state => state.items);
export const useCartItemCount = () => useCartStore(state => state.getItemCount());
export const useCartTotal = () => useCartStore(state => state.getTotal());
export const useIsCartEmpty = () => useCartStore(state => state.items.length === 0);
export const useIsDrawerOpen = () => useCartStore(state => state.isDrawerOpen);
