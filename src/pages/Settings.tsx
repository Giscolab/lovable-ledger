import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Database, Trash2, Download, Upload, AlertTriangle, Wallet } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BackupRestore } from '@/components/BackupRestore';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { localStore } from '@/utils/localStore';
import { formatCurrency } from '@/utils/computeStats';
import { toast } from 'sonner';

const Settings = () => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [initialBalance, setInitialBalance] = useState(0);

  useEffect(() => {
    setInitialBalance(localStore.getInitialBalance());
  }, []);

  const handleInitialBalanceChange = (value: number) => {
    setInitialBalance(value);
    localStore.setInitialBalance(value);
    toast.success('Solde initial mis à jour');
  };

  const handleResetAllData = () => {
    localStore.clearAll();
    toast.success('Toutes les données ont été effacées');
    setShowResetConfirm(false);
    window.location.reload();
  };

  const stats = {
    transactions: localStore.getTransactions().length,
    rules: localStore.getRules().length,
    budgets: localStore.getBudgets().length,
    goals: localStore.getGoals().length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">Gérez vos préférences et vos données</p>
      </div>

      {/* Theme Section */}
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Apparence
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Thème</p>
            <p className="text-sm text-muted-foreground">Basculer entre mode clair et sombre</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* Initial Balance Section */}
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Solde initial
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">Solde de départ pour le cashflow</p>
            <p className="text-sm text-muted-foreground">
              Ce montant sera utilisé comme point de départ dans les graphiques de cashflow journalier
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              onBlur={() => handleInitialBalanceChange(initialBalance)}
              className="w-32 rounded-xl border border-border bg-background px-4 py-2 text-right font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              step="100"
            />
            <span className="text-muted-foreground">€</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Actuel: {formatCurrency(initialBalance)}
        </p>
      </section>

      {/* Data Stats Section */}
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Données stockées
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.transactions}</p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.rules}</p>
            <p className="text-sm text-muted-foreground">Règles</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.budgets}</p>
            <p className="text-sm text-muted-foreground">Budgets</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.goals}</p>
            <p className="text-sm text-muted-foreground">Objectifs</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Toutes les données sont stockées localement sur votre appareil (localStorage)
        </p>
      </section>

      {/* Backup/Restore Section */}
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Sauvegarde & Restauration
        </h2>
        <BackupRestore />
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6">
        <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zone de danger
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">Réinitialiser toutes les données</p>
            <p className="text-sm text-muted-foreground">
              Supprime définitivement toutes vos transactions, règles, budgets et objectifs
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" />
            Tout effacer
          </button>
        </div>
      </section>

      {/* App Info */}
      <section className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">À propos</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Finance Pro</span> - Application de gestion financière personnelle</p>
          <p>Version 5.0 • 100% locale • Aucune donnée transmise</p>
          <p className="text-xs">
            Vos données financières restent sur votre appareil et ne sont jamais envoyées sur internet.
          </p>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ConfirmDeleteModal
          title="Réinitialiser toutes les données ?"
          message="Cette action supprimera définitivement toutes vos transactions, règles de catégorisation, budgets et objectifs. Cette action est irréversible."
          onConfirm={handleResetAllData}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};

export default Settings;
