export const formatAddress = (addr) => {
  if (!addr) return 'Select Location';
  return `${addr.flat ? addr.flat + ', ' : ''}${addr.street ? addr.street + ', ' : ''}${addr.city || 'Bengaluru'}`;
};
