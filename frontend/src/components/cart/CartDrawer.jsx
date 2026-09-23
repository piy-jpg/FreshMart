import React from 'react';
import { useCart } from '../../hooks/useCart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useNavigate } from 'react-router-dom';

export function CartDrawer({ isOpen, onClose }) {
  const { cart, itemCount } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <h3 className="font-bold text-base text-stone-900">Your Fresh Basket ({itemCount})</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-800 text-lg font-bold">&times;</button>
          </div>

          <div className="space-y-3">
            {Object.values(cart).length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">Your basket is empty.</div>
            ) : (
              Object.values(cart).map(it => <CartItem key={it.id} item={it} />)
            )}
          </div>
        </div>

        <CartSummary onCheckout={handleCheckout} />
      </div>
    </div>
  );
}
