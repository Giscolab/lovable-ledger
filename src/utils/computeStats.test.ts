import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeDailyCashflow, getTrendData } from './computeStats';
import { Transaction } from './types';

const buildTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-id',
  accountId: 'acc-1',
  date: new Date(),
  label: 'test',
  amount: 0,
  category: 'other',
  isIncome: false,
  source: 'manual',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('computeDailyCashflow', () => {
  it('computes running balances with initial offset and mixed transactions', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'income-1',
        date: new Date('2024-02-01T10:00:00Z'),
        amount: 1000,
        isIncome: true,
      }),
      buildTransaction({
        id: 'expense-1',
        date: new Date('2024-02-02T08:00:00Z'),
        amount: 200,
        isIncome: false,
        category: 'groceries',
      }),
      buildTransaction({
        id: 'income-2',
        date: new Date('2024-02-02T16:00:00Z'),
        amount: 50,
        isIncome: true,
        category: 'other',
        label: 'Remboursement',
      }),
    ];

    const daily = computeDailyCashflow(transactions, 1, 2024, 500);

    expect(daily).toHaveLength(29); // février 2024 (année bissextile)
    expect(daily[0]).toMatchObject({
      day: 1,
      income: 1000,
      expenses: 0,
      balance: 1500,
    });

    const dayTwo = daily[1];
    expect(dayTwo.income).toBe(50);
    expect(dayTwo.expenses).toBe(200);
    expect(dayTwo.balance).toBe(1350);
    expect(daily[daily.length - 1].balance).toBe(1350);
  });

  it('returns stable balances when a month has no transactions', () => {
    const daily = computeDailyCashflow([], 0, 2024, 200);

    expect(daily).toHaveLength(31);
    expect(daily.every(d => d.income === 0 && d.expenses === 0)).toBe(true);
    expect(daily[0].balance).toBe(200);
    expect(daily[daily.length - 1].balance).toBe(200);
  });
});

describe('getTrendData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates income, expenses and savings over the requested window', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'oct-income',
        date: new Date('2024-10-05T12:00:00Z'),
        amount: 1000,
        isIncome: true,
      }),
      buildTransaction({
        id: 'oct-expense',
        date: new Date('2024-10-10T12:00:00Z'),
        amount: 300,
        isIncome: false,
        category: 'utilities',
      }),
      buildTransaction({
        id: 'nov-income',
        date: new Date('2024-11-02T12:00:00Z'),
        amount: 800,
        isIncome: true,
      }),
      buildTransaction({
        id: 'nov-expense',
        date: new Date('2024-11-15T12:00:00Z'),
        amount: 400,
        isIncome: false,
        category: 'rent',
      }),
      buildTransaction({
        id: 'dec-expense',
        date: new Date('2024-12-01T12:00:00Z'),
        amount: 200,
        isIncome: false,
        category: 'food',
      }),
    ];

    const trend = getTrendData(transactions, 3);

    expect(trend.labels).toEqual(['Oct 24', 'Nov 24', 'Déc 24']);
    expect(trend.income).toEqual([1000, 800, 0]);
    expect(trend.expenses).toEqual([300, 400, 200]);
    expect(trend.savings).toEqual([700, 400, -200]);
  });

  it('returns zeroed series when no data is available', () => {
    const trend = getTrendData([], 2);

    expect(trend.labels).toEqual(['Nov 24', 'Déc 24']);
    expect(trend.income).toEqual([0, 0]);
    expect(trend.expenses).toEqual([0, 0]);
    expect(trend.savings).toEqual([0, 0]);
  });
});
