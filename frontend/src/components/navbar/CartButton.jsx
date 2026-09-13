import React from 'react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

export function CartButton({ onClick }) {
  const { itemCount, subtotal } = useCart();
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer">
      <span>🧺</span>
      <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
      <span className="opacity-60">•</span>
      <span>{formatCurrency(subtotal)}</span>
    </button>
  );
}
