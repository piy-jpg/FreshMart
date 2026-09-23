import React from 'react';
export function CurrentLocation({ onDetect }) {
  return (
    <button onClick={onDetect} className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition flex items-center justify-center gap-2">
      <span>🛰️</span> Detect GPS Location
    </button>
  );
}
