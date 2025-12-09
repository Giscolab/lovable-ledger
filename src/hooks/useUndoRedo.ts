import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { toast } from '@/hooks/use-toast';

interface HistoryEntry {
  transactions: Transaction[];
  timestamp: number;
  action: string;
}

const MAX_HISTORY = 20;

export const useUndoRedo = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRestoring, setIsRestoring] = useState(false);

  // Initialize with current state
  useEffect(() => {
    const transactions = localStore.getTransactions();
    if (history.length === 0) {
      setHistory([{ transactions, timestamp: Date.now(), action: 'Initial' }]);
      setCurrentIndex(0);
    }
  }, []);

  // Listen for shortcut events
  useEffect(() => {
    const handleUndo = () => undo();
    const handleRedo = () => redo();

    window.addEventListener('shortcut-undo', handleUndo);
    window.addEventListener('shortcut-redo', handleRedo);

    return () => {
      window.removeEventListener('shortcut-undo', handleUndo);
      window.removeEventListener('shortcut-redo', handleRedo);
    };
  }, [currentIndex, history]);

  const saveState = useCallback((action: string) => {
    if (isRestoring) return;

    const transactions = localStore.getTransactions();
    
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({
        transactions: JSON.parse(JSON.stringify(transactions)),
        timestamp: Date.now(),
        action,
      });
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [currentIndex, isRestoring]);

  const undo = useCallback(() => {
    if (currentIndex <= 0) {
      toast({ title: 'Impossible d\'annuler', description: 'Aucune action précédente' });
      return;
    }

    setIsRestoring(true);
    const previousState = history[currentIndex - 1];
    
    if (previousState) {
      localStore.setTransactions(previousState.transactions);
      setCurrentIndex(prev => prev - 1);
      window.dispatchEvent(new CustomEvent('transaction-added')); // Trigger refresh
      toast({ title: 'Action annulée', description: `Retour à: ${previousState.action}` });
    }
    
    setTimeout(() => setIsRestoring(false), 100);
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) {
      toast({ title: 'Impossible de rétablir', description: 'Aucune action suivante' });
      return;
    }

    setIsRestoring(true);
    const nextState = history[currentIndex + 1];
    
    if (nextState) {
      localStore.setTransactions(nextState.transactions);
      setCurrentIndex(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('transaction-added')); // Trigger refresh
      toast({ title: 'Action rétablie', description: nextState.action });
    }
    
    setTimeout(() => setIsRestoring(false), 100);
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
};
