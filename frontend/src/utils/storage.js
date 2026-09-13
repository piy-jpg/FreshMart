export const getStoredItem = (key, fallback = null) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
export const setStoredItem = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
