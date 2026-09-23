import React, { useState } from 'react';
import { Navbar } from '../components/navbar/Navbar';
import { CartDrawer } from '../components/cart/CartDrawer';
import { LocationModal } from '../components/location/LocationModal';

export function MainLayout({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar onOpenCart={() => setCartOpen(true)} onOpenLocation={() => setLocationOpen(true)} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <LocationModal isOpen={locationOpen} onClose={() => setLocationOpen(false)} />
      <footer className="bg-emerald-950 text-white py-12 px-4 border-t border-emerald-900 mt-12 text-xs text-center text-emerald-300">
        © 2026 FreshMart Technologies Pvt. Ltd. All rights reserved. • 1800-FRESH-MART (Toll-Free)
      </footer>
    </div>
  );
}
