// Order types for M&M Factory Pizza

import type { CartItem } from './cart';

export type OrderStatus = 
  | 'pending'      // Order placed, awaiting confirmation
  | 'confirmed'    // Order confirmed, preparing
  | 'preparing'    // Being prepared in kitchen
  | 'ready'        // Ready for pickup
  | 'completed'    // Customer picked up
  | 'cancelled';   // Order cancelled

export type PaymentStatus = 
  | 'pending'      // Awaiting payment
  | 'processing'   // Payment being processed
  | 'paid'         // Payment successful
  | 'failed'       // Payment failed
  | 'refunded';    // Payment refunded

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  extras: {
    extraId: string;
    extraName: string;
    extraPrice: number;
    quantity: number;
  }[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number (e.g., "MM-001")
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string; // Stripe payment intent ID
  estimatedPickupTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string; // Internal notes for admin
}

// Convert cart items to order items
export function cartItemsToOrderItems(cartItems: CartItem[]): OrderItem[] {
  return cartItems.map(item => ({
    menuItemId: item.menuItem.id,
    menuItemName: item.menuItem.name,
    menuItemPrice: item.menuItem.price,
    quantity: item.quantity,
    extras: item.selectedExtras.map(extra => ({
      extraId: extra.extra.id,
      extraName: extra.extra.name,
      extraPrice: extra.extra.price,
      quantity: extra.quantity,
    })),
    specialInstructions: item.specialInstructions,
    itemTotal: item.itemTotal,
  }));
}

// Generate order number
export function generateOrderNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `MM-${datePart}-${randomPart}`;
}

// Get status display text
export const ORDER_STATUS_DISPLAY: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Get status color for UI
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};
