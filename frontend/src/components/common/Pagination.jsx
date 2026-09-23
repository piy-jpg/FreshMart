import React from 'react';
export function Pagination({ current, total, onPageChange }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${p === current ? 'bg-emerald-700 text-white' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
