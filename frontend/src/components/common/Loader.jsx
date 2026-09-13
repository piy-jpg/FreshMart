import React from 'react';
export function Loader({ text = 'Loading Fresh Harvest...' }) {
  return (
    <div className="p-8 text-center text-stone-400 text-xs font-medium flex flex-col items-center gap-2">
      <span className="animate-spin text-2xl">⏳</span>
      <span>{text}</span>
    </div>
  );
}
