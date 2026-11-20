import { redirect } from 'next/navigation';

/**
 * MISSION 08 — Secure COD-Only Remediation:
 * Online payment callback route is permanently disabled.
 * Any access (with or without query parameters) is immediately redirected to /checkout
 * without mutating sessionStorage or clearing the customer's cart.
 */
export default function PaymentCallbackPage() {
  redirect('/checkout');
}
