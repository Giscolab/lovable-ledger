import { Transaction, CategoryRule, ProjectionSettings, BackupData } from './types';
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
  IGNORED_RECURRING: 'finance_ignored_recurring',
};

export interface AddTransactionsResult {
  all: Transaction[];
  added: number;
  skipped: number;
}

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
        // Ensure backward compatibility for old transactions
        source: t.source || 'csv',
        createdAt: t.createdAt || new Date().toISOString(),
        tags: t.tags || [],
      }));
    } catch {
      return [];
    }
  },

  setTransactions: (transactions: Transaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  /**
   * Add new transactions, deduplicating by ID.
   * Returns the merged list and counts of added/skipped transactions.
   * NEVER overwrites existing transactions - only adds new ones.
   */
  addTransactions: (newTransactions: Transaction[]): AddTransactionsResult => {
    const existing = localStore.getTransactions();
    const existingIds = new Set(existing.map(t => t.id));
    
    let added = 0;
    let skipped = 0;
    
    const unique = newTransactions.filter(t => {
      if (existingIds.has(t.id)) {
        skipped++;
        return false;
      }
      added++;
      return true;
    });
    
    const all = [...existing, ...unique];
    localStore.setTransactions(all);
    
    return { all, added, skipped };
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

  // Ignored Recurring Transactions
  getIgnoredRecurring: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEYS.IGNORED_RECURRING);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setIgnoredRecurring: (ids: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.IGNORED_RECURRING, JSON.stringify(ids));
  },

  // Backup & Restore
  exportAllData: (): BackupData => {
    return {
      version: 'v5',
      exportedAt: new Date().toISOString(),
      data: {
        transactions: localStore.getTransactions(),
        rules: localStore.getRules(),
        budgets: localStore.getBudgets(),
        goals: localStore.getGoals(),
        projection: localStore.getProjectionSettings(),
        lastMonth: localStore.getLastMonth(),
        ignoredRecurring: localStore.getIgnoredRecurring(),
      },
    };
  },

  importAllData: (backup: BackupData, mergeTransactions: boolean = true): AddTransactionsResult | null => {
    if (!backup.version || !backup.data) {
      throw new Error('Format de sauvegarde invalide');
    }

    // Restore rules, budgets, goals, projection, lastMonth
    if (backup.data.rules) localStore.setRules(backup.data.rules);
    if (backup.data.budgets) localStore.setBudgets(backup.data.budgets);
    if (backup.data.goals) localStore.setGoals(backup.data.goals);
    if (backup.data.projection) localStore.setProjectionSettings(backup.data.projection);
    if (backup.data.lastMonth) localStore.setLastMonth(backup.data.lastMonth);
    if (backup.data.ignoredRecurring) localStore.setIgnoredRecurring(backup.data.ignoredRecurring);

    // Handle transactions
    if (backup.data.transactions) {
      const transactions = backup.data.transactions.map(t => ({
        ...t,
        date: new Date(t.date),
        source: t.source || 'csv',
        createdAt: t.createdAt || new Date().toISOString(),
        tags: t.tags || [],
      }));

      if (mergeTransactions) {
        return localStore.addTransactions(transactions);
      } else {
        localStore.setTransactions(transactions);
        return { all: transactions, added: transactions.length, skipped: 0 };
      }
    }

    return null;
  },

  // Clear all
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
