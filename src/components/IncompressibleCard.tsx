import { Lock } from 'lucide-react';
import { MonthlyStats } from '@/utils/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, INCOMPRESSIBLE_CATEGORIES } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';

interface IncompressibleCardProps {
  stats: MonthlyStats;
}

export const IncompressibleCard = ({ stats }: IncompressibleCardProps) => {
  const incompressibleExpenses = INCOMPRESSIBLE_CATEGORIES
    .map(cat => ({
      category: cat,
      amount: stats.byCategory[cat],
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
    }))
    .filter(item => item.amount > 0);

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Dépenses incompressibles</h3>
          <p className="text-sm text-muted-foreground">Charges fixes mensuelles</p>
        </div>
      </div>

      {incompressibleExpenses.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          Aucune charge fixe détectée
        </p>
      ) : (
        <div className="space-y-3">
          {incompressibleExpenses.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <span className="font-semibold text-foreground">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
        <span className="font-semibold text-primary">Total</span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(stats.incompressible)}
        </span>
      </div>
    </div>
  );
};
