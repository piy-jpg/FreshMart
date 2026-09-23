import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

export function OrderCard({ order, onTrack }) {
  return (
    <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs text-stone-900">#{order.id}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{order.status}</span>
          {order.deliveryOtp && !['DELIVERED', 'CANCELLED'].includes(order.status) && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
              🔑 OTP: {order.deliveryOtp}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-600">{(order.items || []).length} Items • Total: <strong className="text-stone-900 font-mono">{formatCurrency(order.totalAmount || order.total)}</strong></p>
        <p className="text-[10px] text-stone-400">{new Date(order.createdAt || Date.now()).toLocaleString()}</p>
      </div>
      <button onClick={() => onTrack(order.id)} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs">
        Track Live Delivery 🛵
      </button>
    </div>
  );
}
