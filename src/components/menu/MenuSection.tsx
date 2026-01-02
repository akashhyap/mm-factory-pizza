// Menu section with item grid - React wrapper

import React from 'react';
import type { MenuItem } from '../../types';
import { MenuItemCard } from './MenuItemCard';

interface MenuSectionProps {
  title: string;
  titleIt?: string;
  items: MenuItem[];
}

export function MenuSection({ title, titleIt, items }: MenuSectionProps) {
  if (items.length === 0) return null;
  
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-charcoal">{title}</h2>
        {titleIt && (
          <p className="text-lg text-gray-500 italic mt-1">{titleIt}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default MenuSection;
