export function makeOrderCode() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VC-${stamp}-${random}`;
}

export function computeShipping(subtotal, shippingFee = 450) {
  if (subtotal <= 0) return 0;
  return subtotal >= 15000 ? 0 : Math.max(0, Number(shippingFee) || 0);
}
