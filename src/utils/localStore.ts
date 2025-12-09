import { Transaction, CategoryRule, ProjectionSettings, BackupData, Account } from './types';
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
  INITIAL_BALANCE: 'finance_initial_balance',
  ACCOUNTS: 'finance_accounts',
  SELECTED_ACCOUNT: 'finance_selected_account',
};

export interface AddTransactionsResult {
  all: Transaction[];
  added: number;
  skipped: number;
}

// Generate UUID v4
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Create default account for migration
const createDefaultAccount = (): Account => ({
  id: generateId(),
  name: 'Compte Principal',
  type: 'checking',
  createdAt: new Date().toISOString(),
});

export const localStore = {
  // Accounts
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setAccounts: (accounts: Account[]): void => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  addAccount: (account: Omit<Account, 'id' | 'createdAt'>): Account => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const accounts = localStore.getAccounts();
    localStore.setAccounts([...accounts, newAccount]);
    return newAccount;
  },

  updateAccount: (id: string, updates: Partial<Account>): void => {
    const accounts = localStore.getAccounts();
    const updated = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    localStore.setAccounts(updated);
  },

  deleteAccount: (id: string): void => {
    const accounts = localStore.getAccounts();
    localStore.setAccounts(accounts.filter(a => a.id !== id));
    // Also delete transactions for this account
    const transactions = localStore.getTransactions();
    localStore.setTransactions(transactions.filter(t => t.accountId !== id));
    // Clear selected account if deleted
    if (localStore.getSelectedAccountId() === id) {
      const remaining = accounts.filter(a => a.id !== id);
      localStore.setSelectedAccountId(remaining.length > 0 ? remaining[0].id : null);
    }
  },

  getAccountById: (id: string): Account | undefined => {
    return localStore.getAccounts().find(a => a.id === id);
  },

  // Selected Account
  getSelectedAccountId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_ACCOUNT);
  },

  setSelectedAccountId: (id: string | null): void => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNT, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ACCOUNT);
    }
  },

  // Ensure accounts exist and migrate old transactions
  ensureAccountsInitialized: (): string => {
    let accounts = localStore.getAccounts();
    
    // If no accounts, create a default one
    if (accounts.length === 0) {
      const defaultAccount = createDefaultAccount();
      localStore.setAccounts([defaultAccount]);
      accounts = [defaultAccount];
      
      // Migrate existing transactions to this account
      const transactions = localStore.getTransactions();
      if (transactions.length > 0) {
        const migrated = transactions.map(t => ({
          ...t,
          accountId: t.accountId || defaultAccount.id,
        }));
        localStore.setTransactions(migrated);
      }
    }
    
    // Ensure selected account exists
    let selectedId = localStore.getSelectedAccountId();
    if (!selectedId || !accounts.find(a => a.id === selectedId)) {
      selectedId = accounts[0].id;
      localStore.setSelectedAccountId(selectedId);
    }
    
    return selectedId;
  },

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
        accountId: t.accountId || '', // Will be migrated on init
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

  // Initial Balance
  getInitialBalance: (): number => {
    const data = localStorage.getItem(STORAGE_KEYS.INITIAL_BALANCE);
    if (!data) return 0;
    try {
      return parseFloat(data) || 0;
    } catch {
      return 0;
    }
  },

  setInitialBalance: (balance: number): void => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_BALANCE, balance.toString());
  },

  // Backup & Restore
  exportAllData: (): BackupData => {
    return {
      version: 'v6',
      exportedAt: new Date().toISOString(),
      data: {
        accounts: localStore.getAccounts(),
        transactions: localStore.getTransactions(),
        rules: localStore.getRules(),
        budgets: localStore.getBudgets(),
        goals: localStore.getGoals(),
        projection: localStore.getProjectionSettings(),
        lastMonth: localStore.getLastMonth(),
        ignoredRecurring: localStore.getIgnoredRecurring(),
        initialBalance: localStore.getInitialBalance(),
        selectedAccountId: localStore.getSelectedAccountId() || undefined,
      },
    };
  },

  importAllData: (backup: BackupData, mergeTransactions: boolean = true): AddTransactionsResult | null => {
    if (!backup.version || !backup.data) {
      throw new Error('Format de sauvegarde invalide');
    }

    // Handle V5 to V6 migration
    const isV5 = backup.version === 'v5' || !backup.data.accounts;
    
    // Import accounts (or create default for V5)
    if (backup.data.accounts && backup.data.accounts.length > 0) {
      if (mergeTransactions) {
        const existing = localStore.getAccounts();
        const existingIds = new Set(existing.map(a => a.id));
        const newAccounts = backup.data.accounts.filter(a => !existingIds.has(a.id));
        localStore.setAccounts([...existing, ...newAccounts]);
      } else {
        localStore.setAccounts(backup.data.accounts);
      }
    } else if (isV5 && backup.data.transactions?.length > 0) {
      // V5 migration: create default account if transactions exist
      const accounts = localStore.getAccounts();
      if (accounts.length === 0) {
        const defaultAccount = createDefaultAccount();
        localStore.setAccounts([defaultAccount]);
      }
    }

    // Restore other settings
    if (backup.data.rules) localStore.setRules(backup.data.rules);
    if (backup.data.budgets) localStore.setBudgets(backup.data.budgets);
    if (backup.data.goals) localStore.setGoals(backup.data.goals);
    if (backup.data.projection) localStore.setProjectionSettings(backup.data.projection);
    if (backup.data.lastMonth) localStore.setLastMonth(backup.data.lastMonth);
    if (backup.data.ignoredRecurring) localStore.setIgnoredRecurring(backup.data.ignoredRecurring);
    if (typeof backup.data.initialBalance === 'number') localStore.setInitialBalance(backup.data.initialBalance);
    if (backup.data.selectedAccountId) localStore.setSelectedAccountId(backup.data.selectedAccountId);

    // Handle transactions
    if (backup.data.transactions) {
      const accounts = localStore.getAccounts();
      const defaultAccountId = accounts[0]?.id || '';
      
      const transactions = backup.data.transactions.map(t => ({
        ...t,
        date: new Date(t.date),
        source: t.source || 'csv',
        createdAt: t.createdAt || new Date().toISOString(),
        tags: t.tags || [],
        // V5 migration: assign to default account if no accountId
        accountId: t.accountId || defaultAccountId,
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
