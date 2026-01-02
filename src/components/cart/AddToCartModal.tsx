// Modal for adding item to cart with extras selection

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { useCartStore } from '../../stores/cartStore';
import type { MenuItem, Extra, CartItemExtra } from '../../types';
import { DEFAULT_PIZZA_EXTRAS, getExtrasByCategory } from '../../types/menu';
import { formatCurrency, cn } from '../../utils/format';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
}

export function AddToCartModal({ isOpen, onClose, menuItem }: AddToCartModalProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Map<string, number>>(new Map());
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Reset state when modal opens with new item
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedExtras(new Map());
      setSpecialInstructions('');
    }
  }, [isOpen, menuItem?.id]);
  
  if (!menuItem) return null;
  
  // Get available extras based on item category
  const availableExtras = menuItem.category === 'pizza' || menuItem.category === 'calzone'
    ? DEFAULT_PIZZA_EXTRAS
    : [];
  
  // Group extras by category
  const toppingExtras = getExtrasByCategory('topping');
  const cheeseExtras = getExtrasByCategory('cheese');
  const sauceExtras = getExtrasByCategory('sauce');
  const otherExtras = getExtrasByCategory('other');
  
  const toggleExtra = (extra: Extra) => {
    setSelectedExtras(prev => {
      const newMap = new Map(prev);
      if (newMap.has(extra.id)) {
        newMap.delete(extra.id);
      } else {
        newMap.set(extra.id, 1);
      }
      return newMap;
    });
  };
  
  const updateExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras(prev => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(extraId) || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        newMap.delete(extraId);
      } else {
        newMap.set(extraId, newQty);
      }
      return newMap;
    });
  };
  
  // Calculate total price
  const extrasTotal = Array.from(selectedExtras.entries()).reduce((sum, [extraId, qty]) => {
    const extra = DEFAULT_PIZZA_EXTRAS.find(e => e.id === extraId);
    return sum + (extra ? extra.price * qty : 0);
  }, 0);
  const itemTotal = (menuItem.price + extrasTotal) * quantity;
  
  const handleAddToCart = () => {
    const cartExtras: CartItemExtra[] = Array.from(selectedExtras.entries())
      .map(([extraId, qty]) => {
        const extra = DEFAULT_PIZZA_EXTRAS.find(e => e.id === extraId)!;
        return { extra, quantity: qty };
      })
      .filter(e => e.extra);
    
    addItem(menuItem, quantity, cartExtras, specialInstructions || undefined);
    onClose();
  };
  
  const renderExtraCategory = (title: string, extras: Extra[]) => {
    if (extras.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-2">
          {extras.map(extra => {
            const isSelected = selectedExtras.has(extra.id);
            const qty = selectedExtras.get(extra.id) || 0;
            
            return (
              <div
                key={extra.id}
                className={cn(
                  'border rounded-lg p-2 cursor-pointer transition-all',
                  isSelected
                    ? 'border-olive bg-olive/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => !isSelected && toggleExtra(extra)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm text-charcoal">{extra.name}</span>
                  <span className="text-xs text-olive font-medium">
                    +{formatCurrency(extra.price)}
                  </span>
                </div>
                
                {isSelected && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateExtraQuantity(extra.id, -1);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xs"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{qty}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateExtraQuantity(extra.id, 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xs"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Your Order"
      size="lg"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Item Info */}
        <div className="flex gap-4 mb-6 pb-4 border-b border-gray-100">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={menuItem.image}
              alt={menuItem.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-charcoal">{menuItem.name}</h3>
            {menuItem.nameIt && (
              <p className="text-sm text-gray-500 italic">{menuItem.nameIt}</p>
            )}
            <p className="text-olive font-semibold mt-1">
              {formatCurrency(menuItem.price)}
            </p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {menuItem.description}
            </p>
          </div>
        </div>
        
        {/* Quantity Selector */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Quantity</h4>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-xl"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-xl"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Extras (only for pizza/calzone) */}
        {availableExtras.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Extras</h4>
            {renderExtraCategory('Toppings', toppingExtras)}
            {renderExtraCategory('Cheese', cheeseExtras)}
            {renderExtraCategory('Sauces', sauceExtras)}
            {renderExtraCategory('Other', otherExtras)}
          </div>
        )}
        
        {/* Special Instructions */}
        <div className="mb-6">
          <Textarea
            label="Special Instructions (optional)"
            placeholder="Any allergies or special requests?"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
          />
        </div>
      </div>
      
      {/* Footer with total and add button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-olive">{formatCurrency(itemTotal)}</p>
        </div>
        <Button onClick={handleAddToCart} size="lg">
          Add to Cart
        </Button>
      </div>
    </Modal>
  );
}

export default AddToCartModal;
