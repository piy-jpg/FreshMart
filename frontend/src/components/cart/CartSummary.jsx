import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { FREE_DELIVERY_THRESHOLD } from '../../config/constants';

export function CartSummary({ onCheckout }) {
  const { subtotal, itemCount } = useCart();
  const fee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 30;
  const total = subtotal + fee;

  return (
    <div className="space-y-2.5 pt-3 border-t border-stone-200 text-xs">
      <div className="flex justify-between text-stone-600">
        <span>Items Subtotal</span>
        <strong className="text-stone-900">{formatCurrency(subtotal)}</strong>
      </div>
      <div className="flex justify-between text-stone-600">
        <span>Delivery Fee</span>
        <span className={fee === 0 ? 'text-emerald-700 font-bold' : 'text-stone-900'}>{fee === 0 ? 'FREE' : formatCurrency(fee)}</span>
      </div>
      <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
        <span>Total Payable</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <button
        onClick={onCheckout}
        disabled={itemCount === 0}
        className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold text-xs transition shadow-xs cursor-pointer mt-3"
      >
        Proceed to Express Checkout →
      </button>
    </div>
  );
}
