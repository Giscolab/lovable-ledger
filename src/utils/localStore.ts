import { Transaction, CategoryRule, ProjectionSettings } from './types';
import { DEFAULT_CATEGORY_RULES } from './categories';
import { Budget, DEFAULT_BUDGETS } from './budgets';
import { FinancialGoal } from './goals';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions',
  RULES: 'finance_rules',
  THEME: 'finance_theme',
  PROJECTION: 'finance_projection',
  LAST_MONTH: 'finance_last_month',
  BUDGETS: 'finance_budgets',
  GOALS: 'finance_goals',
};

export const localStore = {
  // Transactions
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return parsed.map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));
    } catch {
      return [];
    }
  },

  setTransactions: (transactions: Transaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransactions: (newTransactions: Transaction[]): Transaction[] => {
    const existing = localStore.getTransactions();
    const existingIds = new Set(existing.map(t => t.id));
    const unique = newTransactions.filter(t => !existingIds.has(t.id));
    const all = [...existing, ...unique];
    localStore.setTransactions(all);
    return all;
  },

  clearTransactions: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  },

  // Category Rules
  getRules: (): CategoryRule[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!data) {
      localStore.setRules(DEFAULT_CATEGORY_RULES);
      return DEFAULT_CATEGORY_RULES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_CATEGORY_RULES;
    }
  },

  setRules: (rules: CategoryRule[]): void => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  },

  // Theme
  getTheme: (): 'light' | 'dark' => {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  },

  setTheme: (theme: 'light' | 'dark'): void => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Projection Settings
  getProjectionSettings: (): ProjectionSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTION);
    if (!data) {
      const defaults: ProjectionSettings = {
        monthlyIncome: 3000,
        variableBudget: 300,
        savingsGoal: 10000,
        targetYear: 2042,
      };
      localStore.setProjectionSettings(defaults);
      return defaults;
    }
    try {
      return JSON.parse(data);
    } catch {
      return { monthlyIncome: 3000, variableBudget: 300, savingsGoal: 10000, targetYear: 2042 };
    }
  },

  setProjectionSettings: (settings: ProjectionSettings): void => {
    localStorage.setItem(STORAGE_KEYS.PROJECTION, JSON.stringify(settings));
  },

  // Last Month
  getLastMonth: (): string => {
    return localStorage.getItem(STORAGE_KEYS.LAST_MONTH) || '';
  },

  setLastMonth: (month: string): void => {
    localStorage.setItem(STORAGE_KEYS.LAST_MONTH, month);
  },

  // Budgets
  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return DEFAULT_BUDGETS;
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_BUDGETS;
    }
  },

  setBudgets: (budgets: Budget[]): void => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  // Goals
  getGoals: (): FinancialGoal[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setGoals: (goals: FinancialGoal[]): void => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  // Clear all
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
