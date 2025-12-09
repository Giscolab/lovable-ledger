import { useState } from 'react';
import { RefreshCw, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  RecurringTransaction, 
  FREQUENCY_LABELS, 
  calculateMonthlyRecurring,
  getUpcomingRecurring 
} from '@/utils/recurring';
import { CategoryTag } from './CategoryTag';
import { Sparkline } from './Sparkline';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface RecurringTransactionsProps {
  recurring: RecurringTransaction[];
}

export const RecurringTransactions = ({ recurring }: RecurringTransactionsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const activeRecurring = recurring.filter(r => r.isActive);
  const monthlyTotal = calculateMonthlyRecurring(recurring);
  const upcoming = getUpcomingRecurring(recurring, 14);

  const displayedRecurring = showAll ? activeRecurring : activeRecurring.slice(0, 5);

  if (recurring.length === 0) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Dépenses récurrentes</h3>
            <p className="text-sm text-muted-foreground">
              {activeRecurring.length} abonnement{activeRecurring.length > 1 ? 's' : ''} détecté{activeRecurring.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
            <p className="text-xs text-muted-foreground">/mois estimé</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-4 animate-fade-in">
          {/* Upcoming alerts */}
          {upcoming.length > 0 && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Prélèvements à venir
                </span>
              </div>
              <div className="space-y-2">
                {upcoming.slice(0, 3).map((r) => {
                  const days = getDaysUntil(r.nextExpectedDate);
                  return (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate max-w-[200px]">
                        {r.label.slice(0, 30)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days}j`}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(r.averageAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recurring list */}
          <div className="space-y-2">
            {displayedRecurring.map((r) => {
              // Get amounts for sparkline (sorted by date ascending)
              const sparklineData = [...r.transactions]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(t => t.amount);

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CategoryTag category={r.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px] sm:max-w-[250px]">
                        {r.label}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded',
                          r.frequency === 'monthly' ? 'bg-primary/20 text-primary' :
                          r.frequency === 'quarterly' ? 'bg-warning/20 text-warning' :
                          'bg-accent/20 text-accent-foreground'
                        )}>
                          {FREQUENCY_LABELS[r.frequency]}
                        </span>
                        <span>•</span>
                        <span>{r.occurrences} occ.</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sparkline */}
                  <div className="hidden sm:block mx-2">
                    <Sparkline 
                      data={sparklineData} 
                      width={60} 
                      height={20}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(r.averageAmount)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(r.nextExpectedDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more button */}
          {activeRecurring.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showAll ? 'Voir moins' : `Voir tous (${activeRecurring.length})`}
            </button>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyTotal)}
              </p>
              <p className="text-xs text-muted-foreground">Par mois</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyTotal * 12)}
              </p>
              <p className="text-xs text-muted-foreground">Par an</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {activeRecurring.length}
              </p>
              <p className="text-xs text-muted-foreground">Abonnements</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
