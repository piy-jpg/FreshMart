import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';

export function CartItem({ item }) {
  const { addItem, removeItem } = useCart();
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
      <div className="flex items-center gap-3">
        <img src={item.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100'} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white" />
        <div>
          <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{item.name}</h4>
          <span className="text-[11px] font-bold text-emerald-800">{formatCurrency(item.price)} × {item.qty}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-rose-600 text-xs font-bold">🗑️</button>
      </div>
    </div>
  );
}
