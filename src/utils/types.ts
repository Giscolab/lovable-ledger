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
}

export interface CategoryRule {
  category: CategoryType;
  keywords: string[];
  isIncompressible: boolean;
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  byCategory: Record<CategoryType, number>;
  incompressible: number;
  variable: number;
  resteAVivre: number;
}

export interface ProjectionSettings {
  monthlyIncome: number;
  variableBudget: number;
  savingsGoal: number;
}
