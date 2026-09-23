import React from 'react';
import { useLocation } from '../../hooks/useLocation';

export function LocationSelector({ onClick }) {
  const { location } = useLocation();
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-left bg-stone-50 hover:bg-emerald-50 px-3 py-1.5 rounded-2xl border border-stone-200 text-xs transition cursor-pointer">
      <span className="text-emerald-700">📍</span>
      <div className="leading-tight">
        <span className="block font-bold text-stone-900 text-[11px]">{location?.shortAddress || 'Select Delivery Location'}</span>
        <span className="text-[9px] text-stone-400 font-medium">{location?.pincode ? `PIN: ${location.pincode} • 90 Mins` : 'Detect Location'}</span>
      </div>
    </button>
  );
}
