// Individual cart item display with quantity controls

import React from 'react';
import type { CartItem as CartItemType } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../utils/format';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCartStore();
  
  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };
  
  const handleIncrement = () => {
    updateItemQuantity(item.id, item.quantity + 1);
  };
  
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-b-0">
      {/* Item Image */}
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={item.menuItem.image}
          alt={item.menuItem.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-charcoal truncate pr-2">
            {item.menuItem.name}
          </h4>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1 text-gray-400 hover:text-accent-red transition-colors"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Extras */}
        {item.selectedExtras.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {item.selectedExtras.map((extra, idx) => (
              <span key={extra.extra.id}>
                {extra.quantity > 1 && `${extra.quantity}× `}
                {extra.extra.name}
                {idx < item.selectedExtras.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
        
        {/* Special Instructions */}
        {item.specialInstructions && (
          <p className="mt-1 text-xs text-gray-500 italic truncate">
            "{item.specialInstructions}"
          </p>
        )}
        
        {/* Quantity & Price */}
        <div className="flex justify-between items-center mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-charcoal"
              aria-label="Decrease quantity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center font-medium text-charcoal">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-charcoal"
              aria-label="Increase quantity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* Delete Button */}
            <button
              onClick={() => removeItem(item.id)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors text-accent-red ml-1"
              aria-label="Delete item"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          {/* Item Total */}
          <span className="font-semibold text-charcoal">
            {formatCurrency(item.itemTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
