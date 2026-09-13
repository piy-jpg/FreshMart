import React from 'react';
export function DeliveryOptions({ selectedSlot, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div onClick={() => onSelect('EXPRESS')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${selectedSlot === 'EXPRESS' ? 'border-emerald-600 bg-emerald-50/50 font-bold' : 'border-stone-200'}`}>
        <span>⚡ Express 90-Min</span>
        <p className="text-[10px] text-stone-500 mt-0.5">Dispatched from Indiranagar Hub</p>
      </div>
      <div onClick={() => onSelect('MORNING')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${selectedSlot === 'MORNING' ? 'border-emerald-600 bg-emerald-50/50 font-bold' : 'border-stone-200'}`}>
        <span>🌅 Morning Harvest</span>
        <p className="text-[10px] text-stone-500 mt-0.5">4:00 AM – 7:00 AM Dawn Slot</p>
      </div>
    </div>
  );
}
