import { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  Target, 
  Settings, 
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MultiYearProjection, ProjectionSettings, Transaction } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { 
  generateMultiYearProjection, 
  formatCurrency,
  computeYearlyStats
} from '@/utils/computeStats';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

const Projection = () => {
  const [settings, setSettings] = useState<ProjectionSettings>(() => ({
    ...localStore.getProjectionSettings(),
    targetYear: 2042
  }));
  const [showSettings, setShowSettings] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewRange, setViewRange] = useState<{ start: number; end: number }>({ start: 2024, end: 2042 });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStore.getTransactions();
    setTransactions(saved);
  }, []);

  useEffect(() => {
    localStore.setProjectionSettings(settings);
  }, [settings]);

  // Calculate base expenses from actual data if available
  const baseExpenses = useMemo(() => {
    if (transactions.length === 0) return 2000;
    const currentYear = new Date().getFullYear();
    const stats = computeYearlyStats(transactions, currentYear);
    return stats.averageMonthlyExpenses || 2000;
  }, [transactions]);

  const projections = useMemo(() => 
    generateMultiYearProjection(
      settings.monthlyIncome,
      baseExpenses,
      settings.savingsGoal,
      2022,
      2042,
      0.02,
      0.015
    ), [settings.monthlyIncome, baseExpenses, settings.savingsGoal]
  );

  const visibleProjections = projections.filter(
    p => p.year >= viewRange.start && p.year <= viewRange.end
  );

  const selectedProjection = selectedYear 
    ? projections.find(p => p.year === selectedYear) 
    : null;

  // Line chart for cumulative savings
  const lineData = {
    labels: visibleProjections.map(p => p.year.toString()),
    datasets: [
      {
        label: 'Épargne cumulée',
        data: visibleProjections.map(p => p.cumulativeSavings),
        borderColor: 'hsl(142, 70%, 45%)',
        backgroundColor: 'hsla(142, 70%, 45%, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Objectif',
        data: visibleProjections.map(() => settings.savingsGoal),
        borderColor: 'hsl(25, 80%, 50%)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  // Bar chart for yearly savings
  const barData = {
    labels: visibleProjections.map(p => p.year.toString()),
    datasets: [
      {
        label: 'Épargne annuelle',
        data: visibleProjections.map(p => p.yearlySavings),
        backgroundColor: visibleProjections.map(p => 
          p.year === selectedYear 
            ? 'hsl(25, 80%, 50%)' 
            : 'hsl(142, 70%, 45%)'
        ),
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
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
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedYear(visibleProjections[index].year);
      }
    },
  };

  const yearGoalReached = projections.find(p => p.cumulativeSavings >= settings.savingsGoal)?.year;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prévisionnel</h1>
          <p className="text-muted-foreground">Projection 2022 - 2042</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
            showSettings 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-2xl bg-card p-6 shadow-card animate-scale-in space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Revenu mensuel</label>
              <input
                type="number"
                value={settings.monthlyIncome}
                onChange={(e) => setSettings({ ...settings, monthlyIncome: Number(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Objectif d'épargne</label>
              <input
                type="number"
                value={settings.savingsGoal}
                onChange={(e) => setSettings({ ...settings, savingsGoal: Number(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Budget variable</label>
              <input
                type="number"
                value={settings.variableBudget}
                onChange={(e) => setSettings({ ...settings, variableBudget: Number(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * Croissance annuelle : +2% revenus, +1.5% dépenses (ajustement inflation)
          </p>
        </div>
      )}

      {/* Goal Reached Banner */}
      {yearGoalReached && (
        <div className="rounded-2xl bg-success/10 border border-success/20 p-5 flex items-center gap-4">
          <div className="rounded-xl bg-success/20 p-3">
            <Sparkles className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="font-semibold text-success">Objectif atteint en {yearGoalReached} !</p>
            <p className="text-sm text-muted-foreground">
              Avec vos paramètres actuels, vous atteindrez {formatCurrency(settings.savingsGoal)} d'épargne
            </p>
          </div>
        </div>
      )}

      {/* View Range Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setViewRange({ start: 2022, end: 2032 })}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-all',
            viewRange.end === 2032 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}
        >
          2022-2032
        </button>
        <button
          onClick={() => setViewRange({ start: 2024, end: 2042 })}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-all',
            viewRange.start === 2024 && viewRange.end === 2042 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}
        >
          2024-2042
        </button>
        <button
          onClick={() => setViewRange({ start: 2032, end: 2042 })}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-all',
            viewRange.start === 2032 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}
        >
          2032-2042
        </button>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Épargne cumulée</h3>
          <div className="h-[350px]">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Épargne annuelle</h3>
          <div className="h-[350px]">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Selected Year Details */}
      {selectedProjection && (
        <div className="rounded-2xl bg-card p-6 shadow-card animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Détails {selectedProjection.year}
            </h3>
            <button 
              onClick={() => setSelectedYear(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Revenu mensuel</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(selectedProjection.monthlyIncome)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Dépenses mensuelles</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(selectedProjection.monthlyExpenses)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Épargne annuelle</p>
              <p className="text-xl font-bold text-success mt-1">
                {formatCurrency(selectedProjection.yearlySavings)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Cumul total</p>
              <p className="text-xl font-bold text-primary mt-1">
                {formatCurrency(selectedProjection.cumulativeSavings)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progression vers l'objectif</span>
              <span className="font-medium">{Math.round(selectedProjection.goalProgress)}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${selectedProjection.goalProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Year by Year Table */}
      <div className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Tableau prévisionnel détaillé</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Année</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Revenu/mois</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Dépenses/mois</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Épargne/an</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cumul</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Objectif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projections.map((p) => (
                <tr 
                  key={p.year}
                  onClick={() => setSelectedYear(p.year)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    p.year === selectedYear ? 'bg-primary/10' : 'hover:bg-muted/50',
                    p.cumulativeSavings >= settings.savingsGoal && 'bg-success/5'
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{p.year}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{formatCurrency(p.monthlyIncome)}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{formatCurrency(p.monthlyExpenses)}</td>
                  <td className="px-4 py-3 text-sm text-right text-success font-medium">{formatCurrency(p.yearlySavings)}</td>
                  <td className="px-4 py-3 text-sm text-right text-primary font-medium">{formatCurrency(p.cumulativeSavings)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(p.goalProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(p.goalProgress)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Projection;
