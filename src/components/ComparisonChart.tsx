import { Bar } from 'react-chartjs-2';
import { MonthlyStats } from '@/utils/types';
import { formatCurrency, getMonthName } from '@/utils/computeStats';

interface ComparisonChartProps {
  currentStats: MonthlyStats;
  previousStats: MonthlyStats | null;
}

export const ComparisonChart = ({ currentStats, previousStats }: ComparisonChartProps) => {
  const categories = ['Revenus', 'Dépenses', 'Incompressibles', 'Variables', 'Épargne'];
  
  const currentData = [
    currentStats.totalIncome,
    currentStats.totalExpenses,
    currentStats.incompressible,
    currentStats.variable,
    currentStats.savings,
  ];

  const previousData = previousStats
    ? [
        previousStats.totalIncome,
        previousStats.totalExpenses,
        previousStats.incompressible,
        previousStats.variable,
        previousStats.savings,
      ]
    : [0, 0, 0, 0, 0];

  const currentLabel = getMonthName(currentStats.monthIndex);
  const previousLabel = previousStats ? getMonthName(previousStats.monthIndex) : 'N-1';

  const data = {
    labels: categories,
    datasets: [
      {
        label: previousLabel,
        data: previousData,
        backgroundColor: 'hsla(var(--muted-foreground), 0.3)',
        borderRadius: 8,
      },
      {
        label: currentLabel,
        data: currentData,
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--muted-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'hsl(var(--muted-foreground))' },
      },
      y: {
        grid: { color: 'hsla(var(--border), 0.5)' },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          callback: (value: number) => formatCurrency(value),
        },
      },
    },
  };

  const calculateDiff = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Comparaison {previousLabel} vs {currentLabel}
      </h3>

      <div className="h-[300px] mb-6">
        <Bar data={data} options={options} />
      </div>

      {previousStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {categories.map((cat, i) => {
            const diff = calculateDiff(currentData[i], previousData[i]);
            const isPositive = cat === 'Épargne' ? diff && diff > 0 : diff && diff < 0;
            
            return (
              <div key={cat} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{cat}</p>
                {diff !== null ? (
                  <p className={`text-sm font-semibold ${isPositive ? 'text-success' : diff !== 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
