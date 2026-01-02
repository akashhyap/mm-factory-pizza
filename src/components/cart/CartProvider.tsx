// Cart provider wrapper that includes the CartDrawer

import React from 'react';
import { CartDrawer } from '../cart/CartDrawer';
import { Toaster } from 'react-hot-toast';

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  return (
    <>
      {children}
      <CartDrawer />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2C2C2C',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#008C45',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#CD212A',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default CartProvider;
