import { useState, useEffect } from 'react';
import { Wallet, Save, RotateCcw } from 'lucide-react';
import { Budget, DEFAULT_BUDGETS, checkBudgetAlerts } from '@/utils/budgets';
import { BudgetAlertCard } from '@/components/BudgetAlertCard';
import { CATEGORY_LABELS } from '@/utils/categories';
import { CategoryType, Transaction } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { computeMonthlyStats, getAvailableMonths, formatCurrency } from '@/utils/computeStats';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedBudgets = localStore.getBudgets();
    setBudgets(savedBudgets.length > 0 ? savedBudgets : DEFAULT_BUDGETS);
    setTransactions(localStore.getTransactions());
  }, []);

  const getCurrentMonthStats = () => {
    const months = getAvailableMonths(transactions);
    if (months.length === 0) return null;
    const current = months[0];
    return computeMonthlyStats(transactions, current.month, current.year);
  };

  const stats = getCurrentMonthStats();
  const alerts = stats ? checkBudgetAlerts(budgets, stats.byCategory) : [];

  const handleLimitChange = (id: string, value: number) => {
    setBudgets(prev =>
      prev.map(b => (b.id === id ? { ...b, limit: value } : b))
    );
    setHasChanges(true);
  };

  const handleToggle = (id: string) => {
    setBudgets(prev =>
      prev.map(b => (b.id === id ? { ...b, isEnabled: !b.isEnabled } : b))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    localStore.setBudgets(budgets);
    setHasChanges(false);
    toast({
      title: 'Budgets enregistrés',
      description: 'Vos limites de budget ont été mises à jour',
    });
  };

  const handleReset = () => {
    setBudgets(DEFAULT_BUDGETS);
    setHasChanges(true);
  };

  // ✅ Nouvelle liste des catégories variables cohérente avec DEFAULT_BUDGETS enrichi
  const variableCategories: CategoryType[] = [
    'groceries',
    'food',
    'shopping',
    'entertainment',
    'transport',
    'health',
    'smoking',
    'household',
    'streaming',
    'subscriptions',
    'clothing',
    'beauty',
    'gifts',
    'hobbies',
    'travel',
    'unexpected',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
        <p className="text-muted-foreground mt-1">
          Définissez vos limites de dépenses par catégorie
        </p>
      </div>

      {/* Alerts */}
      <BudgetAlertCard alerts={alerts} />

      {/* Budget configuration */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Limites par catégorie</h2>
              <p className="text-sm text-muted-foreground">Budget mensuel maximum</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {budgets
            .filter(b => variableCategories.includes(b.category))
            .map(budget => {
              const spent = stats ? Math.abs(stats.byCategory[budget.category] || 0) : 0;
              const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

              return (
                <div
                  key={budget.id}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    budget.isEnabled ? 'border-border' : 'border-border/50 opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggle(budget.id)}
                        className={cn(
                          'w-10 h-6 rounded-full transition-colors relative',
                          budget.isEnabled ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                            budget.isEnabled ? 'left-5' : 'left-1'
                          )}
                        />
                      </button>
                      <span className="font-medium text-foreground">
                        {CATEGORY_LABELS[budget.category]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(spent)} / 
                      </span>
                      <input
                        type="number"
                        value={budget.limit}
                        onChange={(e) => handleLimitChange(budget.id, parseInt(e.target.value) || 0)}
                        disabled={!budget.isEnabled}
                        className="w-24 px-3 py-1 rounded-lg border border-border bg-background text-right text-foreground focus:border-primary focus:outline-none"
                      />
                      <span className="text-sm text-muted-foreground">€</span>
                    </div>
                  </div>
                  
                  {budget.isEnabled && budget.limit > 0 && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          percentage >= 100 ? 'bg-destructive' :
                          percentage >= 80 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Budgets;
