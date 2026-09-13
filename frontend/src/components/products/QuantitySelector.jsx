import React from 'react';
export function QuantitySelector({ quantity, onIncrement, onDecrement }) {
  return (
    <div className="inline-flex items-center border border-stone-200 rounded-xl bg-stone-50">
      <button onClick={onDecrement} className="px-2.5 py-1 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-l-xl">-</button>
      <span className="px-3 text-xs font-bold text-stone-900">{quantity}</span>
      <button onClick={onIncrement} className="px-2.5 py-1 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-r-xl">+</button>
    </div>
  );
}
