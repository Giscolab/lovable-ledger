import { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { Transaction, MonthlyStats as MonthlyStatsType, YearlyStats } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { 
  computeMonthlyStats, 
  computeYearlyStats, 
  getAvailableYears,
  getAvailableMonths,
  getTrendData,
  formatCurrency 
} from '@/utils/computeStats';
import { CATEGORY_LABELS, INCOMPRESSIBLE_CATEGORIES } from '@/utils/categories';
import { ComparisonChart } from '@/components/ComparisonChart';
import { ReportGenerator } from '@/components/ReportGenerator';
import { DailyCashflowChart } from '@/components/DailyCashflowChart';
import { BackupRestore } from '@/components/BackupRestore';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  const [currentMonthStats, setCurrentMonthStats] = useState<MonthlyStatsType | null>(null);
  const [previousMonthStats, setPreviousMonthStats] = useState<MonthlyStatsType | null>(null);
  const [initialBalance, setInitialBalance] = useState<number>(0);

  useEffect(() => {
    const loadData = () => {
      const saved = localStore.getTransactions();
      setTransactions(saved);
      setInitialBalance(localStore.getInitialBalance());
    };

    loadData();

    // Listen for transactions added from FAB
    window.addEventListener('transaction-added', loadData);
    return () => window.removeEventListener('transaction-added', loadData);
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      setYearlyStats(computeYearlyStats(transactions, selectedYear));
      
      // Compute comparison stats
      const months = getAvailableMonths(transactions);
      if (months.length > 0) {
        const current = months[0];
        setCurrentMonthStats(computeMonthlyStats(transactions, current.month, current.year));
        
        if (months.length > 1) {
          const previous = months[1];
          setPreviousMonthStats(computeMonthlyStats(transactions, previous.month, previous.year));
        } else {
          setPreviousMonthStats(null);
        }
      }
    }
  }, [transactions, selectedYear]);

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const trendData = useMemo(() => getTrendData(transactions, 12), [transactions]);
  
  // Get current month info for cashflow chart
  const currentMonthInfo = useMemo(() => {
    const months = getAvailableMonths(transactions);
    return months[0] || { month: new Date().getMonth(), year: new Date().getFullYear() };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Wallet className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Aucune donnée</h2>
        <p className="text-muted-foreground max-w-md">
          Importez vos relevés bancaires pour voir votre tableau de bord financier.
        </p>
      </div>
    );
  }

  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Revenus',
        data: trendData.income,
        borderColor: 'hsl(142, 70%, 45%)',
        backgroundColor: 'hsla(142, 70%, 45%, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Dépenses',
        data: trendData.expenses,
        borderColor: 'hsl(0, 70%, 50%)',
        backgroundColor: 'hsla(0, 70%, 50%, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 11%)',
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: 'hsla(var(--border), 0.5)' },
        ticks: { callback: (v: any) => formatCurrency(v) },
      },
      x: { grid: { display: false } },
    },
  };

  // Category pie chart
  const categoryData = yearlyStats ? Object.entries(yearlyStats.byCategory)
    .filter(([_, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]) : [];

  const pieColors = [
    'hsl(25, 80%, 50%)', 'hsl(142, 70%, 45%)', 'hsl(200, 70%, 50%)',
    'hsl(280, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(60, 70%, 50%)',
    'hsl(180, 70%, 50%)', 'hsl(100, 70%, 50%)', 'hsl(220, 70%, 50%)',
    'hsl(320, 70%, 50%)', 'hsl(40, 70%, 50%)', 'hsl(160, 70%, 50%)',
  ];

  const pieChartData = {
    labels: categoryData.map(([cat]) => CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]),
    datasets: [{
      data: categoryData.map(([_, v]) => v),
      backgroundColor: pieColors.slice(0, categoryData.length),
      borderWidth: 0,
    }],
  };

  // Stacked bar chart for monthly breakdown
  const stackedData = yearlyStats ? {
    labels: yearlyStats.monthlyBreakdown.map(m => m.month.slice(0, 3)),
    datasets: [
      {
        label: 'Incompressibles',
        data: yearlyStats.monthlyBreakdown.map(m => m.incompressible),
        backgroundColor: 'hsl(25, 80%, 50%)',
        stack: 'expenses',
      },
      {
        label: 'Variables',
        data: yearlyStats.monthlyBreakdown.map(m => m.variable),
        backgroundColor: 'hsl(200, 70%, 50%)',
        stack: 'expenses',
      },
      {
        label: 'Épargne',
        data: yearlyStats.monthlyBreakdown.map(m => Math.max(0, m.savings)),
        backgroundColor: 'hsl(142, 70%, 45%)',
        stack: 'savings',
      },
    ],
  } : null;

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: { label: (ctx: any) => ` ${formatCurrency(ctx.raw)}` },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { 
        stacked: true,
        grid: { color: 'hsla(var(--border), 0.5)' },
        ticks: { callback: (v: any) => formatCurrency(v) },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos finances</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards - Mercury Glass Style */}
      {yearlyStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl glass p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Revenus {selectedYear}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(yearlyStats.totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ~{formatCurrency(yearlyStats.averageMonthlyIncome)}/mois
            </p>
          </div>

          <div className="rounded-2xl glass p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-destructive/10 p-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-sm text-muted-foreground">Dépenses {selectedYear}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(yearlyStats.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ~{formatCurrency(yearlyStats.averageMonthlyExpenses)}/mois
            </p>
          </div>

          <div className="rounded-2xl glass p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Épargne {selectedYear}</span>
            </div>
            <p className={cn(
              'text-2xl font-bold tracking-tight',
              yearlyStats.totalSavings >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatCurrency(yearlyStats.totalSavings)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {yearlyStats.totalSavings >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">
                {Math.round((yearlyStats.totalSavings / yearlyStats.totalIncome) * 100)}% du revenu
              </span>
            </div>
          </div>

          <div className="rounded-2xl glass p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-warning/10 p-2">
                <Wallet className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Incompressibles</span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(INCOMPRESSIBLE_CATEGORIES.reduce((sum, cat) => 
                sum + (yearlyStats.byCategory[cat] || 0), 0
              ))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">charges fixes annuelles</p>
          </div>
        </div>
      )}

      {/* Daily Cashflow Chart */}
      <DailyCashflowChart
        transactions={transactions}
        month={currentMonthInfo.month}
        year={currentMonthInfo.year}
        initialBalance={initialBalance}
      />

      {/* Charts Row - Mercury Glass Style */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="rounded-2xl glass p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Évolution sur 12 mois</h3>
          <div className="h-[300px]">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-2xl glass p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Répartition des dépenses</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut 
              data={pieChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' as const, labels: { boxWidth: 12 } },
                  tooltip: {
                    backgroundColor: 'hsl(0, 0%, 8%)',
                    titleColor: 'hsl(0, 0%, 95%)',
                    bodyColor: 'hsl(0, 0%, 95%)',
                    borderColor: 'hsl(0, 0%, 18%)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: { label: (ctx: any) => ` ${formatCurrency(ctx.raw)}` },
                  },
                },
                cutout: '65%',
              }} 
            />
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      {stackedData && (
        <div className="rounded-2xl glass p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Répartition mensuelle {selectedYear}</h3>
          <div className="h-[350px]">
            <Bar data={stackedData} options={barChartOptions} />
          </div>
        </div>
      )}

      {/* Comparison & Reports Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Month Comparison */}
        {currentMonthStats && (
          <ComparisonChart 
            currentStats={currentMonthStats} 
            previousStats={previousMonthStats} 
          />
        )}

        {/* Report Generator */}
        <ReportGenerator
          monthlyStats={currentMonthStats}
          yearlyStats={yearlyStats}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
          selectedYear={selectedYear}
        />
      </div>

      {/* Top Categories */}
      {yearlyStats && (
        <div className="rounded-2xl glass p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Top catégories de dépenses</h3>
          <div className="space-y-3">
            {categoryData.slice(0, 6).map(([cat, amount], i) => {
              const percent = (amount / yearlyStats.totalExpenses) * 100;
              return (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-6 text-sm font-medium text-muted-foreground">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                      </span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percent}%`,
                          backgroundColor: pieColors[i]
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                    {Math.round(percent)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backup & Restore */}
      <BackupRestore />
    </div>
  );
};

export default Dashboard;
