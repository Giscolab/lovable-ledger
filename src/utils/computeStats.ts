import { Transaction, CategoryType, MonthlyStats, YearlyStats, MultiYearProjection } from './types';
import { INCOMPRESSIBLE_CATEGORIES } from './categories';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

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
    rent: 0, utilities: 0, insurance: 0, internet: 0, transport: 0,
    investments: 0, groceries: 0, food: 0, shopping: 0, smoking: 0,
    entertainment: 0, health: 0, other: 0,
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
    (sum, cat) => sum + byCategory[cat], 0
  );

  const variable = totalExpenses - incompressible;
  const resteAVivre = totalIncome - totalExpenses;
  const savings = totalIncome - totalExpenses;

  return {
    month: MONTH_NAMES[month],
    monthIndex: month,
    year,
    totalIncome,
    totalExpenses,
    byCategory,
    incompressible,
    variable,
    resteAVivre,
    savings,
  };
};

export const computeYearlyStats = (
  transactions: Transaction[],
  year: number
): YearlyStats => {
  const monthlyBreakdown: MonthlyStats[] = [];
  
  for (let month = 0; month < 12; month++) {
    monthlyBreakdown.push(computeMonthlyStats(transactions, month, year));
  }

  const byCategory: Record<CategoryType, number> = {
    rent: 0, utilities: 0, insurance: 0, internet: 0, transport: 0,
    investments: 0, groceries: 0, food: 0, shopping: 0, smoking: 0,
    entertainment: 0, health: 0, other: 0,
  };

  let totalIncome = 0;
  let totalExpenses = 0;

  monthlyBreakdown.forEach(m => {
    totalIncome += m.totalIncome;
    totalExpenses += m.totalExpenses;
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat as CategoryType] += m.byCategory[cat as CategoryType];
    });
  });

  const monthsWithData = monthlyBreakdown.filter(m => m.totalIncome > 0 || m.totalExpenses > 0).length;
  const divisor = monthsWithData || 1;

  return {
    year,
    totalIncome,
    totalExpenses,
    totalSavings: totalIncome - totalExpenses,
    byCategory,
    monthlyBreakdown,
    averageMonthlyIncome: totalIncome / divisor,
    averageMonthlyExpenses: totalExpenses / divisor,
  };
};

export const getAvailableYears = (transactions: Transaction[]): number[] => {
  const years = new Set<number>();
  transactions.forEach(t => {
    years.add(new Date(t.date).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
};

export const getAvailableMonths = (transactions: Transaction[]): { month: number; year: number; label: string }[] => {
  const monthSet = new Set<string>();

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
        label: `${MONTH_NAMES[month]} ${year}`,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
};

export const generateMultiYearProjection = (
  baseIncome: number,
  baseExpenses: number,
  savingsGoal: number,
  startYear: number = 2024,
  endYear: number = 2042,
  annualIncomeGrowth: number = 0.02,
  annualExpenseGrowth: number = 0.015
): MultiYearProjection[] => {
  const projections: MultiYearProjection[] = [];
  let cumulativeSavings = 0;

  for (let year = startYear; year <= endYear; year++) {
    const yearsFromStart = year - startYear;
    const monthlyIncome = baseIncome * Math.pow(1 + annualIncomeGrowth, yearsFromStart);
    const monthlyExpenses = baseExpenses * Math.pow(1 + annualExpenseGrowth, yearsFromStart);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const yearlySavings = monthlySavings * 12;
    cumulativeSavings += yearlySavings;

    projections.push({
      year,
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlySavings: Math.round(monthlySavings),
      yearlySavings: Math.round(yearlySavings),
      cumulativeSavings: Math.round(cumulativeSavings),
      goalProgress: Math.min((cumulativeSavings / savingsGoal) * 100, 100),
    });
  }

  return projections;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyFull = (amount: number): string => {
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

export const getMonthName = (index: number): string => MONTH_NAMES[index];

export const getTrendData = (
  transactions: Transaction[],
  months: number = 12
): { labels: string[]; income: number[]; expenses: number[]; savings: number[] } => {
  const now = new Date();
  const labels: string[] = [];
  const income: number[] = [];
  const expenses: number[] = [];
  const savings: number[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const stats = computeMonthlyStats(transactions, month, year);
    
    labels.push(`${MONTH_NAMES[month].slice(0, 3)} ${year.toString().slice(2)}`);
    income.push(stats.totalIncome);
    expenses.push(stats.totalExpenses);
    savings.push(stats.savings);
  }

  return { labels, income, expenses, savings };
};
