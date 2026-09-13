import React from 'react';
export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
