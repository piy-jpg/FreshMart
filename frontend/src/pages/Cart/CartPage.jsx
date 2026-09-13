import React from 'react';
import { useCart } from '../../hooks/useCart';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { useNavigate } from 'react-router-dom';

export function CartPage() {
  const { cart } = useCart();
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-stone-900">Your Fresh Basket</h1>
      <div className="space-y-3">
        {Object.values(cart).map(it => <CartItem key={it.id} item={it} />)}
      </div>
      <CartSummary onCheckout={() => navigate('/checkout')} />
    </div>
  );
}
