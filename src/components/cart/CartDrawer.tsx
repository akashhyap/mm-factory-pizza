// Cart drawer showing all items and checkout button

import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { CartItem } from './CartItem';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../utils/format';

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, clearCart, getSubtotal, getTax, getTotal } = useCartStore();
  
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const isEmpty = items.length === 0;
  
  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title="Your Order"
      position="right"
      width="md"
    >
      {isEmpty ? (
        // Empty cart state
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">Your cart is empty</h3>
          <p className="text-gray-500 text-sm mb-4">Add some delicious items from our menu!</p>
          <Button onClick={() => { closeDrawer(); window.location.href = '/menu'; }} variant="secondary">
            Browse Menu
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 -mx-4 px-4 overflow-y-auto">
            {items.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          
          {/* Clear Cart */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-accent-red transition-colors"
            >
              Clear cart
            </button>
          </div>
          
          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-charcoal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT (21%)</span>
              <span className="text-charcoal">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
              <span className="text-charcoal">Total</span>
              <span className="text-olive">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Checkout Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                closeDrawer();
                window.location.href = '/checkout';
              }}
            >
              Proceed to Checkout
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Pickup only • Pay online
            </p>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default CartDrawer;
