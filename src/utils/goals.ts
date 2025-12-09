export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'savings' | 'investment' | 'debt' | 'purchase';
  color: string;
  createdAt: string;
}

export const GOAL_CATEGORIES = {
  savings: { label: 'Épargne', icon: '💰', color: 'hsl(var(--success))' },
  investment: { label: 'Investissement', icon: '📈', color: 'hsl(var(--primary))' },
  debt: { label: 'Remboursement', icon: '💳', color: 'hsl(var(--warning))' },
  purchase: { label: 'Achat', icon: '🛒', color: 'hsl(var(--accent))' },
};

export function calculateGoalProgress(goal: FinancialGoal): number {
  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
}

export function calculateMonthlyTarget(goal: FinancialGoal): number {
  const remaining = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const now = new Date();
  const monthsLeft = Math.max(
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth()),
    1
  );
  return remaining / monthsLeft;
}

export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function generateGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
