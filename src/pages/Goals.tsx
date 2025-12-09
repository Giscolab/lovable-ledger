import { useState, useEffect } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { FinancialGoal, GOAL_CATEGORIES, generateGoalId } from '@/utils/goals';
import { GoalCard } from '@/components/GoalCard';
import { localStore } from '@/utils/localStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Goals = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings' as FinancialGoal['category'],
  });

  useEffect(() => {
    setGoals(localStore.getGoals());
  }, []);

  const saveGoals = (newGoals: FinancialGoal[]) => {
    localStore.setGoals(newGoals);
    setGoals(newGoals);
  };

  const resetForm = () => {
    setForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      category: 'savings',
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(form.targetAmount);
    const currentAmount = parseFloat(form.currentAmount) || 0;

    if (!form.name || isNaN(targetAmount) || !form.targetDate) return;

    if (editingGoal) {
      const updated = goals.map(g =>
        g.id === editingGoal.id
          ? {
              ...g,
              name: form.name,
              targetAmount,
              currentAmount,
              targetDate: form.targetDate,
              category: form.category,
            }
          : g
      );
      saveGoals(updated);
      toast({ title: 'Objectif modifié' });
    } else {
      const newGoal: FinancialGoal = {
        id: generateGoalId(),
        name: form.name,
        targetAmount,
        currentAmount,
        targetDate: form.targetDate,
        category: form.category,
        color: GOAL_CATEGORIES[form.category].color,
        createdAt: new Date().toISOString(),
      };
      saveGoals([...goals, newGoal]);
      toast({ title: 'Objectif créé' });
    }

    resetForm();
  };

  const handleEdit = (goal: FinancialGoal) => {
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
    toast({ title: 'Objectif supprimé' });
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    const updated = goals.map(g =>
      g.id === id ? { ...g, currentAmount: amount } : g
    );
    saveGoals(updated);
    toast({ title: 'Montant mis à jour' });
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Objectifs</h1>
          <p className="text-muted-foreground mt-1">
            Suivez vos objectifs d'épargne et d'investissement
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel objectif
        </button>
      </div>

      {/* Overall progress */}
      {goals.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Progression globale</h2>
              <p className="text-sm text-muted-foreground">
                {goals.length} objectif{goals.length > 1 ? 's' : ''} en cours
              </p>
            </div>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {overallProgress.toFixed(1)}% atteint
          </p>
        </div>
      )}

      {/* Goals grid */}
      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateAmount={handleUpdateAmount}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Aucun objectif</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Créez votre premier objectif financier pour commencer à suivre votre progression.
          </p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nom de l'objectif
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Voyage au Japon"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as FinancialGoal['category'] })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  {Object.entries(GOAL_CATEGORIES).map(([key, { label, icon }]) => (
                    <option key={key} value={key}>
                      {icon} {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Objectif (€)
                  </label>
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    placeholder="10000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Montant actuel (€)
                  </label>
                  <input
                    type="number"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date cible
                </label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {editingGoal ? 'Enregistrer' : 'Créer l\'objectif'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
