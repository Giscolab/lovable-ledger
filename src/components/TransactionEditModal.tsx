import { useState } from 'react';
import { X, Save, Trash2, Plus, Tag } from 'lucide-react';
import { Transaction, CategoryType } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { cn } from '@/lib/utils';

interface TransactionEditModalProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TransactionEditModal = ({
  transaction,
  onSave,
  onDelete,
  onClose,
}: TransactionEditModalProps) => {
  const [form, setForm] = useState({
    label: transaction.label,
    amount: Math.abs(transaction.amount),
    category: transaction.category,
    date: new Date(transaction.date).toISOString().split('T')[0],
    isIncome: transaction.isIncome,
    notes: transaction.notes || '',
    tags: transaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...transaction,
      label: form.label,
      amount: form.amount,
      category: form.category,
      date: new Date(form.date),
      isIncome: form.isIncome,
      notes: form.notes,
      tags: form.tags,
    });
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tagToRemove) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Modifier la transaction</h2>
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <Tag className="h-3 w-3 inline mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Ajouter un tag..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Source Info */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            Source: {transaction.source || 'N/A'} • Créé le: {new Date(transaction.createdAt || Date.now()).toLocaleDateString('fr-FR')}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onDelete(transaction.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
