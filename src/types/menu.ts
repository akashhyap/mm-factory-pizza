// Menu item types for M&M Factory Pizza

export interface Extra {
  id: string;
  name: string;
  nameIt?: string; // Italian name
  price: number;
  category: 'topping' | 'cheese' | 'sauce' | 'other';
}

export interface MenuItem {
  id: string;
  name: string;
  nameIt?: string; // Italian name
  description: string;
  descriptionIt?: string; // Italian description
  price: number;
  category: 'pizza' | 'calzone' | 'sides' | 'drinks' | 'dessert';
  image: string;
  isVegetarian: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  availableExtras?: string[]; // IDs of available extras for this item
}

export interface MenuCategory {
  id: string;
  name: string;
  nameIt?: string;
  description?: string;
  items: MenuItem[];
}

// Default extras available for pizzas and calzones
export const DEFAULT_PIZZA_EXTRAS: Extra[] = [
  // Toppings
  { id: 'pepperoni', name: 'Extra Pepperoni', nameIt: 'Pepperoni Extra', price: 1.50, category: 'topping' },
  { id: 'mushrooms', name: 'Mushrooms', nameIt: 'Funghi', price: 1.00, category: 'topping' },
  { id: 'olives', name: 'Olives', nameIt: 'Olive', price: 1.00, category: 'topping' },
  { id: 'onions', name: 'Onions', nameIt: 'Cipolle', price: 0.75, category: 'topping' },
  { id: 'bell-peppers', name: 'Bell Peppers', nameIt: 'Peperoni', price: 1.00, category: 'topping' },
  { id: 'jalapenos', name: 'Jalapeños', nameIt: 'Jalapeños', price: 1.00, category: 'topping' },
  { id: 'ham', name: 'Ham', nameIt: 'Prosciutto', price: 1.50, category: 'topping' },
  { id: 'bacon', name: 'Bacon', nameIt: 'Pancetta', price: 1.50, category: 'topping' },
  { id: 'chicken', name: 'Grilled Chicken', nameIt: 'Pollo Grigliato', price: 2.00, category: 'topping' },
  { id: 'sausage', name: 'Italian Sausage', nameIt: 'Salsiccia Italiana', price: 1.50, category: 'topping' },
  { id: 'anchovies', name: 'Anchovies', nameIt: 'Acciughe', price: 1.50, category: 'topping' },
  
  // Cheese
  { id: 'extra-mozzarella', name: 'Extra Mozzarella', nameIt: 'Mozzarella Extra', price: 1.50, category: 'cheese' },
  { id: 'parmesan', name: 'Parmesan', nameIt: 'Parmigiano', price: 1.00, category: 'cheese' },
  { id: 'gorgonzola', name: 'Gorgonzola', nameIt: 'Gorgonzola', price: 1.50, category: 'cheese' },
  { id: 'ricotta', name: 'Ricotta', nameIt: 'Ricotta', price: 1.25, category: 'cheese' },
  
  // Sauces
  { id: 'extra-sauce', name: 'Extra Tomato Sauce', nameIt: 'Salsa Extra', price: 0.50, category: 'sauce' },
  { id: 'garlic-oil', name: 'Garlic Oil', nameIt: 'Olio all\'Aglio', price: 0.75, category: 'sauce' },
  { id: 'hot-sauce', name: 'Spicy Sauce', nameIt: 'Salsa Piccante', price: 0.75, category: 'sauce' },
  
  // Other
  { id: 'gluten-free-base', name: 'Gluten-Free Base', nameIt: 'Base Senza Glutine', price: 2.50, category: 'other' },
];

// Helper function to get extras by category
export function getExtrasByCategory(category: Extra['category']): Extra[] {
  return DEFAULT_PIZZA_EXTRAS.filter(extra => extra.category === category);
}

// Helper function to get extra by ID
export function getExtraById(id: string): Extra | undefined {
  return DEFAULT_PIZZA_EXTRAS.find(extra => extra.id === id);
}
