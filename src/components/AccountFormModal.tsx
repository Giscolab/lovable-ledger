import { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { Account, AccountType } from '@/utils/types';
import { cn } from '@/lib/utils';
import { accountFormSchema, VALIDATION_LIMITS } from '@/utils/validation';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Compte courant', icon: '🏦' },
  { value: 'savings', label: 'Livret / Épargne', icon: '🐷' },
  { value: 'investment', label: 'Investissement', icon: '📈' },
  { value: 'cash', label: 'Espèces', icon: '💵' },
  { value: 'custom', label: 'Autre', icon: '📁' },
];

interface AccountFormModalProps {
  account?: Account | null;
  onSave: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const AccountFormModal = ({ account, onSave, onClose }: AccountFormModalProps) => {
  const [form, setForm] = useState({
    name: '',
    type: 'checking' as AccountType,
    iban: '',
    number: '',
    bankName: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name,
        type: account.type,
        iban: account.iban || '',
        number: account.number || '',
        bankName: account.bankName || '',
        notes: account.notes || '',
      });
    }
  }, [account]);

  const validate = () => {
    const result = accountFormSchema.safeParse(form);
    
    if (result.success) {
      setErrors({});
      return true;
    }
    
    const newErrors: { [key: string]: string } = {};
    result.error.issues.forEach(issue => {
      const field = issue.path[0] as string;
      if (!newErrors[field]) {
        newErrors[field] = issue.message;
      }
    });
    
    setErrors(newErrors);
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSave({
      name: form.name.trim(),
      type: form.type,
      iban: form.iban.trim() || undefined,
      number: form.number.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {account ? 'Modifier le compte' : 'Nouveau compte'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nom du compte *
            </label>
          <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, VALIDATION_LIMITS.NAME_MAX) })}
              placeholder="Ex: Compte principal"
              maxLength={VALIDATION_LIMITS.NAME_MAX}
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.name ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
              )}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                    form.type === type.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                  )}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Banque (optionnel)
            </label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value.slice(0, VALIDATION_LIMITS.BANK_NAME_MAX) })}
              placeholder="Ex: Caisse d'Épargne"
              maxLength={VALIDATION_LIMITS.BANK_NAME_MAX}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              IBAN (optionnel)
            </label>
            <input
              type="text"
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase().slice(0, 34) })}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              maxLength={34}
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-3 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.iban ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
              )}
            />
            {errors.iban && (
              <p className="text-xs text-destructive mt-1">{errors.iban}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Numéro de compte (optionnel)
            </label>
            <input
              type="text"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value.slice(0, VALIDATION_LIMITS.ACCOUNT_NUMBER_MAX) })}
              placeholder="XXXXXXXXXX"
              maxLength={VALIDATION_LIMITS.ACCOUNT_NUMBER_MAX}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, VALIDATION_LIMITS.NOTES_MAX) })}
              rows={2}
              maxLength={VALIDATION_LIMITS.NOTES_MAX}
              placeholder="Informations supplémentaires..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {account ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
