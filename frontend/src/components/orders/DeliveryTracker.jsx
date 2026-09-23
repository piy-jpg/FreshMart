import React from 'react';
export function DeliveryTracker({ order }) {
  if (!order) return null;
  return (
    <div className="p-6 rounded-3xl bg-emerald-900 text-white space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-emerald-300 font-bold uppercase">Estimated Delivery</span>
        <span className="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-full font-bold">⚡ Express 90-Min</span>
      </div>
      <div className="text-3xl font-black">{order.estimatedDeliveryTime || '28 Mins'}</div>
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-400 w-3/4"></div>
      </div>
    </div>
  );
}
