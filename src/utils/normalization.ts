import { TransactionSource } from './types';

type FingerprintInput = {
  accountId: string;
  date: Date | string;
  amountMinor: number;
  normalizedLabel: string;
  bankReference?: string;
  source?: TransactionSource;
};

export const normalizeLabel = (label: string): string => {
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s\-_]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const toMinorUnits = (amount: number): number => {
  if (Number.isNaN(amount) || !Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
};

/**
 * Parses a Euro amount string into cents while preserving the sign.
 * Handles common French formats, unicode minus, non-breaking spaces,
 * thousand separators, and parentheses for negatives.
 */
export const parseEuroToCents = (raw: string): number => {
  if (!raw) return 0;

  // Normalization of unicode minus and non-breaking spaces
  let s = raw
    .replace(/\u2212/g, '-')
    .replace(/\u00A0/g, ' ')
    .trim();

  // Parentheses indicate negative values
  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  // Detect explicit sign
  if (s.startsWith('-')) negative = true;
  if (s.startsWith('+') || s.startsWith('-')) {
    s = s.slice(1).trim();
  }

  // Remove currency symbol, spaces, and thin thousand separators
  s = s
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/['’]/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  // Normalize decimal separator, dropping thousand separators
  if (hasComma && hasDot) {
    // Assume the rightmost separator is the decimal one
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(/,/g, '.');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`Montant invalide: "${raw}"`);

  const cents = Math.round(n * 100);
  return negative ? -cents : cents;
};

export const fromMinorUnits = (amountMinor: number): number => {
  if (!Number.isFinite(amountMinor)) return 0;
  return amountMinor / 100;
};

export const buildTransactionFingerprint = ({
  accountId,
  date,
  amountMinor,
  normalizedLabel,
  bankReference,
  source,
}: FingerprintInput): string => {
  const dateStr = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  const parts = [
    accountId || 'unknown',
    dateStr,
    amountMinor.toString(),
    normalizedLabel || 'unknown',
    bankReference || '',
    source || 'import',
  ];

  const base = parts.join('|');
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  return `fp_${Math.abs(hash).toString(16).padStart(8, '0')}`;
};
