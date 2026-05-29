/**
 * Consistent Naira price formatting across the entire app.
 *
 * Usage:
 *   formatPrice(350000)       → "₦350,000"
 *   formatPrice(0)            → "₦0"
 *   formatPrice(null)         → ""
 *   formatPrice(350000, true) → "₦350K"
 */
export function formatPrice(amount: number | null | undefined, compact = false): string {
  if (amount == null || isNaN(amount)) return '';
  if (compact && amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (compact && amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return `₦${amount.toLocaleString()}`;
}
