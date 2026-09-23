import React from 'react';
export function SearchBar({ value, onChange, placeholder = 'Search farm-fresh vegetables, fruits...' }) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-100 border border-transparent focus:border-emerald-600 focus:bg-white text-xs outline-none transition-all"
      />
      <span className="absolute left-3 top-3 text-stone-400 text-xs">🔍</span>
    </div>
  );
}
