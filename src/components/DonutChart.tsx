import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { CategoryType, MonthlyStats } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { formatCurrency } from '@/utils/computeStats';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  stats: MonthlyStats;
}

const categoryColors: Record<CategoryType, string> = {
  rent: 'hsl(220, 70%, 50%)',
  utilities: 'hsl(280, 60%, 55%)',
  insurance: 'hsl(200, 70%, 50%)',
  internet: 'hsl(170, 70%, 45%)',
  transport: 'hsl(340, 70%, 55%)',
  investments: 'hsl(142, 70%, 45%)',
  groceries: 'hsl(25, 80%, 50%)',
  food: 'hsl(15, 90%, 55%)',
  shopping: 'hsl(300, 60%, 55%)',
  smoking: 'hsl(0, 50%, 45%)',
  entertainment: 'hsl(260, 70%, 60%)',
  health: 'hsl(180, 60%, 45%)',
  other: 'hsl(220, 15%, 50%)',
};

export const DonutChart = ({ stats }: DonutChartProps) => {
  const categories = Object.entries(stats.byCategory)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const data = {
    labels: categories.map(([cat]) => CATEGORY_LABELS[cat as CategoryType]),
    datasets: [
      {
        data: categories.map(([_, value]) => value),
        backgroundColor: categories.map(([cat]) => categoryColors[cat as CategoryType]),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 11%)',
        titleColor: 'hsl(210, 40%, 98%)',
        bodyColor: 'hsl(210, 40%, 98%)',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = stats.totalExpenses;
            const percent = total > 0 ? Math.round((value / total) * 100) : 0;
            return ` ${formatCurrency(value)} (${percent}%)`;
          },
        },
      },
    },
  };

  if (categories.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Aucune dépense à afficher
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-[280px]">
        <Doughnut data={data} options={options} />
      </div>
      
      {/* Center text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-sm text-muted-foreground">Total dépenses</p>
        <p className="text-2xl font-bold text-foreground">
          {formatCurrency(stats.totalExpenses)}
        </p>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {categories.slice(0, 6).map(([cat, value]) => (
          <div key={cat} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: categoryColors[cat as CategoryType] }}
            />
            <span className="truncate text-muted-foreground">
              {CATEGORY_LABELS[cat as CategoryType]}
            </span>
            <span className="ml-auto font-medium text-foreground">
              {formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
