import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (customActions?: ShortcutAction[]) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input field
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Global shortcuts
    const shortcuts: ShortcutAction[] = [
      // Navigation
      { key: 'h', ctrl: false, shift: false, action: () => navigate('/'), description: 'Accueil' },
      { key: 'd', ctrl: false, shift: false, action: () => navigate('/dashboard'), description: 'Dashboard' },
      { key: 'b', ctrl: false, shift: false, action: () => navigate('/budgets'), description: 'Budgets' },
      { key: 'g', ctrl: false, shift: false, action: () => navigate('/goals'), description: 'Objectifs' },
      { key: 'r', ctrl: false, shift: false, action: () => navigate('/recurring'), description: 'Récurrents' },
      { key: 'c', ctrl: false, shift: false, action: () => navigate('/categories'), description: 'Catégories' },
      { key: 'p', ctrl: false, shift: false, action: () => navigate('/projection'), description: 'Projection' },
      { key: 's', ctrl: false, shift: false, action: () => navigate('/settings'), description: 'Paramètres' },
      
      // Actions with Ctrl
      { key: 'n', ctrl: true, shift: false, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-new-transaction'));
      }, description: 'Nouvelle transaction' },
      
      { key: 'i', ctrl: true, shift: true, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-import'));
      }, description: 'Importer fichier' },
      
      { key: 'f', ctrl: true, shift: false, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-search'));
        if (location.pathname !== '/history') {
          navigate('/history');
        }
      }, description: 'Rechercher' },
      
      { key: 'z', ctrl: true, shift: false, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-undo'));
      }, description: 'Annuler' },
      
      { key: 'z', ctrl: true, shift: true, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-redo'));
      }, description: 'Rétablir' },
      
      { key: 'y', ctrl: true, shift: false, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-redo'));
      }, description: 'Rétablir' },
      
      // Help
      { key: '?', ctrl: false, shift: true, action: () => {
        window.dispatchEvent(new CustomEvent('shortcut-help'));
      }, description: 'Aide raccourcis' },
      
      ...(customActions || []),
    ];

    for (const shortcut of shortcuts) {
      const matchKey = shortcut.key === key;
      const matchCtrl = !!shortcut.ctrl === ctrl;
      const matchShift = !!shortcut.shift === shift;
      const matchAlt = !!shortcut.alt === alt;

      if (matchKey && matchCtrl && matchShift && matchAlt) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [navigate, location.pathname, customActions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Shortcuts list for help modal
export const SHORTCUTS_LIST = [
  { category: 'Navigation', shortcuts: [
    { keys: 'H', description: 'Accueil (Import)' },
    { keys: 'D', description: 'Tableau de bord' },
    { keys: 'B', description: 'Budgets' },
    { keys: 'G', description: 'Objectifs' },
    { keys: 'R', description: 'Récurrents' },
    { keys: 'C', description: 'Catégories' },
    { keys: 'P', description: 'Projection' },
    { keys: 'S', description: 'Paramètres' },
  ]},
  { category: 'Actions', shortcuts: [
    { keys: 'Ctrl + N', description: 'Nouvelle transaction' },
    { keys: 'Ctrl + Shift + I', description: 'Importer fichier' },
    { keys: 'Ctrl + F', description: 'Rechercher' },
    { keys: 'Ctrl + Z', description: 'Annuler' },
    { keys: 'Ctrl + Shift + Z', description: 'Rétablir' },
    { keys: 'Shift + ?', description: 'Aide raccourcis' },
  ]},
];
