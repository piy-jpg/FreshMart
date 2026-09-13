import React from 'react';
import { Link } from 'react-router-dom';
import { LocationSelector } from './LocationSelector';
import { CartButton } from './CartButton';
import { useAuth } from '../../hooks/useAuth';

export function Navbar({ onOpenCart, onOpenLocation }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌱</span>
            <span className="font-black text-xl text-stone-900 tracking-tight">Fresh<span className="text-emerald-600">Mart</span></span>
          </Link>
          <LocationSelector onClick={onOpenLocation} />
        </div>

        <div className="flex items-center gap-3">
          <Link to="/orders" className="text-xs font-bold text-stone-700 hover:text-emerald-700 px-3 py-2 rounded-xl transition">
            My Orders
          </Link>
          {user ? (
            <Link to="/profile" className="text-xs font-bold text-stone-900 bg-stone-100 px-3 py-2 rounded-xl hover:bg-stone-200 transition">
              👤 {user.name?.split(' ')[0]}
            </Link>
          ) : (
            <Link to="/login" className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl hover:bg-emerald-100 transition">
              Sign In
            </Link>
          )}
          <CartButton onClick={onOpenCart} />
        </div>
      </div>
    </header>
  );
}
