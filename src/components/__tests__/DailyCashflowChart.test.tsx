/// <reference types="vitest" />
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { DailyCashflowChart } from '../DailyCashflowChart';
import { formatCurrency } from '@/utils/computeStats';
import { Transaction } from '@/utils/types';

vi.mock('react-chartjs-2', () => ({
  Line: (props: any) => (
    <div data-testid="line-chart" data-points={JSON.stringify(props.data.datasets[0].data)} />
  ),
}));

const sampleTransactions: Transaction[] = [
  {
    id: 'income',
    accountId: 'acc',
    amount: 200,
    category: 'other',
    createdAt: '',
    date: new Date(2024, 0, 1),
    isIncome: true,
    label: 'Salaire',
    source: 'manual',
  },
  {
    id: 'expense-1',
    accountId: 'acc',
    amount: 50,
    category: 'rent',
    createdAt: '',
    date: new Date(2024, 0, 1),
    isIncome: false,
    label: 'Loyer',
    source: 'manual',
  },
  {
    id: 'expense-2',
    accountId: 'acc',
    amount: 30,
    category: 'groceries',
    createdAt: '',
    date: new Date(2024, 0, 2),
    isIncome: false,
    label: 'Courses',
    source: 'manual',
  },
];

describe('DailyCashflowChart', () => {
  const renderChart = () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <DailyCashflowChart
          transactions={sampleTransactions}
          month={0}
          year={2024}
          initialBalance={100}
        />
      );
    });

    return { container, root };
  };

  it('displays the computed balances in the summary', () => {
    const { container } = renderChart();

    expect(container.textContent?.includes(formatCurrency(220))).toBe(true);
    expect(container.textContent?.includes(formatCurrency(200))).toBe(true);
    expect(container.textContent?.includes(formatCurrency(80))).toBe(true);
  });

  it('switches to expenses-only mode with cumulative totals', () => {
    const { container } = renderChart();

    const expensesToggle = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Dépenses'
    );

    act(() => {
      expensesToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const chart = container.querySelector('[data-testid="line-chart"]');
    const points = JSON.parse(chart?.getAttribute('data-points') || '[]');

    expect(points[0]).toBe(50);
    expect(points[1]).toBe(80);
    expect(points[points.length - 1]).toBe(80);
  });
});
