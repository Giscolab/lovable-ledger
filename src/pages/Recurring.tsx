import { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  Calendar, 
  Eye, 
  EyeOff,
  TrendingDown,
  Clock
} from 'lucide-react';
import { Transaction } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { 
  detectRecurringTransactions, 
  calculateMonthlyRecurring,
  toggleRecurringIgnored,
  RecurringTransaction,
  FREQUENCY_LABELS
} from '@/utils/recurring';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/categories';
import { formatCurrency, formatCurrencyFull } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

const Recurring = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [showIgnored, setShowIgnored] = useState(false);

  useEffect(() => {
    const saved = localStore.getTransactions();
    setTransactions(saved);
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      setRecurring(detectRecurringTransactions(transactions));
    }
  }, [transactions]);

  const filteredRecurring = useMemo(() => {
    return showIgnored ? recurring : recurring.filter(r => !r.isIgnored);
  }, [recurring, showIgnored]);

  const monthlyTotal = useMemo(() => calculateMonthlyRecurring(recurring), [recurring]);
  const yearlyTotal = monthlyTotal * 12;

  const handleToggleIgnored = (id: string) => {
    toggleRecurringIgnored(id);
    setRecurring(detectRecurringTransactions(transactions));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'bg-primary/10 text-primary';
      case 'quarterly': return 'bg-warning/10 text-warning';
      case 'annual': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <RefreshCw className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Aucune donnée</h2>
        <p className="text-muted-foreground max-w-md">
          Importez vos relevés bancaires pour détecter les transactions récurrentes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions récurrentes</h1>
          <p className="text-muted-foreground">Gérez vos charges fixes et abonnements</p>
        </div>
        <button
          onClick={() => setShowIgnored(!showIgnored)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
            showIgnored
              ? 'bg-muted text-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {showIgnored ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showIgnored ? 'Masquer ignorés' : 'Voir ignorés'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-destructive/10 p-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Charges mensuelles</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">estimées par mois</p>
        </div>

        <div className="rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-warning/10 p-2">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Charges annuelles</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(yearlyTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">estimées par an</p>
        </div>

        <div className="rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Récurrents détectés</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{recurring.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {recurring.filter(r => r.isActive && !r.isIgnored).length} actifs
          </p>
        </div>
      </div>

      {/* Recurring List */}
      <div className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Libellé</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Catégorie</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fréquence</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Dernier</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Prochain</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecurring.map((r) => (
                <tr 
                  key={r.id} 
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    r.isIgnored && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {r.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.occurrences} occurrences
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-medium">
                      <span>{CATEGORY_ICONS[r.category]}</span>
                      {CATEGORY_LABELS[r.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium',
                      getFrequencyColor(r.frequency)
                    )}>
                      <Clock className="h-3 w-3" />
                      {FREQUENCY_LABELS[r.frequency]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-medium text-destructive">
                      -{formatCurrencyFull(r.averageAmount)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(r.lastDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(r.nextExpectedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        'inline-flex h-2 w-2 rounded-full',
                        r.isActive && !r.isIgnored ? 'bg-success' : 'bg-muted-foreground'
                      )} />
                      <button
                        onClick={() => handleToggleIgnored(r.id)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          r.isIgnored
                            ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            : 'bg-primary/10 hover:bg-primary/20 text-primary'
                        )}
                        title={r.isIgnored ? 'Réactiver' : 'Ignorer'}
                      >
                        {r.isIgnored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecurring.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showIgnored 
                ? 'Aucune transaction récurrente détectée'
                : 'Aucune transaction récurrente active'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recurring;
