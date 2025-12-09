import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { localStore } from "@/utils/localStore";
import { categorizeTransaction } from "@/utils/categorize";
import { generateManualTransactionId } from "@/utils/transactionId";
import { Transaction } from "@/utils/types";
import { toast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Projection from "./pages/Projection";
import Categories from "./pages/Categories";
import History from "./pages/History";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Recurring from "./pages/Recurring";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const theme = localStore.getTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Initialize accounts on app start
    localStore.ensureAccountsInitialized();
  }, []);

  const handleFabAdd = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const rules = localStore.getRules();
    const selectedAccountId = localStore.getSelectedAccountId() || localStore.getAccounts()[0]?.id || '';
    
    const newTransaction: Transaction = {
      ...transaction,
      id: generateManualTransactionId(transaction.date, transaction.label, transaction.amount),
      accountId: transaction.accountId || selectedAccountId,
      category: transaction.category || categorizeTransaction(transaction.label, rules),
      source: transaction.source || 'manual',
      createdAt: transaction.createdAt || new Date().toISOString(),
      tags: transaction.tags || [],
    };
    
    const existing = localStore.getTransactions();
    localStore.setTransactions([...existing, newTransaction]);
    
    toast({ title: 'Transaction ajoutée' });
    
    // Trigger a reload of the current page's data
    window.dispatchEvent(new CustomEvent('transaction-added'));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <KeyboardShortcutsHelp />
      <Navigation />
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projection" element={<Projection />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/history" element={<History />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <FloatingActionButton onAdd={handleFabAdd} />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
