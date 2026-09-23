import React from 'react';
export function SavedLocations({ addresses = [], onSelect }) {
  return (
    <div className="space-y-2">
      {addresses.map(a => (
        <button key={a.id} onClick={() => onSelect?.(a)} className="w-full p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-left text-xs">
          <strong>{a.tag}:</strong> {a.flat}, {a.city}
        </button>
      ))}
    </div>
  );
}
