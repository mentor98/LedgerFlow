/**
 * Format integer minor units (cents) into formatted currency string.
 * Example: 10000 -> "$100.00"
 */
export function formatCurrency(amountInCents: number, currency = 'USD'): string {
  const isNegative = amountInCents < 0;
  const absCents = Math.abs(amountInCents);
  const dollars = absCents / 100;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format ISO date to human readable string
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Truncate hash for display
 */
export function truncateHash(hash: string, startLen = 8, endLen = 8): string {
  if (!hash || hash.length <= startLen + endLen) return hash || '00000000';
  return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`;
}

/**
 * Account type color badge styling (Professional Polish Theme)
 */
export function getAccountTypeBadge(type: string): { label: string; bg: string; text: string; border: string } {
  switch (type) {
    case 'ASSET':
      return { label: 'Asset', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'LIABILITY':
      return { label: 'Liability', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'EQUITY':
      return { label: 'Equity', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'REVENUE':
      return { label: 'Revenue', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    case 'EXPENSE':
      return { label: 'Expense', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { label: type, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

/**
 * Transaction status badge styling (Professional Polish Theme)
 */
export function getTransactionStatusBadge(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'POSTED':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'PENDING':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'REVERSED':
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    case 'REJECTED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  }
}
