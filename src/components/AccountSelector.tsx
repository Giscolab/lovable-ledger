import { useState, useEffect } from 'react';
import { ChevronDown, CreditCard, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Account } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Courant',
  savings: 'Épargne',
  cash: 'Espèces',
  investment: 'Investissement',
  custom: 'Autre',
};

const ACCOUNT_TYPE_ORDER: Record<string, number> = {
  checking: 1,
  savings: 2,
  investment: 3,
  cash: 4,
  custom: 5,
};

interface AccountSelectorProps {
  compact?: boolean;
  onChange?: (accountId: string) => void;
}

export const AccountSelector = ({ compact = false, onChange }: AccountSelectorProps) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadAccounts = () => {
      const id = localStore.ensureAccountsInitialized();
      setAccounts(localStore.getAccounts());
      setSelectedId(id);
    };
    
    loadAccounts();
    
    // Listen for account changes
    const handleAccountChange = () => loadAccounts();
    window.addEventListener('accounts-updated', handleAccountChange);
    return () => window.removeEventListener('accounts-updated', handleAccountChange);
  }, []);

  const sortedAccounts = [...accounts].sort((a, b) => 
    (ACCOUNT_TYPE_ORDER[a.type] || 5) - (ACCOUNT_TYPE_ORDER[b.type] || 5)
  );

  const selectedAccount = accounts.find(a => a.id === selectedId);

  const handleSelect = (accountId: string) => {
    setSelectedId(accountId);
    localStore.setSelectedAccountId(accountId);
    setIsOpen(false);
    onChange?.(accountId);
    window.dispatchEvent(new CustomEvent('account-changed'));
  };

  if (accounts.length === 0) {
    return (
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
      >
        <Plus className="h-4 w-4" />
        Créer un compte
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-card transition-all hover:bg-muted/50',
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-3'
        )}
      >
        <CreditCard className={cn('text-primary', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        <div className="text-left">
          <p className={cn('font-medium text-foreground', compact && 'text-sm')}>
            {selectedAccount?.name || 'Sélectionner'}
          </p>
          {!compact && selectedAccount && (
            <p className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[selectedAccount.type]}
              {selectedAccount.bankName && ` • ${selectedAccount.bankName}`}
            </p>
          )}
        </div>
        <ChevronDown className={cn(
          'text-muted-foreground transition-transform',
          compact ? 'h-4 w-4' : 'h-5 w-5',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden min-w-[240px]">
            <div className="max-h-[300px] overflow-y-auto">
              {sortedAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelect(account.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    account.id === selectedId && 'bg-primary/10'
                  )}
                >
                  <CreditCard className={cn(
                    'h-4 w-4',
                    account.id === selectedId ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      account.id === selectedId ? 'text-primary' : 'text-foreground'
                    )}>
                      {account.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                      {account.bankName && ` • ${account.bankName}`}
                    </p>
                  </div>
                  {account.id === selectedId && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-border">
              <button
                onClick={() => { setIsOpen(false); navigate('/accounts'); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Gérer les comptes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
