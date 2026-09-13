import React from 'react';
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = "px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs",
    secondary: "bg-stone-100 hover:bg-stone-200 text-stone-800",
    outline: "border border-stone-200 hover:bg-stone-50 text-stone-700"
  };
  return <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>{children}</button>;
}
