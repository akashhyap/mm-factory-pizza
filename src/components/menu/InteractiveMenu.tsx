// Interactive Menu Grid - React component with Add to Cart functionality

import React from 'react';
import type { MenuItem } from '../../types';
import { MenuItemCard } from './MenuItemCard';

interface InteractiveMenuProps {
  pizzas?: MenuItem[];
  calzones?: MenuItem[];
  showPizzas?: boolean;
  showCalzones?: boolean;
}

export function InteractiveMenu({ 
  pizzas = [], 
  calzones = [], 
  showPizzas = true, 
  showCalzones = true 
}: InteractiveMenuProps) {
  return (
    <div className="space-y-16">
      {/* Pizzas Section */}
      {showPizzas && pizzas.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-accent-red rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" strokeWidth="1.5"/>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="14" cy="9" r="1" fill="currentColor"/>
                <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-charcoal">Pizzas</h3>
              <p className="text-warm-gray text-sm">31 varieties to choose from</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pizzas.map((pizza) => (
              <MenuItemCard key={pizza.id} item={pizza} />
            ))}
          </div>
        </div>
      )}
      
      {/* Calzones Section */}
      {showCalzones && calzones.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-olive rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9c0-2.5-1-4.8-2.6-6.4"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3c2 0 6 4 6 9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-charcoal">Calzones</h3>
              <p className="text-warm-gray text-sm">Folded pizza perfection</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {calzones.map((calzone) => (
              <MenuItemCard key={calzone.id} item={calzone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveMenu;
