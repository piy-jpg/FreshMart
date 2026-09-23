import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export function ProfilePage() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-md mx-auto p-6 rounded-3xl bg-white border border-stone-200 space-y-4">
      <h1 className="text-xl font-black text-stone-900">Customer Profile</h1>
      <div className="text-xs space-y-1 text-stone-600">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
      <button onClick={logout} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition">
        Sign Out 🚪
      </button>
    </div>
  );
}
