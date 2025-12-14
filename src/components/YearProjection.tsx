import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Target, Settings, TrendingUp } from 'lucide-react';
import { MonthlyStats, ProjectionSettings } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { formatCurrency } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface YearProjectionProps {
  stats: MonthlyStats;
}

export const YearProjection = ({ stats }: YearProjectionProps) => {
  const [settings, setSettings] = useState<ProjectionSettings>(localStore.getProjectionSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStore.setProjectionSettings(settings);
  }, [settings]);

  const monthlySavings = settings.monthlyIncome - stats.incompressible - settings.variableBudget;
  const yearlySavings = monthlySavings * 12;
  const normalizedGoal = Number.isFinite(settings.savingsGoal) ? settings.savingsGoal : 0;
  const hasSavingsGoal = normalizedGoal > 0;
  const rawProgress = hasSavingsGoal ? (yearlySavings / normalizedGoal) * 100 : 0;
  const progressPercent = Number.isFinite(rawProgress)
    ? Math.min(Math.max(rawProgress, 0), 100)
    : 0;

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const cumulativeSavings = months.map((_, i) => monthlySavings * (i + 1));

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Épargne cumulée',
        data: cumulativeSavings,
        backgroundColor: 'hsl(25, 80%, 50%)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Objectif',
        data: months.map(() => settings.savingsGoal),
        backgroundColor: 'hsl(142, 70%, 45%)',
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 11%)',
        titleColor: 'hsl(210, 40%, 98%)',
        bodyColor: 'hsl(210, 40%, 98%)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => ` ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: { color: 'hsl(var(--border))' },
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

  const budgetOptions = [200, 300, 400, 500];

  return (
    <div className="space-y-6">
      {/* Header with settings toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-success/10 p-2.5">
            <Target className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Projection 2026</h3>
            <p className="text-sm text-muted-foreground">Simulation annuelle</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
            showSettings ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="rounded-2xl bg-muted/50 p-5 space-y-4 animate-scale-in">
          <div>
            <label className="text-sm font-medium text-foreground">Revenu mensuel</label>
            <input
              type="number"
              value={settings.monthlyIncome}
              onChange={(e) => setSettings({ ...settings, monthlyIncome: Number(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Budget variable max</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {budgetOptions.map((budget) => (
                <button
                  key={budget}
                  onClick={() => setSettings({ ...settings, variableBudget: budget })}
                  className={cn(
                    'rounded-xl py-3 text-sm font-medium transition-all',
                    settings.variableBudget === budget
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-foreground hover:border-primary'
                  )}
                >
                  {formatCurrency(budget)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Objectif d'épargne</label>
            <input
              type="number"
              value={settings.savingsGoal}
              onChange={(e) => setSettings({ ...settings, savingsGoal: Number(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card p-4 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Épargne mensuelle</p>
          <p className={cn('mt-1 text-xl font-bold', monthlySavings >= 0 ? 'text-success' : 'text-destructive')}>
            {formatCurrency(monthlySavings)}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Projection annuelle</p>
          <p className={cn('mt-1 text-xl font-bold', yearlySavings >= 0 ? 'text-success' : 'text-destructive')}>
            {formatCurrency(yearlySavings)}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Objectif</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatCurrency(settings.savingsGoal)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Progression vers l'objectif</span>
          </div>
          <span
            className={cn(
              'text-sm font-bold',
              progressPercent >= 100 ? 'text-success' : 'text-primary'
            )}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              progressPercent >= 100 ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {!hasSavingsGoal
            ? "Définissez un objectif d'épargne pour suivre votre progression"
            : yearlySavings >= normalizedGoal
                ? '🎉 Objectif atteint !'
                : `${formatCurrency(normalizedGoal - yearlySavings)} restant pour atteindre l'objectif`}
        </p>
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="h-[300px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};
