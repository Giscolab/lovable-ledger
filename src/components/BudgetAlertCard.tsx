import { AlertTriangle, TrendingUp } from 'lucide-react';
import { BudgetAlert } from '@/utils/budgets';
import { CATEGORY_LABELS } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface BudgetAlertCardProps {
  alerts: BudgetAlert[];
}

export const BudgetAlertCard = ({ alerts }: BudgetAlertCardProps) => {
  if (alerts.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Budget respecté</h3>
            <p className="text-sm text-muted-foreground">Toutes vos catégories sont dans les limites</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Alertes budget</h3>
          <p className="text-sm text-muted-foreground">{alerts.length} catégorie(s) à surveiller</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.category}
            className={cn(
              'rounded-xl p-3 border',
              alert.isOverBudget
                ? 'bg-destructive/10 border-destructive/30'
                : 'bg-warning/10 border-warning/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">
                {CATEGORY_LABELS[alert.category]}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  alert.isOverBudget ? 'text-destructive' : 'text-warning'
                )}
              >
                {alert.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  alert.isOverBudget ? 'bg-destructive' : 'bg-warning'
                )}
                style={{ width: `${Math.min(alert.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatCurrency(alert.spent)} dépensés</span>
              <span>Limite: {formatCurrency(alert.limit)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
