import React from 'react';
export function OrderStatus({ status }) {
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{status}</span>;
}
