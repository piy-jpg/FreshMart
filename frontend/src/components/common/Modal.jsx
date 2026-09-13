import React from 'react';
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <h3 className="font-bold text-base text-stone-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 text-lg font-bold">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
