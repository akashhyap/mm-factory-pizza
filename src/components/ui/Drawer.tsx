// Slide-out Drawer component

import React, { useEffect, useCallback } from 'react';
import { cn } from '../../utils/format';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'full';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'md',
}: DrawerProps) {
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);
  
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer panel */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-full bg-white shadow-xl flex flex-col',
          'transition-transform duration-300 ease-out',
          widthClasses[width],
          position === 'right' ? 'right-0' : 'left-0',
          position === 'right'
            ? isOpen ? 'translate-x-0' : 'translate-x-full'
            : isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {title && (
            <h2 id="drawer-title" className="text-xl font-bold text-charcoal">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-auto"
            aria-label="Close drawer"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}

export default Drawer;
