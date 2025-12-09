import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { MonthlyStats as MonthlyStatsType } from '@/utils/types';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface MonthlyStatsProps {
  stats: MonthlyStatsType;
}

export const MonthlyStats = ({ stats }: MonthlyStatsProps) => {
  const cards = [
    {
      label: 'Revenus',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Dépenses',
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Incompressibles',
      value: stats.incompressible,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Reste à vivre',
      value: stats.resteAVivre,
      icon: PiggyBank,
      color: stats.resteAVivre >= 0 ? 'text-success' : 'text-destructive',
      bgColor: stats.resteAVivre >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
  ];

  const daysInMonth = new Date(stats.year, new Date(`${stats.month} 1`).getMonth() + 1, 0).getDate();
  const avgPerDay = stats.totalExpenses / daysInMonth;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="group rounded-2xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={cn('rounded-xl p-2.5', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            </div>
            <p className={cn('mt-3 text-2xl font-bold', card.color)}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Moyenne journalière</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency(avgPerDay)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Dépenses variables</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency(stats.variable)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
