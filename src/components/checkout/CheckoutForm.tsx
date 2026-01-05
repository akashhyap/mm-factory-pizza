// Checkout page component with customer form and Stripe payment

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../../stores/cartStore';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { CartItem } from '../cart/CartItem';
import { formatCurrency, isValidIrishPhone, isValidEmail, getEstimatedPickupTime, formatTime, generateId } from '../../utils/format';
import { createOrder, type OrderItemJson } from '../../lib/supabase';
import { cartItemsToOrderItems } from '../../types/order';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

type PaymentMethod = 'card' | 'pickup';

export function CheckoutForm() {
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [wasCancelled, setWasCancelled] = useState(false);
  
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const isEmpty = items.length === 0;
  const estimatedPickup = getEstimatedPickupTime(25);

  // Check if payment was cancelled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === 'true') {
      setWasCancelled(true);
      toast.error('Payment was cancelled. You can try again.');
      // Clean up URL
      window.history.replaceState({}, '', '/checkout');
    }
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidIrishPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required for order updates';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate order number
      const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;
      
      // Convert cart items to order items format
      const orderItems: OrderItemJson[] = items.map(item => ({
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

      // If paying with card, redirect to Stripe
      if (paymentMethod === 'card') {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            customerEmail: formData.email.trim() || undefined,
            notes: formData.notes.trim() || undefined,
            orderNumber,
            subtotal,
            tax,
            total,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Store order info for after payment
        sessionStorage.setItem('pendingOrderNumber', orderNumber);
        sessionStorage.setItem('pendingOrderItems', JSON.stringify(orderItems));
        sessionStorage.setItem('pendingOrderData', JSON.stringify({
          customerName: formData.name.trim(),
          customerPhone: formData.phone.trim(),
          customerEmail: formData.email.trim() || '',
          notes: formData.notes.trim() || '',
          subtotal,
          tax,
          total,
        }));

        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }
      
      // Pay at pickup - create order directly
      const { data, error } = await createOrder({
        orderNumber,
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim() || undefined,
        items: orderItems,
        subtotal,
        tax,
        total,
        notes: formData.notes.trim() || undefined,
      });
      
      if (error) {
        console.error('Order creation error:', error);
        toast.error('Failed to place order. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Send confirmation email to customer
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_placed',
            customerEmail: formData.email.trim(),
            order: {
              orderNumber,
              customerName: formData.name.trim(),
              items: orderItems,
              subtotal,
              tax,
              total,
              paymentStatus: 'pending',
            }
          }),
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't block order completion if email fails
      }
      
      // Send notification email to admin
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'admin_notification',
            order: {
              orderNumber,
              customerName: formData.name.trim(),
              customerPhone: formData.phone.trim(),
              customerEmail: formData.email.trim(),
              items: orderItems,
              subtotal,
              tax,
              total,
              paymentStatus: 'pending',
              notes: formData.notes.trim() || null,
            }
          }),
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }
      
      // Success!
      toast.success('Order placed successfully!');
      
      // Store order number for confirmation page
      sessionStorage.setItem('lastOrderNumber', orderNumber);
      sessionStorage.setItem('lastOrderTotal', total.toString());
      sessionStorage.setItem('lastPaymentMethod', 'pickup');
      
      // Clear cart and redirect
      clearCart();
      window.location.href = '/order-confirmation';
      
    } catch (err: any) {
      console.error('Order submission error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  if (isEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious items from our menu to get started!</p>
        <Button onClick={() => window.location.href = '/menu'} variant="primary" size="lg">
          Browse Menu
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left side - Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-charcoal mb-6">Your Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                required
              />
              
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+353 87 123 4567"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                helperText="We'll send you an SMS when your order is ready"
                required
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                helperText="We'll send order updates to this email"
                required
              />
              
              <Textarea
                label="Special Instructions (optional)"
                name="notes"
                placeholder="Any special requests or instructions for your order?"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
              
              {/* Estimated Pickup Time */}
              <div className="bg-olive/5 rounded-xl p-4 border border-olive/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Pickup Time</p>
                    <p className="text-lg font-bold text-olive">{formatTime(estimatedPickup)}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                
                {/* Pay with Card */}
                <div
                  className="w-full p-4 rounded-xl border-2 border-olive bg-olive/5 text-left flex items-center gap-4"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-olive flex items-center justify-center">
                    <div className="w-3 h-3 bg-olive rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="font-medium text-charcoal">Pay with Card</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Secure payment via Stripe</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4" />
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
              >
                Pay Now • {formatCurrency(total)}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Right side - Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold text-charcoal mb-4">Order Summary</h3>
            
            {/* Cart Items */}
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto -mx-2 px-2">
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            
            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-charcoal">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (21%)</span>
                <span className="text-charcoal">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                <span className="text-charcoal">Total</span>
                <span className="text-olive">{formatCurrency(total)}</span>
              </div>
            </div>
            
            {/* Continue Shopping */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.href = '/#menu'}
              >
                ← Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;
