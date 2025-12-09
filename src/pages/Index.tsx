import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '@/components/FileUploader';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionAddForm } from '@/components/TransactionAddForm';
import { DonutChart } from '@/components/DonutChart';
import { MonthlyStats } from '@/components/MonthlyStats';
import { IncompressibleCard } from '@/components/IncompressibleCard';
import { MonthSelector } from '@/components/MonthSelector';
import { BudgetAlertCard } from '@/components/BudgetAlertCard';
import { RecurringTransactions } from '@/components/RecurringTransactions';
import { GoalsWidget } from '@/components/GoalsWidget';
import { Transaction, CategoryType, MonthlyStats as MonthlyStatsType } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { computeMonthlyStats, getAvailableMonths } from '@/utils/computeStats';
import { checkBudgetAlerts } from '@/utils/budgets';
import { detectRecurringTransactions } from '@/utils/recurring';
import { categorizeTransaction } from '@/utils/categorize';
import { generateManualTransactionId } from '@/utils/transactionId';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, BarChart3, Plus, Undo2, Redo2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number; label: string } | null>(null);
  const [stats, setStats] = useState<MonthlyStatsType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { saveState, undo, redo, canUndo, canRedo } = useUndoRedo();

  useEffect(() => {
    const loadTransactions = () => {
      const saved = localStore.getTransactions();
      setTransactions(saved);
    };

    loadTransactions();

    // Listen for transactions added from FAB or other sources
    const handleTransactionAdded = () => loadTransactions();
    window.addEventListener('transaction-added', handleTransactionAdded);

    // Listen for new transaction shortcut
    const handleNewTransaction = () => setShowAddModal(true);
    window.addEventListener('shortcut-new-transaction', handleNewTransaction);

    return () => {
      window.removeEventListener('transaction-added', handleTransactionAdded);
      window.removeEventListener('shortcut-new-transaction', handleNewTransaction);
    };
  }, []);

  useEffect(() => {
    if (transactions.length === 0) {
      setStats(null);
      setSelectedMonth(null);
      return;
    }

    const months = getAvailableMonths(transactions);
    if (months.length > 0) {
      const lastMonth = localStore.getLastMonth();
      const found = months.find(m => `${m.year}-${m.month}` === lastMonth);
      const selected = found || months[0];
      setSelectedMonth(selected);
      setStats(computeMonthlyStats(transactions, selected.month, selected.year));
    }
  }, [transactions]);

  useEffect(() => {
    if (selectedMonth && transactions.length > 0) {
      setStats(computeMonthlyStats(transactions, selectedMonth.month, selectedMonth.year));
      localStore.setLastMonth(`${selectedMonth.year}-${selectedMonth.month}`);
    }
  }, [selectedMonth, transactions]);

  const handleUpload = useCallback((newTransactions: Transaction[]) => {
    saveState('Avant import');
    const result = localStore.addTransactions(newTransactions);
    setTransactions(result.all);
    saveState(`Import ${result.added} transactions`);
    toast({
      title: 'Import réussi',
      description: `${result.added} transactions ajoutées, ${result.skipped} doublons ignorés`,
    });
  }, [saveState]);

  const handleClear = useCallback(() => {
    saveState('Avant effacement');
    localStore.clearTransactions();
    setTransactions([]);
    setStats(null);
    setSelectedMonth(null);
    saveState('Données effacées');
    toast({
      title: 'Données effacées',
      description: 'Toutes les transactions ont été supprimées',
    });
  }, [saveState]);

  const handleCategoryChange = useCallback((id: string, category: CategoryType) => {
    setTransactions(prev => {
      const updated = prev.map(t => 
        t.id === id ? { ...t, category } : t
      );
      localStore.setTransactions(updated);
      return updated;
    });
  }, []);

  const handleTransactionUpdate = useCallback((transaction: Transaction) => {
    saveState('Avant modification');
    setTransactions(prev => {
      const updated = prev.map(t => t.id === transaction.id ? transaction : t);
      localStore.setTransactions(updated);
      return updated;
    });
    saveState('Transaction modifiée');
    toast({ title: 'Transaction modifiée' });
  }, [saveState]);

  const handleTransactionDelete = useCallback((id: string) => {
    saveState('Avant suppression');
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStore.setTransactions(updated);
      return updated;
    });
    saveState('Transaction supprimée');
    toast({ title: 'Transaction supprimée' });
  }, [saveState]);

  const handleTransactionAdd = useCallback((transaction: Omit<Transaction, 'id'>) => {
    saveState('Avant ajout');
    const rules = localStore.getRules();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateManualTransactionId(transaction.date, transaction.label, transaction.amount),
      category: transaction.category || categorizeTransaction(transaction.label, rules),
      source: transaction.source || 'manual',
      createdAt: transaction.createdAt || new Date().toISOString(),
      tags: transaction.tags || [],
    };
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      localStore.setTransactions(updated);
      return updated;
    });
    saveState('Transaction ajoutée');
    toast({ title: 'Transaction ajoutée' });
  }, [saveState]);

  const availableMonths = getAvailableMonths(transactions);
  const filteredTransactions = selectedMonth
    ? transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      })
    : [];

  const budgets = localStore.getBudgets();
  const alerts = stats ? checkBudgetAlerts(budgets, stats.byCategory) : [];
  const recurringTransactions = useMemo(() => detectRecurringTransactions(transactions), [transactions]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upload Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Importer vos relevés
        </h2>
        <FileUploader 
          onUpload={handleUpload} 
          onClear={handleClear}
          hasData={transactions.length > 0}
        />
      </section>

      {stats && selectedMonth && (
        <>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              Voir le tableau de bord
              <ArrowRight className="h-4 w-4" />
            </button>
            
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Annuler (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Rétablir (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Budget Alerts */}
          {alerts.length > 0 && <BudgetAlertCard alerts={alerts} />}

          {/* Widgets Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recurring Transactions */}
            <RecurringTransactions recurring={recurringTransactions} />
            
            {/* Goals Widget */}
            <GoalsWidget />
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Analyse de {selectedMonth.label}
            </h2>
            <MonthSelector
              months={availableMonths}
              selected={selectedMonth}
              onSelect={setSelectedMonth}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-2xl bg-card p-6 shadow-card">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Répartition des dépenses
                </h3>
                <DonutChart stats={stats} />
              </div>
              
              <IncompressibleCard stats={stats} />
            </div>

            <div className="space-y-6">
              <MonthlyStats stats={stats} />
            </div>
          </div>

          {/* Transactions Table */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Opérations ({filteredTransactions.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
              >
                <Plus className="h-4 w-4" />
                Ajouter une transaction
              </button>
            </div>
            <TransactionTable
              transactions={filteredTransactions}
              onCategoryChange={handleCategoryChange}
              onTransactionUpdate={handleTransactionUpdate}
              onTransactionDelete={handleTransactionDelete}
            />
          </section>
        </>
      )}

      {/* Section Opérations toujours visible - même sans import */}
      {!stats && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Opérations ({transactions.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
            >
              <Plus className="h-4 w-4" />
              Ajouter une transaction
            </button>
          </div>
          <TransactionTable
            transactions={transactions}
            onCategoryChange={handleCategoryChange}
            onTransactionUpdate={handleTransactionUpdate}
            onTransactionDelete={handleTransactionDelete}
          />
          
          {transactions.length === 0 && (
            <div className="mt-8 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Commencez votre analyse
              </h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Importez un relevé bancaire ou ajoutez vos transactions manuellement pour commencer.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Modal ajout manuel */}
      {showAddModal && (
        <TransactionAddForm
          onAdd={(tx) => {
            handleTransactionAdd(tx);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
