// Interactive Menu Grid - React component with Add to Cart functionality

import React from 'react';
import type { MenuItem } from '../../types';
import { MenuItemCard } from './MenuItemCard';

// Menu data converted to MenuItem format
const featuredPizzas: MenuItem[] = [
  { 
    id: 'pizza-1',
    name: "Margherita", 
    nameIt: "Margherita",
    description: "Classic pizza with tomato sauce and mozzarella cheese", 
    descriptionIt: "Tomate y mozzarella",
    price: 9.50,
    category: 'pizza',
    isVegetarian: true,
    isPopular: true,
    image: '/src/assets/margherita.jpg'
  },
  { 
    id: 'pizza-7',
    name: "4 Stagioni", 
    nameIt: "Quattro Stagioni",
    description: "Tomato sauce, mozzarella, ham, mushrooms, salami, artichokes", 
    descriptionIt: "Tomate, mozzarella, jamón, champiñones, salami, alcachofas",
    price: 9.50,
    category: 'pizza',
    isVegetarian: false,
    image: '/src/assets/4-stagion.jpg'
  },
  { 
    id: 'pizza-14',
    name: "Vegetariana", 
    nameIt: "Vegetariana",
    description: "Tomato sauce, mozzarella, fresh vegetables and basil oil", 
    descriptionIt: "Tomate, mozzarella, verduras frescas y aceite de albahaca",
    price: 9.50,
    category: 'pizza',
    isVegetarian: true,
    image: '/src/assets/vegetariana.jpg'
  },
  { 
    id: 'pizza-22',
    name: "Parma", 
    nameIt: "Parma",
    description: "Tomato sauce, mozzarella, serrano ham, arugula and parmesan", 
    descriptionIt: "Tomate, mozzarella, jamón serrano, rúcula y parmesano",
    price: 9.50,
    category: 'pizza',
    isVegetarian: false,
    image: '/src/assets/parma.jpg'
  },
  { 
    id: 'pizza-18',
    name: "4 Formaggi", 
    nameIt: "Quattro Formaggi",
    description: "Tomato sauce, mozzarella and 4 mixed cheeses", 
    descriptionIt: "Tomate, mozzarella y 4 quesos variados",
    price: 9.50,
    category: 'pizza',
    isVegetarian: true,
    image: '/src/assets/4-formaggi.jpg'
  },
  { 
    id: 'pizza-23',
    name: "Islas Baleares", 
    nameIt: "Isole Baleari",
    description: "Tomato sauce, mozzarella, sobrasada, Mahon cheese and honey", 
    descriptionIt: "Tomate, mozzarella, sobrasada, queso mahón y miel",
    price: 9.50,
    category: 'pizza',
    isVegetarian: false,
    isPopular: true,
    image: '/src/assets/islas-baleares.jpg'
  },
];

const calzones: MenuItem[] = [
  { 
    id: 'calzone-32',
    name: "Clasico", 
    nameIt: "Classico",
    description: "Tomato sauce, mozzarella cheese, ham and mushrooms", 
    descriptionIt: "Tomate, mozzarella, jamón y champiñones",
    price: 9.50,
    category: 'calzone',
    isVegetarian: false,
    image: '/src/assets/calzone-calcico.jpg'
  },
  { 
    id: 'calzone-33',
    name: "Vegetariano", 
    nameIt: "Vegetariano",
    description: "Tomato sauce, mozzarella cheese and fresh vegetables", 
    descriptionIt: "Tomate, mozzarella y verduras frescas",
    price: 9.50,
    category: 'calzone',
    isVegetarian: true,
    image: '/src/assets/vegetariano-calzone.jpg'
  },
  { 
    id: 'calzone-34',
    name: "4 Formaggi", 
    nameIt: "Quattro Formaggi",
    description: "Tomato sauce, mozzarella cheese and 4 mixed cheeses", 
    descriptionIt: "Tomate, mozzarella y 4 quesos variados",
    price: 9.50,
    category: 'calzone',
    isVegetarian: true,
    image: '/src/assets/4-formaggi-calzone.jpg'
  },
];

interface InteractiveMenuProps {
  showPizzas?: boolean;
  showCalzones?: boolean;
}

export function InteractiveMenu({ showPizzas = true, showCalzones = true }: InteractiveMenuProps) {
  return (
    <div className="space-y-16">
      {/* Pizzas Section */}
      {showPizzas && (
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
            {featuredPizzas.map((pizza) => (
              <MenuItemCard key={pizza.id} item={pizza} />
            ))}
          </div>
        </div>
      )}
      
      {/* Calzones Section */}
      {showCalzones && (
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
