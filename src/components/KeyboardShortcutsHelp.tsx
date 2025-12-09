import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS_LIST } from '@/hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleHelp = () => setIsOpen(true);
    window.addEventListener('shortcut-help', handleHelp);
    return () => window.removeEventListener('shortcut-help', handleHelp);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-lg glass rounded-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Raccourcis clavier</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {SHORTCUTS_LIST.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground border border-border">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Appuyez sur <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Shift + ?</kbd> pour afficher cette aide
          </p>
        </div>
      </div>
    </div>
  );
};
