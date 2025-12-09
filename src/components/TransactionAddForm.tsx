import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Transaction, CategoryType } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { cn } from '@/lib/utils';

interface TransactionAddFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionAddForm = ({ onAdd, onClose }: TransactionAddFormProps) => {
  const [form, setForm] = useState({
    label: '',
    amount: '',
    category: 'other' as CategoryType,
    date: new Date().toISOString().split('T')[0],
    isIncome: false,
    notes: '',
  });

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.label || isNaN(amount) || amount <= 0) return;

    onAdd({
      label: form.label,
      amount,
      category: form.category,
      date: new Date(form.date),
      isIncome: form.isIncome,
      notes: form.notes || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
      tags: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Ajouter une transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Libellé
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex: Courses Carrefour"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Catégorie
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as CategoryType })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, isIncome: false })}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-colors',
                  !form.isIncome
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                Dépense
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isIncome: true })}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-colors',
                  form.isIncome
                    ? 'bg-success text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                Revenu
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Détails supplémentaires..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter la transaction
          </button>
        </form>
      </div>
    </div>
  );
};
