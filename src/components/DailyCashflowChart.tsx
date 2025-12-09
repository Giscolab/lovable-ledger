import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Transaction, DailyCashflow } from '@/utils/types';
import { computeDailyCashflow, formatCurrency, getMonthName } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface DailyCashflowChartProps {
  transactions: Transaction[];
  month: number;
  year: number;
  initialBalance?: number;
}

export const DailyCashflowChart = ({
  transactions,
  month,
  year,
  initialBalance = 0,
}: DailyCashflowChartProps) => {
  const [showExpensesOnly, setShowExpensesOnly] = useState(false);

  const dailyData = useMemo(
    () => computeDailyCashflow(transactions, month, year, initialBalance),
    [transactions, month, year, initialBalance]
  );

  const chartData = useMemo(() => {
    const labels = dailyData.map(d => d.day.toString());
    
    if (showExpensesOnly) {
      // Cumulative expenses
      let cumExpenses = 0;
      const expensesData = dailyData.map(d => {
        cumExpenses += d.expenses;
        return cumExpenses;
      });
      
      return {
        labels,
        datasets: [
          {
            label: 'Dépenses cumulées',
            data: expensesData,
            borderColor: 'hsl(0, 70%, 50%)',
            backgroundColor: 'hsla(0, 70%, 50%, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 6,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Solde',
          data: dailyData.map(d => d.balance),
          borderColor: 'hsl(var(--primary))',
          backgroundColor: 'hsla(var(--primary), 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [dailyData, showExpensesOnly]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'hsl(0, 0%, 8%)',
        titleColor: 'hsl(0, 0%, 95%)',
        bodyColor: 'hsl(0, 0%, 95%)',
        borderColor: 'hsl(0, 0%, 18%)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (ctx: any) => {
            const dayIndex = ctx[0].dataIndex;
            const data = dailyData[dayIndex];
            return `${data.day} ${getMonthName(month)} ${year}`;
          },
          label: (ctx: any) => {
            const dayIndex = ctx.dataIndex;
            const data = dailyData[dayIndex];
            if (showExpensesOnly) {
              return ` Dépenses: ${formatCurrency(ctx.raw)}`;
            }
            return [
              ` Revenus: ${formatCurrency(data.income)}`,
              ` Dépenses: ${formatCurrency(data.expenses)}`,
              ` Solde: ${formatCurrency(data.balance)}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        grid: { color: 'hsla(var(--border), 0.3)' },
        ticks: { 
          callback: (v: any) => formatCurrency(v),
          font: { size: 10 },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          maxTicksLimit: 15,
        },
      },
    },
  };

  // Calculate summary stats
  const totalIncome = dailyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = dailyData.reduce((sum, d) => sum + d.expenses, 0);
  const finalBalance = dailyData[dailyData.length - 1]?.balance || 0;

  return (
    <div className="rounded-2xl glass p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Cashflow journalier
            </h3>
            <p className="text-xs text-muted-foreground">
              {getMonthName(month)} {year}
            </p>
          </div>
        </div>

        <div className="flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowExpensesOnly(false)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-all',
              !showExpensesOnly
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted text-muted-foreground'
            )}
          >
            Cashflow
          </button>
          <button
            onClick={() => setShowExpensesOnly(true)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-all',
              showExpensesOnly
                ? 'bg-destructive text-white'
                : 'bg-background hover:bg-muted text-muted-foreground'
            )}
          >
            Dépenses
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-success/10">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-xs text-muted-foreground">Revenus</span>
          </div>
          <p className="text-sm font-bold text-success">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3 text-destructive" />
            <span className="text-xs text-muted-foreground">Dépenses</span>
          </div>
          <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">Solde fin</span>
          </div>
          <p className={cn(
            'text-sm font-bold',
            finalBalance >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {formatCurrency(finalBalance)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        <Line data={chartData} options={chartOptions as any} />
      </div>
    </div>
  );
};
