import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import { Transaction, CategoryType } from '@/utils/types';
import { CategoryTag } from './CategoryTag';
import { CATEGORY_LABELS } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: CategoryType) => void;
}

export const TransactionTable = ({ transactions, onCategoryChange }: TransactionTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date));
  };

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center shadow-card">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ArrowDownRight className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">Aucune transaction</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Importez un fichier CSV pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Libellé
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Catégorie
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedTransactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className="group transition-colors hover:bg-muted/30"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {transaction.label}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {editingId === transaction.id ? (
                    <select
                      value={transaction.category}
                      onChange={(e) => {
                        onCategoryChange(transaction.id, e.target.value as CategoryType);
                        setEditingId(null);
                      }}
                      onBlur={() => setEditingId(null)}
                      autoFocus
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingId(transaction.id)}
                      className="group/tag flex items-center gap-1"
                    >
                      <CategoryTag category={transaction.category} size="sm" />
                      <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/tag:opacity-100" />
                    </button>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className={cn(
                    'flex items-center justify-end gap-1 font-semibold',
                    transaction.isIncome ? 'text-success' : 'text-foreground'
                  )}>
                    {transaction.isIncome ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {transaction.isIncome ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
