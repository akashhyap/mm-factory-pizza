// Checkout page component with customer form

import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { CartItem } from '../cart/CartItem';
import { formatCurrency, isValidIrishPhone, isValidEmail, getEstimatedPickupTime, formatTime, generateId } from '../../utils/format';
import { createOrder, type OrderItemJson } from '../../lib/supabase';
import { cartItemsToOrderItems } from '../../types/order';
import toast from 'react-hot-toast';

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

export function CheckoutForm() {
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const isEmpty = items.length === 0;
  const estimatedPickup = getEstimatedPickupTime(25);
  
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
    
    if (formData.email && !isValidEmail(formData.email)) {
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
      
      // Save order to Supabase
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
      
      // Success!
      toast.success('Order placed successfully!');
      
      // Store order number for confirmation page
      sessionStorage.setItem('lastOrderNumber', orderNumber);
      sessionStorage.setItem('lastOrderTotal', total.toString());
      
      // Clear cart and redirect
      clearCart();
      window.location.href = '/order-confirmation';
      
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error('Something went wrong. Please try again.');
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
        <Button onClick={() => window.location.href = '/#menu'} variant="primary" size="lg">
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
                label="Email (optional)"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                helperText="For order confirmation"
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
              
              {/* Payment Info */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-royal-blue mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-royal-blue">Secure Payment Coming Soon</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Online payment will be available shortly. For now, please pay at pickup.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
              >
                Place Order • {formatCurrency(total)}
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
