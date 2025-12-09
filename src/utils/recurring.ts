import { Transaction, CategoryType } from './types';
import { CATEGORY_LABELS } from './categories';
import { localStore } from './localStore';

export interface RecurringTransaction {
  id: string;
  label: string;
  normalizedLabel: string;
  averageAmount: number;
  category: CategoryType;
  frequency: 'monthly' | 'quarterly' | 'annual';
  occurrences: number;
  lastDate: Date;
  nextExpectedDate: Date;
  isActive: boolean;
  isIgnored: boolean;
  transactions: Transaction[];
}

// Normalize label for comparison
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove dates
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\b\d+\b/g, '') // Remove standalone numbers
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two strings
function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.includes(shorter)) return shorter.length / longer.length;
  
  // Levenshtein distance approximation
  let matches = 0;
  const shorterWords = shorter.split(' ');
  const longerWords = longer.split(' ');
  
  for (const word of shorterWords) {
    if (longerWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / Math.max(shorterWords.length, longerWords.length);
}

// Group similar transactions
function groupSimilarTransactions(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  const processed = new Set<string>();
  
  for (const t of transactions) {
    if (processed.has(t.id)) continue;
    
    const normalized = normalizeLabel(t.label);
    if (normalized.length < 3) continue;
    
    // Find existing group or create new one
    let foundGroup = false;
    for (const [key, group] of groups) {
      if (similarity(normalized, key) > 0.6) {
        group.push(t);
        processed.add(t.id);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groups.set(normalized, [t]);
      processed.add(t.id);
    }
  }
  
  return groups;
}

// Detect frequency based on dates
function detectFrequency(dates: Date[]): 'monthly' | 'quarterly' | 'annual' | null {
  if (dates.length < 2) return null;
  
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  
  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = Math.round(
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    gaps.push(daysDiff);
  }
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  
  if (avgGap >= 25 && avgGap <= 35) return 'monthly';
  if (avgGap >= 85 && avgGap <= 100) return 'quarterly';
  if (avgGap >= 350 && avgGap <= 380) return 'annual';
  
  return null;
}

// Calculate next expected date
function calculateNextDate(lastDate: Date, frequency: 'monthly' | 'quarterly' | 'annual'): Date {
  const next = new Date(lastDate);
  
  switch (frequency) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

// Main detection function
export function detectRecurringTransactions(transactions: Transaction[]): RecurringTransaction[] {
  // Filter only expenses (recurring income is less common for personal finance)
  const expenses = transactions.filter(t => !t.isIncome && t.amount > 0);
  const ignoredIds = localStore.getIgnoredRecurring();
  
  const groups = groupSimilarTransactions(expenses);
  const recurring: RecurringTransaction[] = [];
  
  for (const [normalizedLabel, group] of groups) {
    if (group.length < 2) continue;
    
    const dates = group.map(t => new Date(t.date));
    const frequency = detectFrequency(dates);
    
    if (!frequency) continue;
    
    // Check amount consistency (within 20% variance)
    const amounts = group.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.2);
    
    if (!variance && frequency === 'monthly') continue;
    
    const sortedGroup = [...group].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const lastDate = new Date(sortedGroup[0].date);
    const nextExpected = calculateNextDate(lastDate, frequency);
    const now = new Date();
    
    // Check if still active (last occurrence within expected timeframe)
    const daysSinceLast = Math.round(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isActive = frequency === 'monthly' ? daysSinceLast < 45 :
                     frequency === 'quarterly' ? daysSinceLast < 120 :
                     daysSinceLast < 400;
    
    const id = `recurring_${normalizedLabel.replace(/\s/g, '_')}`;
    
    recurring.push({
      id,
      label: sortedGroup[0].label,
      normalizedLabel,
      averageAmount: avgAmount,
      category: sortedGroup[0].category,
      frequency,
      occurrences: group.length,
      lastDate,
      nextExpectedDate: nextExpected,
      isActive,
      isIgnored: ignoredIds.includes(id),
      transactions: sortedGroup,
    });
  }
  
  return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
}

// Calculate total monthly recurring expenses (excluding ignored)
export function calculateMonthlyRecurring(recurring: RecurringTransaction[]): number {
  return recurring
    .filter(r => r.isActive && !r.isIgnored)
    .reduce((sum, r) => {
      switch (r.frequency) {
        case 'monthly': return sum + r.averageAmount;
        case 'quarterly': return sum + r.averageAmount / 3;
        case 'annual': return sum + r.averageAmount / 12;
        default: return sum;
      }
    }, 0);
}

// Get upcoming recurring transactions
export function getUpcomingRecurring(recurring: RecurringTransaction[], days: number = 30): RecurringTransaction[] {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return recurring
    .filter(r => r.isActive && !r.isIgnored && r.nextExpectedDate >= now && r.nextExpectedDate <= future)
    .sort((a, b) => a.nextExpectedDate.getTime() - b.nextExpectedDate.getTime());
}

// Toggle ignored status
export function toggleRecurringIgnored(id: string): void {
  const ignoredIds = localStore.getIgnoredRecurring();
  const index = ignoredIds.indexOf(id);
  
  if (index === -1) {
    ignoredIds.push(id);
  } else {
    ignoredIds.splice(index, 1);
  }
  
  localStore.setIgnoredRecurring(ignoredIds);
}

export const FREQUENCY_LABELS = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  annual: 'Annuel',
};
