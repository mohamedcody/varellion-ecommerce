import { redirect } from 'next/navigation';

/**
 * MISSION 08 — Secure COD-Only Remediation:
 * Mock Paymob simulator route is permanently disabled.
 * Any access is immediately redirected to /checkout.
 */
export default function MockPaymobPage() {
  redirect('/checkout');
}
