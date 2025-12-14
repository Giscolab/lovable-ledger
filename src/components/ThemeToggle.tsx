import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { localStore } from '@/utils/localStore';

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const currentTheme = (theme === 'system' ? resolvedTheme : theme) === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const savedTheme = localStore.getTheme();
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, [setTheme, theme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStore.setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:scale-105 hover:shadow-card active:scale-95"
      aria-label={currentTheme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {currentTheme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};
