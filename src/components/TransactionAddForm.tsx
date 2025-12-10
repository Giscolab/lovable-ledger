import { useState, useEffect } from 'react';
import { Plus, X, Sparkles, CreditCard } from 'lucide-react';
import { Transaction, CategoryType, Account } from '@/utils/types';
import { CATEGORY_LABELS } from '@/utils/categories';
import { categorizeTransaction } from '@/utils/categorize';
import { localStore } from '@/utils/localStore';
import { cn } from '@/lib/utils';
import { transactionFormSchema, VALIDATION_LIMITS } from '@/utils/validation';

interface TransactionAddFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  defaultAccountId?: string;
}

export const TransactionAddForm = ({ onAdd, onClose, defaultAccountId }: TransactionAddFormProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    label: '',
    amount: '',
    category: 'other' as CategoryType,
    date: new Date().toISOString().split('T')[0],
    isIncome: false,
    notes: '',
    accountId: defaultAccountId || '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [autoCategory, setAutoCategory] = useState<CategoryType | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];
  const rules = localStore.getRules();

  useEffect(() => {
    const accts = localStore.getAccounts();
    setAccounts(accts);
    if (!form.accountId && accts.length > 0) {
      const selectedId = localStore.getSelectedAccountId() || accts[0].id;
      setForm(prev => ({ ...prev, accountId: selectedId }));
    }
  }, []);

  // Auto-categorization when label changes
  useEffect(() => {
    if (form.label.length >= 3) {
      const suggested = categorizeTransaction(form.label, rules);
      if (suggested !== 'other') {
        setAutoCategory(suggested);
        // Auto-apply if category is still 'other'
        if (form.category === 'other') {
          setForm(prev => ({ ...prev, category: suggested }));
        }
      } else {
        setAutoCategory(null);
      }
    } else {
      setAutoCategory(null);
    }
  }, [form.label]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    
    // Validate with Zod schema
    const result = transactionFormSchema.safeParse({
      label: form.label,
      amount: isNaN(amount) ? 0 : amount,
      category: form.category,
      date: form.date,
      isIncome: form.isIncome,
      notes: form.notes,
      accountId: form.accountId,
      tags,
    });
    
    if (!result.success) {
      const newErrors: { [key: string]: string } = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as string;
        if (!newErrors[field]) {
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    onAdd({
      accountId: form.accountId,
      label: form.label.trim(),
      amount,
      category: form.category,
      date: new Date(form.date),
      isIncome: form.isIncome,
      notes: form.notes.trim() || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
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
              onChange={(e) => setForm({ ...form, label: e.target.value.slice(0, VALIDATION_LIMITS.LABEL_MAX) })}
              placeholder="Ex: Courses Carrefour"
              maxLength={VALIDATION_LIMITS.LABEL_MAX}
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.label ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
              )}
              required
            />
            {errors.label && (
              <p className="text-xs text-destructive mt-1">{errors.label}</p>
            )}
            {autoCategory && autoCategory !== 'other' && !errors.label && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary">
                <Sparkles className="h-3 w-3" />
                <span>Catégorie suggérée : {CATEGORY_LABELS[autoCategory]}</span>
              </div>
            )}
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
                max={VALIDATION_LIMITS.AMOUNT_MAX}
                className={cn(
                  'w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                  errors.amount ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                )}
                required
              />
              {errors.amount && (
                <p className="text-xs text-destructive mt-1">{errors.amount}</p>
              )}
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

          {/* Account Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <CreditCard className="inline h-4 w-4 mr-1" />
              Compte
            </label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} {acc.bankName ? `(${acc.bankName})` : ''}
                </option>
              ))}
            </select>
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
              Tags (optionnel)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Ajouter un tag..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
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
              onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, VALIDATION_LIMITS.NOTES_MAX) })}
              rows={2}
              maxLength={VALIDATION_LIMITS.NOTES_MAX}
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
