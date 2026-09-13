import { API_BASE } from '../config/api';

export async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network Error' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return res.json();
}
