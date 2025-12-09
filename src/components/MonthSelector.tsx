import { ChevronDown } from 'lucide-react';

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

interface MonthSelectorProps {
  months: MonthOption[];
  selected: MonthOption | null;
  onSelect: (month: MonthOption) => void;
}

export const MonthSelector = ({ months, selected, onSelect }: MonthSelectorProps) => {
  if (months.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <select
        value={selected ? `${selected.year}-${selected.month}` : ''}
        onChange={(e) => {
          const [year, month] = e.target.value.split('-').map(Number);
          const found = months.find(m => m.year === year && m.month === month);
          if (found) onSelect(found);
        }}
        className="appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm font-medium text-foreground shadow-card transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {months.map((m) => (
          <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
};
