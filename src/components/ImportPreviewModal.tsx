import { useState, useMemo } from 'react';
import { X, Check, AlertTriangle, FileSpreadsheet, FileText, ArrowRight, CreditCard, RefreshCw } from 'lucide-react';
import { Transaction, CategoryType } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';
import { localStore } from '@/utils/localStore';
import { cn } from '@/lib/utils';
import { buildTransactionFingerprint, normalizeLabel, toMinorUnits } from '@/utils/normalization';

interface ImportPreviewModalProps {
  transactions: Transaction[];
  source: 'csv' | 'pdf';
  accountId: string;
  onConfirm: (transactions: Transaction[]) => void;
  onCancel: () => void;
}

export const ImportPreviewModal = ({
  transactions,
  source,
  accountId,
  onConfirm,
  onCancel,
}: ImportPreviewModalProps) => {
  const [editedTransactions, setEditedTransactions] = useState<Transaction[]>(transactions);
  const [statementDetails, setStatementDetails] = useState({
    openingBalance: '',
    closingBalance: '',
    startDate: '',
    endDate: '',
  });

  const deriveMinorAmount = (t: Transaction): number => {
    if (typeof t.amountMinor === 'number') return t.amountMinor;
    const base = toMinorUnits(Math.abs(t.amount));
    return t.isIncome ? base : -base;
  };

  const computeFingerprint = (t: Transaction) => {
    const normalized = t.normalizedLabel || normalizeLabel(t.label);
    const amountMinor = deriveMinorAmount(t);
    const fingerprint = t.dedupeHash || buildTransactionFingerprint({
      accountId: t.accountId,
      date: t.date,
      amountMinor,
      normalizedLabel: normalized,
      source: t.source,
    });

    return { fingerprint, amountMinor, normalizedLabel: normalized };
  };

  // Get account info
  const account = useMemo(() => localStore.getAccountById(accountId), [accountId]);

  // Detect duplicates
  const existingIds = useMemo(() => {
    const existing = localStore.getTransactions();
    return new Set(existing.map(t => t.id));
  }, []);

  const existingFingerprints = useMemo(() => {
    const existing = localStore.getTransactions();
    return new Set(existing.map(t => t.dedupeHash || computeFingerprint(t).fingerprint));
  }, []);

  const { newTransactions, duplicates } = useMemo(() => {
    const newTx: Transaction[] = [];
    const dupTx: Transaction[] = [];

    editedTransactions.forEach(t => {
      const { fingerprint, amountMinor, normalizedLabel } = computeFingerprint(t);
      const candidate = { ...t, dedupeHash: fingerprint, amountMinor, normalizedLabel };

      if (existingIds.has(t.id) || existingFingerprints.has(fingerprint)) {
        dupTx.push(candidate);
      } else {
        newTx.push(candidate);
      }
    });

    return { newTransactions: newTx, duplicates: dupTx };
  }, [editedTransactions, existingFingerprints, existingIds]);

  const totals = useMemo(() => {
    const incomeMinor = newTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Math.abs(deriveMinorAmount(t)), 0);
    const expenseMinor = newTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Math.abs(deriveMinorAmount(t)), 0);
    const netMinor = newTransactions.reduce((sum, t) => sum + deriveMinorAmount(t), 0);

    return { incomeMinor, expenseMinor, netMinor };
  }, [newTransactions]);

  const handleCategoryChange = (id: string, category: CategoryType) => {
    setEditedTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  // Toggle sign for a single transaction
  const handleToggleSign = (id: string) => {
    setEditedTransactions(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const newAmountMinor = -(t.amountMinor || (t.isIncome ? Math.abs(t.amount) * 100 : -Math.abs(t.amount) * 100));
        return {
          ...t,
          amountMinor: newAmountMinor,
          isIncome: newAmountMinor > 0,
        };
      })
    );
  };

  // Invert all signs
  const handleInvertAllSigns = () => {
    setEditedTransactions(prev =>
      prev.map(t => {
        const newAmountMinor = -(t.amountMinor || (t.isIncome ? Math.abs(t.amount) * 100 : -Math.abs(t.amount) * 100));
        return {
          ...t,
          amountMinor: newAmountMinor,
          isIncome: newAmountMinor > 0,
        };
      })
    );
  };

  const parseBalanceInput = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed)) return null;
    return toMinorUnits(parsed);
  };

  const reconciliation = useMemo(() => {
    const openingMinor = parseBalanceInput(statementDetails.openingBalance);
    const closingMinor = parseBalanceInput(statementDetails.closingBalance);

    if (openingMinor === null || closingMinor === null) return null;

    const expectedClosing = openingMinor + totals.netMinor;
    const delta = closingMinor - expectedClosing;

    return {
      openingMinor,
      closingMinor,
      expectedClosing,
      delta,
      isBalanced: delta === 0,
    };
  }, [statementDetails, totals.netMinor]);

  const handleConfirm = () => {
    if (newTransactions.length > 0 && reconciliation && statementDetails.startDate && statementDetails.endDate) {
      localStore.addStatement({
        accountId,
        startDate: statementDetails.startDate,
        endDate: statementDetails.endDate,
        openingBalanceMinor: reconciliation.openingMinor,
        closingBalanceMinor: reconciliation.closingMinor,
        transactionIds: newTransactions.map(t => t.id),
        currency: 'EUR',
      });
    }
    onConfirm(newTransactions);
  };

  const formatMinor = (value: number) => formatCurrency(Math.abs(value) / 100);

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

        {/* Destination Account */}
        {account && (
          <div className="mx-4 mt-4 rounded-xl bg-primary/10 border border-primary/30 p-3">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">
                Destination : {account.name}
                {account.bankName && ` (${account.bankName})`}
              </span>
            </div>
          </div>
        )}

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
            <p className="text-sm font-bold text-success">+{formatMinor(totals.incomeMinor)}</p>
          </div>
          <div className="rounded-xl bg-destructive/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="text-sm font-bold text-destructive">-{formatMinor(totals.expenseMinor)}</p>
          </div>
        </div>

        {/* Statement reconciliation */}
        <div className="p-4 border-b border-border bg-muted/10 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <p className="text-xs text-muted-foreground">Période du relevé</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={statementDetails.startDate}
                  onChange={(e) => setStatementDetails(prev => ({ ...prev, startDate: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={statementDetails.endDate}
                  onChange={(e) => setStatementDetails(prev => ({ ...prev, endDate: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px] space-y-1">
              <p className="text-xs text-muted-foreground">Balances (EUR)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Solde initial"
                  value={statementDetails.openingBalance}
                  onChange={(e) => setStatementDetails(prev => ({ ...prev, openingBalance: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Solde final"
                  value={statementDetails.closingBalance}
                  onChange={(e) => setStatementDetails(prev => ({ ...prev, closingBalance: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {reconciliation ? (
            <div className={cn(
              'rounded-xl p-3 flex items-center justify-between border',
              reconciliation.isBalanced
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-destructive/5 border-destructive/30 text-destructive'
            )}>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {reconciliation.isBalanced
                    ? '✅ Relevé réconcilié'
                    : `❌ Écart de ${formatMinor(reconciliation.delta)}`}
                </p>
                <p className="text-muted-foreground">
                  Variation calculée : {totals.netMinor >= 0 ? '+' : '-'}{formatMinor(totals.netMinor)} · Solde attendu : {formatMinor(reconciliation.expectedClosing)} · Solde déclaré : {formatMinor(reconciliation.closingMinor)}
                </p>
              </div>
              {!reconciliation.isBalanced && (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Ajoutez les soldes du relevé pour afficher un contrôle de cohérence.</p>
          )}
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
              {/* Invert all signs button */}
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={handleInvertAllSigns}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Inverser tous les signes
                </button>
              </div>
              
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
                  
                  {/* Toggle sign button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSign(t.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      t.isIncome 
                        ? 'bg-success/10 text-success hover:bg-success/20' 
                        : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    )}
                    title="Inverser le signe"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  
                  <div className={cn(
                    'text-right font-semibold whitespace-nowrap min-w-[80px]',
                    t.isIncome ? 'text-success' : 'text-destructive'
                  )}>
                    {t.isIncome ? '+' : '-'}{formatMinor(deriveMinorAmount(t))}
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
