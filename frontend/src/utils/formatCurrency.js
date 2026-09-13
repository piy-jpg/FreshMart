export const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
