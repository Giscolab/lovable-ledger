import { Transaction, CategoryType, MonthlyStats } from './types';
import { INCOMPRESSIBLE_CATEGORIES } from './categories';

export const computeMonthlyStats = (
  transactions: Transaction[],
  month: number,
  year: number
): MonthlyStats => {
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const byCategory: Record<CategoryType, number> = {
    rent: 0,
    utilities: 0,
    insurance: 0,
    internet: 0,
    transport: 0,
    investments: 0,
    groceries: 0,
    food: 0,
    shopping: 0,
    smoking: 0,
    entertainment: 0,
    health: 0,
    other: 0,
  };

  let totalIncome = 0;
  let totalExpenses = 0;

  monthTransactions.forEach(t => {
    if (t.isIncome) {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      byCategory[t.category] += t.amount;
    }
  });

  const incompressible = INCOMPRESSIBLE_CATEGORIES.reduce(
    (sum, cat) => sum + byCategory[cat],
    0
  );

  const variable = totalExpenses - incompressible;
  const resteAVivre = totalIncome - incompressible - variable;

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return {
    month: monthNames[month],
    year,
    totalIncome,
    totalExpenses,
    byCategory,
    incompressible,
    variable,
    resteAVivre,
  };
};

export const getAvailableMonths = (transactions: Transaction[]): { month: number; year: number; label: string }[] => {
  const monthSet = new Set<string>();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthSet.add(key);
  });

  return Array.from(monthSet)
    .map(key => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        label: `${monthNames[month]} ${year}`,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};
