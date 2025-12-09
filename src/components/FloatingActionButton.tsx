import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TransactionAddForm } from './TransactionAddForm';
import { Transaction } from '@/utils/types';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export const FloatingActionButton = ({ onAdd }: FloatingActionButtonProps) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setShowForm(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-4 focus:ring-primary/30',
          showForm && 'rotate-45 bg-destructive hover:bg-destructive/90'
        )}
        aria-label={showForm ? 'Fermer' : 'Ajouter une transaction'}
      >
        {showForm ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionAddForm
          onAdd={(tx) => {
            onAdd(tx);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
};
