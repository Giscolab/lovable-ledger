import { Target, Calendar, TrendingUp, Trash2, Edit2 } from 'lucide-react';
import { FinancialGoal, GOAL_CATEGORIES, calculateGoalProgress, calculateMonthlyTarget, getDaysRemaining } from '@/utils/goals';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit?: (goal: FinancialGoal) => void;
  onDelete?: (id: string) => void;
  onUpdateAmount?: (id: string, amount: number) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete, onUpdateAmount }: GoalCardProps) => {
  const progress = calculateGoalProgress(goal);
  const monthlyTarget = calculateMonthlyTarget(goal);
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const categoryInfo = GOAL_CATEGORIES[goal.category];

  return (
    <div className="glass rounded-2xl p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${categoryInfo.color}20` }}
          >
            {categoryInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">{categoryInfo.label}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-sm text-muted-foreground">
            sur {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: categoryInfo.color,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={cn('font-medium', progress >= 100 ? 'text-success' : 'text-foreground')}>
            {progress.toFixed(1)}% atteint
          </span>
          <span className="text-muted-foreground">
            Reste {formatCurrency(goal.targetAmount - goal.currentAmount)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Échéance</p>
            <p className="text-sm font-medium text-foreground">
              {daysRemaining > 0 ? `${daysRemaining} jours` : 'Atteint'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Épargne/mois</p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(monthlyTarget)}
            </p>
          </div>
        </div>
      </div>

      {onUpdateAmount && progress < 100 && (
        <button
          onClick={() => {
            const amount = prompt('Montant à ajouter:', '100');
            if (amount) {
              const value = parseFloat(amount);
              if (!isNaN(value) && value > 0) {
                onUpdateAmount(goal.id, goal.currentAmount + value);
              }
            }
          }}
          className="w-full mt-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
        >
          + Ajouter de l'épargne
        </button>
      )}
    </div>
  );
};
