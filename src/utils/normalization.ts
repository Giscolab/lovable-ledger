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
