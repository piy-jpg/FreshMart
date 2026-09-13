import React from 'react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

export function ProductCard({ product }) {
  const { addItem } = useCart();
  return (
    <div className="p-4 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between">
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-3">
          <img src={product.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300'} alt={product.name} className="w-full h-full object-cover" />
          {product.badge && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              {product.badge}
            </span>
          )}
        </div>
        <h3 className="font-bold text-xs text-stone-900 line-clamp-1">{product.name}</h3>
        <p className="text-[10px] text-stone-400 mt-0.5">{product.unit || '1 kg'} • {product.origin || 'FreshMart Farm'}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="font-bold text-sm text-stone-900">{formatCurrency(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[10px] text-stone-400 line-through ml-1.5">{formatCurrency(product.mrp)}</span>
          )}
        </div>
        <button
          onClick={() => addItem(product)}
          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
