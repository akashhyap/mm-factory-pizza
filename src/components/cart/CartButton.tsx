// Cart button with item count badge for header

import React from 'react';
import { useCartStore } from '../../stores/cartStore';

export function CartButton() {
  const { items, openDrawer } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <button
      onClick={openDrawer}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      {/* Cart Icon */}
      <svg
        className="w-6 h-6 text-charcoal"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      
      {/* Badge */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-accent-red rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default CartButton;
