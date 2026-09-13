import React from 'react';
export function AddressDetails({ address }) {
  return (
    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
      <span className="font-bold block text-stone-900">{address?.tag || 'Home'}</span>
      <p className="text-stone-600 mt-0.5">{address?.flat}, {address?.street}, {address?.city}</p>
    </div>
  );
}
