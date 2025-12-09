import { Wallet } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">
              Finance Dashboard
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Analysez vos dépenses en toute confidentialité
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};
