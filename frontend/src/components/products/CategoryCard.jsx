import React from 'react';
export function CategoryCard({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] capitalize">{label}</span>
    </button>
  );
}
