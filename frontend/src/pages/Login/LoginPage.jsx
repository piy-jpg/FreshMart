import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-8 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-5">
      <h1 className="text-xl font-black text-stone-900">Sign in to FreshMart</h1>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-600" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-600" />
        <button type="submit" className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs">Sign In</button>
      </form>
      <p className="text-[11px] text-center text-stone-400">New to FreshMart? <Link to="/register" className="text-emerald-700 font-bold">Create an account</Link></p>
    </div>
  );
}
