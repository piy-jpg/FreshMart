function getISOString() {
  return new Date().toISOString();
}

function formatRelativeTime(dateInput) {
  const d = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return d.toLocaleDateString();
}

function calculateEstimatedDeliveryTime(slotType = 'standard') {
  const mins = slotType === 'express' ? 15 : 20;
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

module.exports = {
  getISOString,
  formatRelativeTime,
  calculateEstimatedDeliveryTime
};
