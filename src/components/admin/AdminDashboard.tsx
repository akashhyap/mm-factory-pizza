// Admin Dashboard - Order Management (Enhanced)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type DbOrder } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import toast, { Toaster } from 'react-hot-toast';

type OrderStatus = DbOrder['status'];
type ViewMode = 'active' | 'history';

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
const HISTORY_STATUSES: OrderStatus[] = ['completed', 'cancelled'];

function getStatusColor(status: OrderStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
}

// Calculate time elapsed since order was placed
function getTimeElapsed(createdAt: string): { text: string; isUrgent: boolean; isWarning: boolean } {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return { text: 'Just now', isUrgent: false, isWarning: false };
  if (diffMins < 60) return { text: `${diffMins}m ago`, isUrgent: diffMins > 30, isWarning: diffMins > 15 && diffMins <= 30 };
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { text: `${hours}h ${mins}m ago`, isUrgent: true, isWarning: false };
}

// Format pickup time for display
function formatPickupTime(time: string | null): string {
  if (!time) return 'ASAP';
  return time;
}

// Get next status in progression
function getNextStatus(current: OrderStatus): OrderStatus | null {
  const progression: Record<OrderStatus, OrderStatus | null> = {
    'pending': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': 'completed',
    'completed': null,
    'cancelled': null,
  };
  return progression[current];
}

// Admin password - in production, use environment variable or proper auth
const ADMIN_PASSWORD = 'mmfactory2025';

export function AdminDashboard() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const authToken = localStorage.getItem('mm_admin_auth');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('mm_admin_auth', 'authenticated');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mm_admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [editingPickupTime, setEditingPickupTime] = useState<string | null>(null);
  const [newPickupTime, setNewPickupTime] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [, setTick] = useState(0);
  const [cancellingOrder, setCancellingOrder] = useState<DbOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio - pleasant notification ding
  useEffect(() => {
    // Create a more pleasant notification sound using AudioContext
    const createNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // A pleasant high note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Play a second note for a "ding-dong" effect
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.setValueAtTime(660, audioContext.currentTime);
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.6);
        }, 150);
      } catch (e) {
        console.log('Audio not supported');
      }
    };
    
    // Store the function in ref for later use
    (audioRef as any).current = createNotificationSound;
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && (audioRef as any).current) {
      (audioRef as any).current();
    }
  }, [soundEnabled]);

  // Update time counters every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
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
  }, []);

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
            playNotificationSound();
            toast.success('🍕 New order received!', { 
              duration: 5000,
              style: { background: '#10B981', color: 'white', fontWeight: 'bold' }
            });
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as DbOrder : o));
            if (selectedOrder?.id === payload.new.id) {
              setSelectedOrder(payload.new as DbOrder);
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, selectedOrder?.id]);

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

  // Update pickup time
  const updatePickupTime = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ estimated_pickup_time: newPickupTime || null, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update pickup time');
    } else {
      toast.success('Pickup time updated');
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, estimated_pickup_time: newPickupTime || null } : o
      ));
    }
    setEditingPickupTime(null);
    setNewPickupTime('');
  };

  // Update notes
  const updateNotes = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ notes: newNotes || null, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update notes');
    } else {
      toast.success('Notes updated');
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, notes: newNotes || null } : o
      ));
    }
    setEditingNotes(null);
    setNewNotes('');
  };

  // Toggle order expansion
  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Filter orders based on view mode, status, search, and date
  const getFilteredOrders = () => {
    let filtered = orders;
    
    // When searching, search ALL orders regardless of tab
    const isSearching = searchQuery.trim().length > 0;
    
    if (!isSearching) {
      if (viewMode === 'active') {
        filtered = filtered.filter(o => ACTIVE_STATUSES.includes(o.status));
      } else {
        filtered = filtered.filter(o => HISTORY_STATUSES.includes(o.status));
      }
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }
    // Search filter
    if (isSearching) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.includes(query) ||
        o.id.toLowerCase().includes(query)
      );
    }
    // Date filter (only for history view when not searching)
    if (dateFilter && viewMode === 'history' && !isSearching) {
      filtered = filtered.filter(o => 
        new Date(o.created_at).toISOString().split('T')[0] === dateFilter
      );
    }
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Count by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const historyCount = orders.filter(o => HISTORY_STATUSES.includes(o.status)).length;

  // Dashboard stats - Today's data
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  // Count sales from all non-cancelled orders (pending through completed)
  const todaysPaidOrders = todaysOrders.filter(o => o.status !== 'cancelled');
  const todaysSales = todaysPaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todaysOrderCount = todaysOrders.length;
  const avgOrderValue = todaysPaidOrders.length > 0 ? todaysSales / todaysPaidOrders.length : 0;
  // Payment stats
  const todaysPaidOnline = todaysOrders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled');
  const todaysPaidOnlineTotal = todaysPaidOnline.reduce((sum, o) => sum + (o.total || 0), 0);
  const todaysPayAtPickup = todaysOrders.filter(o => o.payment_status === 'pending' && o.status !== 'cancelled');
  const todaysPayAtPickupTotal = todaysPayAtPickup.reduce((sum, o) => sum + (o.total || 0), 0);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-olive border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-olive">M</span>&<span className="text-accent-red">M</span> Factory
            </h1>
            <p className="text-gray-600">Admin Login</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive"
                autoFocus
              />
            </div>
            
            {authError && (
              <p className="text-red-600 text-sm text-center">{authError}</p>
            )}
            
            <button
              type="submit"
              className="w-full px-4 py-3 bg-olive text-white font-semibold rounded-xl hover:bg-olive/90 transition-colors"
            >
              Login
            </button>
          </form>
          
          <p className="text-center text-gray-500 text-sm mt-6">
            <a href="/" className="text-olive hover:underline">← Back to website</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-charcoal text-white py-3 px-4 md:py-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="text-olive">M</span>&<span className="text-accent-red">M</span> Admin
            </h1>
            <p className="text-white/60 text-xs md:text-sm hidden sm:block">Order Management</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-olive/20 text-olive' : 'bg-white/10 text-white/50'}`}
              title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button 
              onClick={fetchOrders}
              className="p-2 md:px-4 md:py-2 text-sm font-semibold border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <span className="hidden md:inline">↻ Refresh</span>
              <span className="md:hidden">↻</span>
            </button>
            <a href="/" className="text-white/80 hover:text-white text-sm hidden sm:inline">
              ← Site
            </a>
            <button
              onClick={handleLogout}
              className="p-2 md:px-3 md:py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <span className="hidden md:inline">Logout</span>
              <span className="md:hidden">⏻</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 md:p-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Orders</p>
            <p className="text-2xl font-bold text-charcoal">{todaysOrderCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Sales</p>
            <p className="text-2xl font-bold text-olive">{formatCurrency(todaysSales)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">💳 Paid Online</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(todaysPaidOnlineTotal)}</p>
            <p className="text-xs text-gray-400">{todaysPaidOnline.length} orders</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">💵 Due at Pickup</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(todaysPayAtPickupTotal)}</p>
            <p className="text-xs text-gray-400">{todaysPayAtPickup.length} orders</p>
          </div>
        </div>

        {/* Search Bar and Date Filter */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {/* Date Filter - Only shows in history view */}
          {viewMode === 'history' && (
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute -right-2 -top-2 w-5 h-5 bg-gray-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setViewMode('active'); setFilterStatus('all'); }}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'active' 
                ? 'bg-charcoal text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔥 Active
            <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${viewMode === 'active' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => { setViewMode('history'); setFilterStatus('all'); }}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'history' 
                ? 'bg-charcoal text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 History
            <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${viewMode === 'history' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {historyCount}
            </span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filterStatus === 'all' ? 'bg-charcoal text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {(viewMode === 'active' ? STATUS_OPTIONS.slice(0, 4) : STATUS_OPTIONS.slice(4)).map(status => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === status.value 
                  ? `${status.color} ring-2 ring-offset-1 ring-gray-300` 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.label} ({statusCounts[status.value] || 0})
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Orders List */}
          <div className={`space-y-2 ${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-olive border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                <p className="text-4xl mb-4">🍕</p>
                <p>No {viewMode === 'active' ? 'active' : 'completed'} orders</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const timeInfo = getTimeElapsed(order.created_at);
                const isSelected = selectedOrder?.id === order.id;
                const nextStatus = getNextStatus(order.status);
                
                return (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                      isSelected ? 'ring-2 ring-royal-blue bg-royal-blue/5' : ''
                    }`}
                  >
                    {/* Compact Order Card */}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-charcoal">{order.order_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {order.payment_status === 'paid' ? '💳 Paid' : '💵 Pay@Pickup'}
                            </span>
                            {timeInfo.isUrgent && <span className="text-red-500">⚠️</span>}
                          </div>
                          <p className="text-gray-700 font-medium text-sm truncate">{order.customer_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-olive">{formatCurrency(order.total)}</p>
                          <p className={`text-xs ${timeInfo.isUrgent ? 'text-red-500' : 'text-gray-400'}`}>{timeInfo.text}</p>
                        </div>
                      </div>
                      
                      {/* Quick action for mobile when not selected */}
                      {!isSelected && viewMode === 'active' && nextStatus && (
                        <div className="mt-2 pt-2 border-t border-gray-100 lg:hidden">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, nextStatus); }}
                            disabled={updatingOrderId === order.id}
                            className="w-full px-3 py-2 bg-olive text-white text-sm font-medium rounded-lg hover:bg-olive/90 transition-colors disabled:opacity-50"
                          >
                            {updatingOrderId === order.id ? 'Updating...' : `✓ Mark ${nextStatus}`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Details Sidebar - Desktop */}
          <div className={`hidden lg:block ${selectedOrder ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <div className="bg-white rounded-2xl shadow-sm sticky top-24 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {/* Header with Order Info */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                <h2 className="font-bold text-charcoal">Order Details</h2>
                {selectedOrder && (
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {selectedOrder ? (
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {/* Order Header */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Order Number</p>
                          <p className="text-xl font-bold text-charcoal">{selectedOrder.order_number}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedOrder.payment_status === 'paid' ? '💳 Paid Online' : '💵 Pay at Pickup'}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-charcoal">{selectedOrder.customer_name}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                        {selectedOrder.customer_email && <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>}
                      </div>
                    </div>

                    {/* Pickup Time - Editable for active orders */}
                    {ACTIVE_STATUSES.includes(selectedOrder.status) && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pickup Time</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {editingPickupTime === selectedOrder.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                              value={newPickupTime}
                              onChange={(e) => setNewPickupTime(e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg text-sm"
                            />
                            <button onClick={() => updatePickupTime(selectedOrder.id)} className="px-3 py-2 bg-olive text-white rounded-lg text-sm">Save</button>
                            <button onClick={() => setEditingPickupTime(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatPickupTime(selectedOrder.estimated_pickup_time)}</span>
                            <button
                              onClick={() => { setEditingPickupTime(selectedOrder.id); setNewPickupTime(selectedOrder.estimated_pickup_time || ''); }}
                              className="text-sm text-royal-blue hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Items ({selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)})</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.quantity}× {item.menuItemName}</span>
                            <span className="text-olive font-semibold">{formatCurrency(item.itemTotal)}</span>
                          </div>
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">+ {item.extras.map(e => e.extraName).join(', ')}</p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-xs text-orange-600 italic mt-1">📝 {item.specialInstructions}</p>
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
                    {/* Payment Status */}
                    <div className={`mt-3 p-3 rounded-lg ${selectedOrder.payment_status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
                          {selectedOrder.payment_status === 'paid' ? '✓ Payment Received' : '⏳ Payment Due at Pickup'}
                        </span>
                        {selectedOrder.payment_status === 'paid' && selectedOrder.payment_intent_id && (
                          <span className="text-xs text-gray-400">ID: ...{selectedOrder.payment_intent_id.slice(-8)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes - Editable for active orders */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Notes</p>
                      {ACTIVE_STATUSES.includes(selectedOrder.status) && editingNotes !== selectedOrder.id && (
                        <button
                          onClick={() => { setEditingNotes(selectedOrder.id); setNewNotes(selectedOrder.notes || ''); }}
                          className="text-xs text-royal-blue hover:underline"
                        >
                          {selectedOrder.notes ? 'Edit' : 'Add note'}
                        </button>
                      )}
                    </div>
                    {editingNotes === selectedOrder.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Add internal notes..."
                        />
                        <div className="flex gap-2">
                          <button onClick={() => updateNotes(selectedOrder.id)} className="px-3 py-2 bg-olive text-white rounded-lg text-sm">Save</button>
                          <button onClick={() => setEditingNotes(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : selectedOrder.notes ? (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No notes</p>
                    )}
                  </div>

                  {/* Status Change Options */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Change Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.filter(s => s.value !== 'cancelled').map(status => (
                        <button
                          key={status.value}
                          onClick={() => updateStatus(selectedOrder.id, status.value)}
                          disabled={selectedOrder.status === status.value || updatingOrderId === selectedOrder.id}
                          className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                            selectedOrder.status === status.value
                              ? 'bg-olive text-white ring-2 ring-olive ring-offset-2'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } disabled:cursor-not-allowed`}
                        >
                          {selectedOrder.status === status.value && '✓ '}{status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cancel Order */}
                  {ACTIVE_STATUSES.includes(selectedOrder.status) && (
                    <div className="pt-4 border-t border-red-100">
                      <button
                        onClick={() => setCancellingOrder(selectedOrder)}
                        disabled={updatingOrderId === selectedOrder.id}
                        className="w-full px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-red-200"
                      >
                        ✕ Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 flex-1">
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

      {/* Mobile Order Details Modal */}
      {selectedOrder && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedOrder(null)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-charcoal">Order {selectedOrder.order_number}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
            </div>
            <div className="p-4 space-y-4 pb-8">
              {/* Quick Action */}
              {getNextStatus(selectedOrder.status) && ACTIVE_STATUSES.includes(selectedOrder.status) && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                  disabled={updatingOrderId === selectedOrder.id}
                  className="w-full px-4 py-3 bg-olive text-white font-semibold rounded-xl hover:bg-olive/90 transition-colors disabled:opacity-50"
                >
                  {updatingOrderId === selectedOrder.id ? 'Updating...' : `✓ Mark ${getNextStatus(selectedOrder.status)!.charAt(0).toUpperCase() + getNextStatus(selectedOrder.status)!.slice(1)}`}
                </button>
              )}

              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold">{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.quantity}× {item.menuItemName}</span>
                      <span className="text-olive font-semibold">{formatCurrency(item.itemTotal)}</span>
                    </div>
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">+ {item.extras.map(e => e.extraName).join(', ')}</p>
                    )}
                    {item.specialInstructions && <p className="text-xs text-orange-600 mt-1">📝 {item.specialInstructions}</p>}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between font-bold text-lg border-t pt-4">
                <span>Total</span>
                <span className="text-olive">{formatCurrency(selectedOrder.total)}</span>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 uppercase">Notes</p>
                  <p className="text-sm text-yellow-800 mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Options */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.filter(s => s.value !== 'cancelled').map(status => (
                    <button
                      key={status.value}
                      onClick={() => updateStatus(selectedOrder.id, status.value)}
                      disabled={selectedOrder.status === status.value || updatingOrderId === selectedOrder.id}
                      className={`px-3 py-3 rounded-xl text-sm font-medium ${
                        selectedOrder.status === status.value ? `${status.color} ring-2` : 'bg-gray-100 text-gray-600'
                      } disabled:opacity-50`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancel */}
              {ACTIVE_STATUSES.includes(selectedOrder.status) && (
                <button
                  onClick={() => setCancellingOrder(selectedOrder)}
                  className="w-full px-4 py-3 text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                >
                  ✕ Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-red-50 px-6 py-5 border-b border-red-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Order?</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Order #{cancellingOrder.id.slice(-6).toUpperCase()}</p>
                  <p className="font-semibold text-gray-900">{cancellingOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{cancellingOrder.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-olive">{formatCurrency(cancellingOrder.total)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(cancellingOrder.status)}`}>
                    {cancellingOrder.status.charAt(0).toUpperCase() + cancellingOrder.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Warning Message */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this order? The customer will need to be notified and any prepared items may go to waste.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={async () => {
                  await updateStatus(cancellingOrder.id, 'cancelled');
                  setCancellingOrder(null);
                }}
                disabled={updatingOrderId === cancellingOrder.id}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updatingOrderId === cancellingOrder.id ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
