import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, Calendar } from 'lucide-react';
import { localStore } from '@/utils/localStore';
import { FinancialGoal, GOAL_CATEGORIES, calculateGoalProgress, getDaysRemaining, calculateMonthlyTarget } from '@/utils/goals';
import { formatCurrency } from '@/utils/computeStats';

export const GoalsWidget = () => {
  const navigate = useNavigate();
  const goals = localStore.getGoals() as FinancialGoal[];
  
  if (goals.length === 0) return null;

  // Calculate totals
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const globalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  // Get next 3 goals by deadline
  const upcomingGoals = [...goals]
    .filter(g => getDaysRemaining(g.targetDate) > 0)
    .sort((a, b) => getDaysRemaining(a.targetDate) - getDaysRemaining(b.targetDate))
    .slice(0, 3);

  return (
    <div className="rounded-2xl glass p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Objectifs financiers</h3>
        </div>
        <button
          onClick={() => navigate('/goals')}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Voir tout
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Global Progress */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Progression globale</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
            style={{ width: `${Math.min(globalProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {Math.round(globalProgress)}% atteint
        </p>
      </div>

      {/* Upcoming Goals */}
      {upcomingGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Prochaines échéances</p>
          {upcomingGoals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            const daysLeft = getDaysRemaining(goal.targetDate);
            const remaining = goal.targetAmount - goal.currentAmount;
            const category = GOAL_CATEGORIES[goal.category];

            return (
              <div key={goal.id} className="p-3 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span className="font-medium text-foreground text-sm">{goal.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {daysLeft}j
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: goal.color || category.color
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Reste {formatCurrency(remaining)}
                  </span>
                  <span className="text-foreground font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {upcomingGoals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tous vos objectifs sont atteints ! 🎉
        </p>
      )}
    </div>
  );
};
