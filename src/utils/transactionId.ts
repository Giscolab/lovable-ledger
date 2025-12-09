import { TransactionSource } from './types';

/**
 * Compute a deterministic transaction ID based on date, label, amount, and source.
 * This ensures the same transaction always gets the same ID, enabling proper deduplication.
 */
export function computeTransactionId(
  date: Date,
  label: string,
  amount: number,
  source: TransactionSource
): string {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 50); // Limit label length for consistency
  const amountStr = Math.abs(amount).toFixed(2);
  
  const base = [dateStr, normalizedLabel, amountStr, source].join('|');
  
  // Simple but effective hash function
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive hex string
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  return `tx_${source}_${hashHex}`;
}

/**
 * Generate a unique ID for manual transactions.
 * Uses timestamp + random for uniqueness when deterministic ID might conflict.
 */
export function generateManualTransactionId(
  date: Date,
  label: string,
  amount: number
): string {
  const baseId = computeTransactionId(date, label, amount, 'manual');
  // Add timestamp suffix to ensure uniqueness for manual entries
  const suffix = Date.now().toString(36).slice(-4);
  return `${baseId}_${suffix}`;
}
