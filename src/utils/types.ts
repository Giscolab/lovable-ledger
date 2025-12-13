export type CategoryType =
  | 'rent'
  | 'utilities'
  | 'electricity'
  | 'water'
  | 'insurance'
  | 'home_insurance'
  | 'internet'
  | 'mobile'
  | 'transport'
  | 'investments'
  | 'groceries'
  | 'food'
  | 'shopping'
  | 'smoking'
  | 'entertainment'
  | 'health'
  | 'household'
  | 'streaming'
  | 'subscriptions'
  | 'clothing'
  | 'beauty'
  | 'gifts'
  | 'hobbies'
  | 'travel'
  | 'bank_fees'
  | 'taxes'
  | 'donations'
  | 'unexpected'
  | 'internal_transfer' // 👈 AJOUT
  | 'other';

export type TransactionSource = 'manual' | 'csv' | 'pdf';
export type TransactionStatus = 'pending' | 'posted';

export type AccountType = 'checking' | 'savings' | 'cash' | 'investment' | 'custom';

export interface Account {
  id: string;
  name: string;
  iban?: string;
  number?: string;
  bankName?: string;
  type: AccountType;
  createdAt: string;
  notes?: string;
  currency?: string;
  referenceBalanceMinor?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  label: string;
  normalizedLabel?: string;
  amount: number;
  amountMinor?: number;
  category: CategoryType;
  isIncome: boolean;
  notes?: string;
  tags?: string[];
  source: TransactionSource;
  status?: TransactionStatus;
  currency?: string;
  valueDate?: string;
  dedupeHash?: string;
  rawFingerprint?: string;
  rawSource?: string;
  createdAt: string;
}

export interface Statement {
  id: string;
  accountId: string;
  startDate: string;
  endDate: string;
  openingBalanceMinor: number;
  closingBalanceMinor: number;
  sourceFileId?: string;
  importedAt: string;
  transactionIds: string[];
  currency?: string;
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

export interface DailyCashflow {
  day: number;
  date: Date;
  income: number;
  expenses: number;
  balance: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    accounts?: Account[];
    transactions: Transaction[];
    rules: CategoryRule[];
    budgets: any[];
    goals: any[];
    projection: ProjectionSettings;
    lastMonth: string;
    ignoredRecurring: string[];
    initialBalance?: number;
    selectedAccountId?: string;
    statements?: Statement[];
  };
}
