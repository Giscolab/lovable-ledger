import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Tags, 
  History, 
  Upload,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { path: '/', label: 'Import', icon: Upload },
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/projection', label: 'Prévisionnel', icon: TrendingUp },
  { path: '/categories', label: 'Catégories', icon: Tags },
  { path: '/history', label: 'Historique', icon: History },
];

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Desktop Navigation - Mercury Style */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col glass-strong p-6 z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center glow">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <h1 className="font-bold text-foreground tracking-tight">Finance Pro</h1>
            <p className="text-xs text-muted-foreground">Gestion financière</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="pt-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Thème</span>
            <ThemeToggle />
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            100% local • Données privées
          </p>
        </div>
      </nav>

      {/* Mobile Header - Mercury Style */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-strong flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
          <h1 className="font-bold text-foreground tracking-tight">Finance Pro</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background z-30 p-4 animate-fade-in">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-4 text-base font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Mercury Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass-strong flex items-center justify-around z-40">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
