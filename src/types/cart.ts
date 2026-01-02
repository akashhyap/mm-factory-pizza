// Cart types for M&M Factory Pizza

import type { MenuItem, Extra } from './menu';

export interface CartItemExtra {
  extra: Extra;
  quantity: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (generated)
  menuItem: MenuItem;
  quantity: number;
  selectedExtras: CartItemExtra[];
  specialInstructions?: string;
  itemTotal: number; // Pre-calculated total for this item (including extras)
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Calculate item total including extras
export function calculateItemTotal(
  menuItem: MenuItem,
  quantity: number,
  selectedExtras: CartItemExtra[]
): number {
  const basePrice = menuItem.price;
  const extrasTotal = selectedExtras.reduce(
    (sum, extra) => sum + extra.extra.price * extra.quantity,
    0
  );
  return (basePrice + extrasTotal) * quantity;
}

// Calculate cart totals
export function calculateCartTotals(items: CartItem[]): Omit<Cart, 'items'> {
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const taxRate = 0.21; // 21% VAT in Ireland
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

// Generate unique cart item ID
export function generateCartItemId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
