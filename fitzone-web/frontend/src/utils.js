export function formatCurrency(value) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function statusLabel(status) {
  return String(status || '').replaceAll('_', ' ');
}
