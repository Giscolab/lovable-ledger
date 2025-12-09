export type CategoryType =
  | 'rent'
  | 'utilities'
  | 'insurance'
  | 'internet'
  | 'transport'
  | 'investments'
  | 'groceries'
  | 'food'
  | 'shopping'
  | 'smoking'
  | 'entertainment'
  | 'health'
  | 'other';

export interface Transaction {
  id: string;
  date: Date;
  label: string;
  amount: number;
  category: CategoryType;
  isIncome: boolean;
  notes?: string;
}

export interface CategoryRule {
  category: CategoryType;
  keywords: string[];
  isIncompressible: boolean;
}

export interface MonthlyStats {
  month: string;
  monthIndex: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  byCategory: Record<CategoryType, number>;
  incompressible: number;
  variable: number;
  resteAVivre: number;
  savings: number;
}

export interface YearlyStats {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  byCategory: Record<CategoryType, number>;
  monthlyBreakdown: MonthlyStats[];
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
}

export interface ProjectionSettings {
  monthlyIncome: number;
  variableBudget: number;
  savingsGoal: number;
  targetYear: number;
}

export interface MultiYearProjection {
  year: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  yearlySavings: number;
  cumulativeSavings: number;
  goalProgress: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date;
  currentAmount: number;
  category: 'savings' | 'investment' | 'debt' | 'purchase';
}

export interface BudgetAlert {
  id: string;
  category: CategoryType;
  threshold: number;
  isEnabled: boolean;
}

export interface ExportFormat {
  type: 'csv' | 'json' | 'pdf';
  includeCategories: boolean;
  dateRange?: { start: Date; end: Date };
}
