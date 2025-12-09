import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { MonthlyStats, YearlyStats } from '@/utils/types';
import { generateMonthlyReport, generateYearlyReport } from '@/utils/pdfGenerator';
import { getMonthName } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

interface ReportGeneratorProps {
  monthlyStats: MonthlyStats | null;
  yearlyStats: YearlyStats | null;
  availableYears: number[];
  onYearChange: (year: number) => void;
  selectedYear: number;
}

export const ReportGenerator = ({
  monthlyStats,
  yearlyStats,
  availableYears,
  onYearChange,
  selectedYear,
}: ReportGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (reportType === 'monthly' && monthlyStats) {
        await generateMonthlyReport(monthlyStats);
      } else if (reportType === 'yearly' && yearlyStats) {
        await generateYearlyReport(yearlyStats);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate =
    (reportType === 'monthly' && monthlyStats) ||
    (reportType === 'yearly' && yearlyStats);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Générer un rapport</h3>
          <p className="text-sm text-muted-foreground">Exportez vos données en PDF</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Type de rapport
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('monthly')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-colors',
                reportType === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={cn(
                'flex-1 py-3 rounded-xl font-medium transition-colors',
                reportType === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Annuel
            </button>
          </div>
        </div>

        {reportType === 'yearly' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'monthly' && monthlyStats && (
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {getMonthName(monthlyStats.monthIndex)} {monthlyStats.year}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
            canGenerate && !generating
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <Download className="h-4 w-4" />
          {generating ? 'Génération...' : 'Télécharger le PDF'}
        </button>
      </div>
    </div>
  );
};
