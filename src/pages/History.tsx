import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  FileDown,
  ChevronDown,
  ChevronUp,
  Tag,
  FileText,
  Upload,
  Pencil
} from 'lucide-react';
import { Transaction, CategoryType, TransactionSource } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/categories';
import { formatCurrencyFull, getAllTags } from '@/utils/computeStats';
import { cn } from '@/lib/utils';

type SortField = 'date' | 'amount' | 'label' | 'category';
type SortDirection = 'asc' | 'desc';

const SOURCE_LABELS: Record<TransactionSource, string> = {
  manual: 'Manuel',
  csv: 'CSV',
  pdf: 'PDF',
};

const SOURCE_ICONS: Record<TransactionSource, React.ReactNode> = {
  manual: <Pencil className="h-3 w-3" />,
  csv: <FileText className="h-3 w-3" />,
  pdf: <Upload className="h-3 w-3" />,
};

const History = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<TransactionSource | 'all'>('all');
  const [showIncomeOnly, setShowIncomeOnly] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const loadData = () => setTransactions(localStore.getTransactions());
    loadData();
    window.addEventListener('transaction-added', loadData);
    return () => window.removeEventListener('transaction-added', loadData);
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const availableTags = useMemo(() => getAllTags(transactions), [transactions]);
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = searchTerm === '' || 
          t.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = selectedYear === 'all' || 
          new Date(t.date).getFullYear() === selectedYear;
        const matchesCategory = selectedCategory === 'all' || 
          t.category === selectedCategory;
        const matchesType = showIncomeOnly === null || 
          t.isIncome === showIncomeOnly;
        const matchesTag = selectedTag === 'all' ||
          (t.tags && t.tags.includes(selectedTag));
        const matchesSource = selectedSource === 'all' ||
          t.source === selectedSource;
        return matchesSearch && matchesYear && matchesCategory && matchesType && matchesTag && matchesSource;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'label':
            comparison = a.label.localeCompare(b.label);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
  }, [transactions, searchTerm, selectedYear, selectedCategory, showIncomeOnly, selectedTag, selectedSource, sortField, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions.filter(t => !t.isIncome).reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Libellé', 'Montant', 'Type', 'Catégorie', 'Tags', 'Source'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('fr-FR'),
      t.label,
      t.isIncome ? t.amount.toString() : (-t.amount).toString(),
      t.isIncome ? 'Revenu' : 'Dépense',
      CATEGORY_LABELS[t.category],
      (t.tags || []).join(', '),
      t.source || 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = filteredTransactions.map(t => ({
      ...t,
      date: new Date(t.date).toISOString(),
      categoryLabel: CATEGORY_LABELS[t.category]
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique</h1>
          <p className="text-muted-foreground">Consultez et exportez vos transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all"
          >
            <FileDown className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.count}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Revenus</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrencyFull(stats.income)}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm">Dépenses</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCurrencyFull(stats.expenses)}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-primary mb-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm">Balance</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            stats.balance >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {formatCurrencyFull(stats.balance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par libellé..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
          >
            <option value="all">Toutes les années</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value as CategoryType | 'all'); setCurrentPage(1); }}
            className="rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{CATEGORY_ICONS[key as CategoryType]} {label}</option>
            ))}
          </select>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => { setSelectedTag(e.target.value); setCurrentPage(1); }}
              className="rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
            >
              <option value="all">Tous les tags</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          )}

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => { setSelectedSource(e.target.value as TransactionSource | 'all'); setCurrentPage(1); }}
            className="rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
          >
            <option value="all">Toutes sources</option>
            <option value="manual">📝 Manuel</option>
            <option value="csv">📄 CSV</option>
            <option value="pdf">📑 PDF</option>
          </select>

          {/* Type Filter */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => { setShowIncomeOnly(null); setCurrentPage(1); }}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-all',
                showIncomeOnly === null ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              )}
            >
              Tout
            </button>
            <button
              onClick={() => { setShowIncomeOnly(true); setCurrentPage(1); }}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-all',
                showIncomeOnly === true ? 'bg-success text-white' : 'bg-background hover:bg-muted'
              )}
            >
              Revenus
            </button>
            <button
              onClick={() => { setShowIncomeOnly(false); setCurrentPage(1); }}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-all',
                showIncomeOnly === false ? 'bg-destructive text-white' : 'bg-background hover:bg-muted'
              )}
            >
              Dépenses
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('label')}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    Libellé
                    {sortField === 'label' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    Catégorie
                    {sortField === 'category' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-2">
                    Montant
                    {sortField === 'amount' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                      {t.source && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          {SOURCE_ICONS[t.source]}
                          {SOURCE_LABELS[t.source]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="max-w-xs">
                      <p className="truncate">{t.label}</p>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">
                              #{tag}
                            </span>
                          ))}
                          {t.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{t.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-medium">
                      <span>{CATEGORY_ICONS[t.category]}</span>
                      {CATEGORY_LABELS[t.category]}
                    </span>
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-sm font-medium text-right',
                    t.isIncome ? 'text-success' : 'text-destructive'
                  )}>
                    {t.isIncome ? '+' : '-'}{formatCurrencyFull(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages} ({filteredTransactions.length} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune transaction trouvée</p>
        </div>
      )}
    </div>
  );
};

export default History;
