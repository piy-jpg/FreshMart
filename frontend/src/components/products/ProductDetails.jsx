import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';

export function ProductDetails({ product }) {
  const { addItem } = useCart();
  if (!product) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border border-stone-200">
      <div className="rounded-2xl overflow-hidden bg-stone-100 aspect-square">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="space-y-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{product.category || 'Vegetable'}</span>
          <h1 className="font-black text-2xl text-stone-900 mt-2">{product.name}</h1>
          <p className="text-xs text-stone-500 mt-1">Grown with organic practices • Dispatched in 90 Mins</p>
        </div>
        <div className="text-2xl font-black text-stone-900">
          {formatCurrency(product.price)}
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">{product.description || 'Harvested at 4:00 AM from local organic farms across Karnataka.'}</p>
        <button onClick={() => addItem(product)} className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition">
          Add to Fresh Basket 🧺
        </button>
      </div>
    </div>
  );
}
