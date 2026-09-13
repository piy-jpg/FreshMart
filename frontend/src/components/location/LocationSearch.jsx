import React from 'react';
export function LocationSearch({ onSearch }) {
  return (
    <input
      type="text"
      placeholder="Enter delivery locality, pincode or flat..."
      onChange={e => onSearch?.(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs outline-none focus:border-emerald-600"
    />
  );
}
