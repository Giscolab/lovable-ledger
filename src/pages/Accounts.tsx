import { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Pencil, 
  Trash2, 
  Building2,
  Calendar,
  Hash
} from 'lucide-react';
import { Account, AccountType, Transaction } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { AccountFormModal } from '@/components/AccountFormModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { formatCurrency } from '@/utils/computeStats';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Compte courant',
  savings: 'Livret / Épargne',
  cash: 'Espèces',
  investment: 'Investissement',
  custom: 'Autre',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  checking: '🏦',
  savings: '🐷',
  cash: '💵',
  investment: '📈',
  custom: '📁',
};

const ACCOUNT_TYPE_ORDER: Record<AccountType, number> = {
  checking: 1,
  savings: 2,
  investment: 3,
  cash: 4,
  custom: 5,
};

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Account | null>(null);

  useEffect(() => {
    const id = localStore.ensureAccountsInitialized();
    setAccounts(localStore.getAccounts());
    setTransactions(localStore.getTransactions());
    setSelectedId(id);
  }, []);

  const sortedAccounts = useMemo(() => 
    [...accounts].sort((a, b) => 
      (ACCOUNT_TYPE_ORDER[a.type] || 5) - (ACCOUNT_TYPE_ORDER[b.type] || 5)
    ),
    [accounts]
  );

  const getAccountStats = (accountId: string) => {
    const accountTx = transactions.filter(t => t.accountId === accountId);
    const income = accountTx.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0);
    const expenses = accountTx.filter(t => !t.isIncome).reduce((s, t) => s + t.amount, 0);
    return {
      count: accountTx.length,
      balance: income - expenses,
    };
  };

  const handleSave = (data: Omit<Account, 'id' | 'createdAt'>) => {
    if (editingAccount) {
      localStore.updateAccount(editingAccount.id, data);
      toast.success('Compte modifié');
    } else {
      localStore.addAccount(data);
      toast.success('Compte créé');
    }
    setAccounts(localStore.getAccounts());
    setShowForm(false);
    setEditingAccount(null);
    window.dispatchEvent(new CustomEvent('accounts-updated'));
  };

  const handleDelete = (account: Account) => {
    localStore.deleteAccount(account.id);
    setAccounts(localStore.getAccounts());
    setTransactions(localStore.getTransactions());
    setDeleteConfirm(null);
    toast.success('Compte supprimé');
    window.dispatchEvent(new CustomEvent('accounts-updated'));
  };

  const handleSelect = (accountId: string) => {
    setSelectedId(accountId);
    localStore.setSelectedAccountId(accountId);
    toast.success('Compte sélectionné');
    window.dispatchEvent(new CustomEvent('account-changed'));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Comptes
          </h1>
          <p className="text-muted-foreground">Gérez vos comptes bancaires et portefeuilles</p>
        </div>
        <button
          onClick={() => { setEditingAccount(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Ajouter un compte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total comptes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
        </div>
        <div className="rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-success/10 p-2">
              <Hash className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="rounded-2xl glass p-5 shadow-card col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-warning/10 p-2">
              <Building2 className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Balance totale</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            accounts.reduce((sum, a) => sum + getAccountStats(a.id).balance, 0) >= 0
              ? 'text-success'
              : 'text-destructive'
          )}>
            {formatCurrency(accounts.reduce((sum, a) => sum + getAccountStats(a.id).balance, 0))}
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="grid gap-4">
        {sortedAccounts.map((account) => {
          const stats = getAccountStats(account.id);
          const isSelected = account.id === selectedId;
          
          return (
            <div
              key={account.id}
              className={cn(
                'rounded-2xl bg-card p-5 shadow-card transition-all',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Account Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    {ACCOUNT_TYPE_ICONS[account.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {account.name}
                      </h3>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                      {account.bankName && ` • ${account.bankName}`}
                    </p>
                    {account.iban && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {account.iban.replace(/(.{4})/g, '$1 ').trim()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="font-semibold text-foreground">{stats.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={cn(
                      'font-semibold',
                      stats.balance >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {formatCurrency(stats.balance)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <button
                      onClick={() => handleSelect(account.id)}
                      className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      Sélectionner
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingAccount(account); setShowForm(true); }}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(account)}
                    className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    title="Supprimer"
                    disabled={accounts.length === 1}
                  >
                    <Trash2 className={cn(
                      'h-4 w-4',
                      accounts.length === 1 ? 'text-muted-foreground' : 'text-destructive'
                    )} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Créé le {formatDate(account.createdAt)}
                </div>
                {account.number && (
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {account.number}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Aucun compte
          </h2>
          <p className="text-muted-foreground max-w-md mb-4">
            Créez votre premier compte pour commencer à gérer vos finances.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un compte
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AccountFormModal
          account={editingAccount}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingAccount(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDeleteModal
          title={`Supprimer "${deleteConfirm.name}" ?`}
          message={`Cette action supprimera le compte et toutes ses transactions (${getAccountStats(deleteConfirm.id).count} transactions). Cette action est irréversible.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default Accounts;
