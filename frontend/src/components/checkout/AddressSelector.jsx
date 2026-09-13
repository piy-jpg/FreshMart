import React from 'react';
export function AddressSelector({ selectedId, onSelect }) {
  const addresses = [
    { id: 'addr_1', tag: 'Home', flat: 'Flat 402, Green Glen', city: 'Indiranagar, Bengaluru', pin: '560038' }
  ];
  return (
    <div className="space-y-2">
      {addresses.map(a => (
        <div key={a.id} onClick={() => onSelect(a.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition ${selectedId === a.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-stone-200 bg-white'}`}>
          <span className="font-bold text-xs text-stone-900">{a.tag}</span>
          <p className="text-xs text-stone-600 mt-1">{a.flat}, {a.city} - {a.pin}</p>
        </div>
      ))}
    </div>
  );
}
