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
  // Catégories de base (inchangées)
  { id: '1', category: 'groceries',     limit: 400, isEnabled: true },
  { id: '2', category: 'food',          limit: 150, isEnabled: true },
  { id: '3', category: 'shopping',      limit: 200, isEnabled: true },
  { id: '4', category: 'entertainment', limit: 100, isEnabled: true },
  { id: '5', category: 'transport',     limit: 80,  isEnabled: true }, // Navigo / transports
  { id: '6', category: 'health',        limit: 50,  isEnabled: true },
  { id: '7', category: 'smoking',       limit: 0,   isEnabled: false },

  // Logement & charges fixes
  { id: '8',  category: 'rent',          limit: 800, isEnabled: true },
  { id: '9',  category: 'electricity',   limit: 60,  isEnabled: true },
  { id: '10', category: 'water',         limit: 20,  isEnabled: true },
  { id: '11', category: 'internet',      limit: 30,  isEnabled: true },
  { id: '12', category: 'mobile',        limit: 25,  isEnabled: true },
  { id: '13', category: 'home_insurance',limit: 20,  isEnabled: true },

  // Quotidien & produits ménagers
  { id: '14', category: 'household',     limit: 40,  isEnabled: true },

  // Abonnements & services en ligne
  { id: '15', category: 'streaming',     limit: 25,  isEnabled: true },
  { id: '16', category: 'subscriptions', limit: 20,  isEnabled: true },

  // Shopping détaillé & perso
  { id: '17', category: 'clothing',      limit: 80,  isEnabled: true },
  { id: '18', category: 'beauty',        limit: 40,  isEnabled: true },
  { id: '19', category: 'gifts',         limit: 40,  isEnabled: true },
  { id: '20', category: 'hobbies',       limit: 50,  isEnabled: true },

  // Banque, impôts, divers
  { id: '21', category: 'bank_fees',     limit: 10,  isEnabled: true },
  { id: '22', category: 'taxes',         limit: 0,   isEnabled: false },
  { id: '23', category: 'donations',     limit: 0,   isEnabled: false },
  { id: '24', category: 'travel',        limit: 0,   isEnabled: false },
  { id: '25', category: 'unexpected',    limit: 50,  isEnabled: true },
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
