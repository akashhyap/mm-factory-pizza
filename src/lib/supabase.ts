// Supabase client configuration

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItemJson[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  estimated_pickup_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemJson {
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

// Create a new order
export async function createOrder(orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItemJson[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}): Promise<{ data: DbOrder | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      customer_email: orderData.customerEmail || null,
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      total: orderData.total,
      notes: orderData.notes || null,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  return { data, error: error as Error | null };
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<{ data: DbOrder | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  return { data, error: error as Error | null };
}

// Get orders by phone number
export async function getOrdersByPhone(phone: string): Promise<{ data: DbOrder[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}

// Update order status
export async function updateOrderStatus(
  orderId: string, 
  status: DbOrder['status']
): Promise<{ data: DbOrder | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  return { data, error: error as Error | null };
}

// Get all orders (for admin)
export async function getAllOrders(limit = 50): Promise<{ data: DbOrder[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error: error as Error | null };
}

// Get orders by status (for admin)
export async function getOrdersByStatus(status: DbOrder['status']): Promise<{ data: DbOrder[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}
