import { CategoryType } from './types';

export interface Budget {
  id: string;
  category: CategoryType;
  limit: number;
  isEnabled: boolean;
}

export interface BudgetAlert {
  category: CategoryType;
  limit: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
}

export const DEFAULT_BUDGETS: Budget[] = [
  { id: '1', category: 'groceries', limit: 400, isEnabled: true },
  { id: '2', category: 'food', limit: 150, isEnabled: true },
  { id: '3', category: 'shopping', limit: 200, isEnabled: true },
  { id: '4', category: 'entertainment', limit: 100, isEnabled: true },
  { id: '5', category: 'transport', limit: 80, isEnabled: true },
  { id: '6', category: 'health', limit: 50, isEnabled: true },
  { id: '7', category: 'smoking', limit: 0, isEnabled: false },
];

export function checkBudgetAlerts(
  budgets: Budget[],
  spentByCategory: Record<CategoryType, number>
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  for (const budget of budgets) {
    if (!budget.isEnabled || budget.limit === 0) continue;

    const spent = Math.abs(spentByCategory[budget.category] || 0);
    const percentage = (spent / budget.limit) * 100;

    if (percentage >= 80) {
      alerts.push({
        category: budget.category,
        limit: budget.limit,
        spent,
        percentage,
        isOverBudget: percentage >= 100,
      });
    }
  }

  return alerts.sort((a, b) => b.percentage - a.percentage);
}
