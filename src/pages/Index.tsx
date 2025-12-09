import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { FileUploader } from '@/components/FileUploader';
import { TransactionTable } from '@/components/TransactionTable';
import { DonutChart } from '@/components/DonutChart';
import { MonthlyStats } from '@/components/MonthlyStats';
import { IncompressibleCard } from '@/components/IncompressibleCard';
import { YearProjection } from '@/components/YearProjection';
import { MonthSelector } from '@/components/MonthSelector';
import { Transaction, CategoryType, MonthlyStats as MonthlyStatsType } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { computeMonthlyStats, getAvailableMonths } from '@/utils/computeStats';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number; label: string } | null>(null);
  const [stats, setStats] = useState<MonthlyStatsType | null>(null);

  // Load data on mount
  useEffect(() => {
    const saved = localStore.getTransactions();
    if (saved.length > 0) {
      setTransactions(saved);
    }
    
    // Initialize theme
    const theme = localStore.getTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Update stats when transactions or selected month changes
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

  // Update stats when month selection changes
  useEffect(() => {
    if (selectedMonth && transactions.length > 0) {
      setStats(computeMonthlyStats(transactions, selectedMonth.month, selectedMonth.year));
      localStore.setLastMonth(`${selectedMonth.year}-${selectedMonth.month}`);
    }
  }, [selectedMonth, transactions]);

  const handleUpload = useCallback((newTransactions: Transaction[]) => {
    const all = localStore.addTransactions(newTransactions);
    setTransactions(all);
    toast({
      title: 'Import réussi',
      description: `${newTransactions.length} transactions importées`,
    });
  }, []);

  const handleClear = useCallback(() => {
    localStore.clearTransactions();
    setTransactions([]);
    setStats(null);
    setSelectedMonth(null);
    toast({
      title: 'Données effacées',
      description: 'Toutes les transactions ont été supprimées',
    });
  }, []);

  const handleCategoryChange = useCallback((id: string, category: CategoryType) => {
    setTransactions(prev => {
      const updated = prev.map(t => 
        t.id === id ? { ...t, category } : t
      );
      localStore.setTransactions(updated);
      return updated;
    });
  }, []);

  const availableMonths = getAvailableMonths(transactions);
  const filteredTransactions = selectedMonth
    ? transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      })
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload Section */}
        <section className="mb-8 animate-fade-in">
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
            {/* Month Selector */}
            <div className="mb-6 flex items-center justify-between animate-slide-up">
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
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Left Column - Charts */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-card p-6 shadow-card animate-slide-up">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Répartition des dépenses
                  </h3>
                  <DonutChart stats={stats} />
                </div>
                
                <IncompressibleCard stats={stats} />
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                <MonthlyStats stats={stats} />
                
                <YearProjection stats={stats} />
              </div>
            </div>

            {/* Transactions Table */}
            <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Opérations ({filteredTransactions.length})
              </h2>
              <TransactionTable
                transactions={filteredTransactions}
                onCategoryChange={handleCategoryChange}
              />
            </section>
          </>
        )}

        {transactions.length === 0 && (
          <div className="mt-12 text-center animate-fade-in">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Commencez votre analyse
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Importez votre relevé bancaire (CSV ou PDF) pour visualiser vos dépenses et planifier votre épargne.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>100% local • Vos données restent sur votre appareil</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
