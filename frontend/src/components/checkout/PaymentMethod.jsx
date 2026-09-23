import React from 'react';
export function PaymentMethod({ method, onSelect }) {
  const methods = ['UPI (Google Pay)', 'UPI (PhonePe)', 'Cash on Delivery', 'FreshMart Cash Wallet'];
  return (
    <div className="space-y-2">
      {methods.map(m => (
        <label key={m} className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer text-xs ${method === m ? 'border-emerald-600 bg-emerald-50 font-bold' : 'border-stone-200'}`}>
          <input type="radio" name="payment" checked={method === m} onChange={() => onSelect(m)} />
          <span>{m}</span>
        </label>
      ))}
    </div>
  );
}
