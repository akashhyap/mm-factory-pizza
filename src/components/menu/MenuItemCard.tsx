// Interactive menu item card with Add to Cart button

import React, { useState } from 'react';
import type { MenuItem } from '../../types';
import { AddToCartModal } from '../cart/AddToCartModal';
import { formatCurrency, cn } from '../../utils/format';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {item.isVegetarian && (
              <span className="px-2 py-1 bg-olive text-white text-xs font-semibold rounded-full">
                🌱 Veg
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2 py-1 bg-accent-red text-white text-xs font-semibold rounded-full">
                🌶️ Spicy
              </span>
            )}
            {item.isPopular && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                ⭐ Popular
              </span>
            )}
          </div>
          
          {/* Price Badge */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-olive font-bold rounded-full shadow-md">
              {formatCurrency(item.price)}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-charcoal mb-1">{item.name}</h3>
          {item.nameIt && (
            <p className="text-sm text-gray-500 italic mb-2">{item.nameIt}</p>
          )}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {item.description}
          </p>
          
          {/* Add to Cart Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200',
              'bg-royal-blue text-white hover:bg-royal-blue/90',
              'focus:outline-none focus:ring-2 focus:ring-royal-blue focus:ring-offset-2'
            )}
          >
            Add to Cart
          </button>
        </div>
      </div>
      
      {/* Add to Cart Modal */}
      <AddToCartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItem={item}
      />
    </>
  );
}

export default MenuItemCard;
