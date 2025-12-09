import { useState, useMemo } from 'react';
import { X, Check, AlertTriangle, FileSpreadsheet, FileText, ArrowRight, Tag } from 'lucide-react';
import { Transaction, CategoryType } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';
import { localStore } from '@/utils/localStore';
import { cn } from '@/lib/utils';

interface ImportPreviewModalProps {
  transactions: Transaction[];
  source: 'csv' | 'pdf';
  onConfirm: (transactions: Transaction[]) => void;
  onCancel: () => void;
}

export const ImportPreviewModal = ({
  transactions,
  source,
  onConfirm,
  onCancel,
}: ImportPreviewModalProps) => {
  const [editedTransactions, setEditedTransactions] = useState<Transaction[]>(transactions);

  // Detect duplicates
  const existingIds = useMemo(() => {
    const existing = localStore.getTransactions();
    return new Set(existing.map(t => t.id));
  }, []);

  const { newTransactions, duplicates } = useMemo(() => {
    const newTx: Transaction[] = [];
    const dupTx: Transaction[] = [];
    
    editedTransactions.forEach(t => {
      if (existingIds.has(t.id)) {
        dupTx.push(t);
      } else {
        newTx.push(t);
      }
    });
    
    return { newTransactions: newTx, duplicates: dupTx };
  }, [editedTransactions, existingIds]);

  const totalIncome = newTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = newTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);

  const handleCategoryChange = (id: string, category: CategoryType) => {
    setEditedTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const handleConfirm = () => {
    onConfirm(newTransactions);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-4xl glass rounded-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {source === 'csv' ? (
              <FileSpreadsheet className="h-6 w-6 text-success" />
            ) : (
              <FileText className="h-6 w-6 text-warning" />
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Aperçu de l'import {source.toUpperCase()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {transactions.length} transaction{transactions.length > 1 ? 's' : ''} détectée{transactions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/30">
          <div className="rounded-xl bg-success/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Nouvelles</p>
            <p className="text-lg font-bold text-success">{newTransactions.length}</p>
          </div>
          <div className="rounded-xl bg-warning/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Doublons</p>
            <p className="text-lg font-bold text-warning">{duplicates.length}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Revenus</p>
            <p className="text-sm font-bold text-success">+{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-xl bg-destructive/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="text-sm font-bold text-destructive">-{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Duplicates Warning */}
        {duplicates.length > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-warning/10 border border-warning/30 p-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {duplicates.length} doublon{duplicates.length > 1 ? 's' : ''} détecté{duplicates.length > 1 ? 's' : ''} - sera{duplicates.length > 1 ? 'ont' : ''} ignoré{duplicates.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4">
          {newTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning" />
              <p>Toutes les transactions sont des doublons.</p>
              <p className="text-sm">Rien ne sera importé.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newTransactions.slice(0, 50).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.date)}
                    </p>
                  </div>
                  
                  <select
                    value={t.category}
                    onChange={(e) => handleCategoryChange(t.id, e.target.value as CategoryType)}
                    className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:border-primary focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                  
                  <div className={cn(
                    'text-right font-semibold whitespace-nowrap',
                    t.isIncome ? 'text-success' : 'text-foreground'
                  )}>
                    {t.isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
              {newTransactions.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... et {newTransactions.length - 50} autres transactions
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={newTransactions.length === 0}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all',
              newTransactions.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Check className="h-4 w-4" />
            Importer {newTransactions.length} transaction{newTransactions.length > 1 ? 's' : ''}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
