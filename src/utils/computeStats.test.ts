/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  computeDailyCashflow,
  computeMonthlyStats,
  formatCurrency,
  getTrendData,
} from './computeStats';
import { Transaction } from './types';

describe('computeStats utilities', () => {
  const baseMonth = 0; // January
  const baseYear = 2024;

  it('handles empty transactions gracefully', () => {
    const monthly = computeMonthlyStats([], baseMonth, baseYear);
    expect(monthly.totalIncome).toBe(0);
    expect(monthly.totalExpenses).toBe(0);
    expect(monthly.savings).toBe(0);

    const daily = computeDailyCashflow([], baseMonth, baseYear, 0);
    expect(daily.length).toBe(31);
    expect(daily.every(day => day.income === 0 && day.expenses === 0 && day.balance === 0)).toBe(true);

    const trend = getTrendData([], 3);
    expect(trend.labels.length).toBe(3);
    expect(trend.income.every(value => value === 0)).toBe(true);
    expect(trend.expenses.every(value => value === 0)).toBe(true);
    expect(trend.savings.every(value => value === 0)).toBe(true);
  });

  it('respects the initial balance when computing daily cashflow', () => {
    const transactions: Transaction[] = [];
    const initialBalance = 250;

    const daily = computeDailyCashflow(transactions, baseMonth, baseYear, initialBalance);
    expect(daily[0].balance).toBe(initialBalance);
    expect(daily[daily.length - 1].balance).toBe(initialBalance);
  });

  it('computes expenses-only months without NaN values', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        accountId: 'a',
        amount: 120,
        category: 'rent',
        createdAt: '',
        date: new Date(baseYear, baseMonth, 5),
        isIncome: false,
        label: 'Loyer',
        source: 'manual',
      },
      {
        id: '2',
        accountId: 'a',
        amount: 80,
        category: 'groceries',
        createdAt: '',
        date: new Date(baseYear, baseMonth, 12),
        isIncome: false,
        label: 'Courses',
        source: 'manual',
      },
    ];

    const monthly = computeMonthlyStats(transactions, baseMonth, baseYear);
    expect(monthly.totalIncome).toBe(0);
    expect(monthly.totalExpenses).toBe(200);
    expect(monthly.savings).toBe(-200);
  });

  it('keeps running balance stable when incomes and expenses offset', () => {
    const transactions: Transaction[] = [
      {
        id: 'credit',
        accountId: 'a',
        amount: 100,
        category: 'other',
        createdAt: '',
        date: new Date(baseYear, baseMonth, 1),
        isIncome: true,
        label: 'Salaire',
        source: 'manual',
      },
      {
        id: 'debit',
        accountId: 'a',
        amount: 100,
        category: 'rent',
        createdAt: '',
        date: new Date(baseYear, baseMonth, 1),
        isIncome: false,
        label: 'Loyer',
        source: 'manual',
      },
    ];

    const daily = computeDailyCashflow(transactions, baseMonth, baseYear, 50);
    const finalBalance = daily[daily.length - 1].balance;
    expect(finalBalance).toBe(50);
    expect(formatCurrency(finalBalance)).toContain('€');
  });
});
