import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
export function OrderSummary({ items = [], total = 0 }) {
  return (
    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
      <h4 className="font-bold text-stone-900">Order Items ({items.length})</h4>
      {items.map(it => (
        <div key={it.id} className="flex justify-between text-stone-600">
          <span>{it.name} × {it.qty}</span>
          <span>{formatCurrency(it.price * it.qty)}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
