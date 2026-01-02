// Admin Dashboard - Order Management

import React, { useState, useEffect } from 'react';
import { supabase, type DbOrder } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button } from '../ui/Button';
import toast, { Toaster } from 'react-hot-toast';

type OrderStatus = DbOrder['status'];

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

function getStatusColor(status: OrderStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as DbOrder, ...prev]);
            toast.success('New order received!', { icon: '🍕' });
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as DbOrder : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update order status
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } else {
      toast.success(`Order status updated to ${newStatus}`);
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
    
    setUpdatingOrderId(null);
  };

  // Filter orders
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  // Count by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-charcoal text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-olive">M</span>&<span className="text-accent-red">M</span> Admin
            </h1>
            <p className="text-white/60 text-sm">Order Management Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchOrders} variant="outline" size="sm">
              ↻ Refresh
            </Button>
            <a href="/" className="text-white/80 hover:text-white text-sm">
              ← Back to Site
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-xl text-center transition-all ${
              filterStatus === 'all' ? 'bg-charcoal text-white' : 'bg-white shadow hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm opacity-70">All Orders</p>
          </button>
          {STATUS_OPTIONS.slice(0, 5).map(status => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`p-4 rounded-xl text-center transition-all ${
                filterStatus === status.value ? 'ring-2 ring-royal-blue' : ''
              } ${status.color}`}
            >
              <p className="text-2xl font-bold">{statusCounts[status.value] || 0}</p>
              <p className="text-sm opacity-70">{status.label}</p>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-charcoal">
                {filterStatus === 'all' ? 'All Orders' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Orders`}
                <span className="ml-2 text-gray-400 font-normal">({filteredOrders.length})</span>
              </h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders found</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-royal-blue/5 border-l-4 border-royal-blue' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-charcoal">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-semibold text-olive mt-1">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-charcoal">Order Details</h2>
            </div>
            
            {selectedOrder ? (
              <div className="p-4 space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Order Number</p>
                  <p className="text-xl font-bold text-charcoal">{selectedOrder.order_number}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Customer Info */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-semibold text-charcoal">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.quantity}× {item.menuItemName}</span>
                          <span className="text-olive font-semibold">{formatCurrency(item.itemTotal)}</span>
                        </div>
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            + {item.extras.map(e => e.extraName).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            "{item.specialInstructions}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (21%)</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-olive">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 uppercase tracking-wider">Notes</p>
                    <p className="text-sm text-yellow-800 mt-1">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status.value}
                        onClick={() => updateStatus(selectedOrder.id, status.value)}
                        disabled={selectedOrder.status === status.value || updatingOrderId === selectedOrder.id}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedOrder.status === status.value
                            ? `${status.color} ring-2 ring-offset-1 ring-gray-400`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
