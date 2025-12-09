import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, FileJson } from 'lucide-react';
import { localStore } from '@/utils/localStore';
import { BackupData } from '@/utils/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const BackupRestore = () => {
  const [importing, setImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const backup = localStore.exportAllData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Sauvegarde exportée',
      description: 'Votre fichier de sauvegarde a été téléchargé',
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string) as BackupData;
        
        // Validate backup structure
        if (!backup.version || !backup.data) {
          throw new Error('Format de sauvegarde invalide');
        }

        setPendingBackup(backup);
        setShowConfirm(true);
      } catch (error) {
        toast({
          title: 'Erreur de lecture',
          description: 'Le fichier sélectionné n\'est pas une sauvegarde valide',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de lire le fichier',
        variant: 'destructive',
      });
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;

    try {
      const result = localStore.importAllData(pendingBackup, mergeMode === 'merge');
      
      let description = 'Paramètres restaurés avec succès';
      if (result) {
        description = mergeMode === 'merge'
          ? `${result.added} transactions ajoutées, ${result.skipped} doublons ignorés`
          : `${result.added} transactions importées`;
      }

      toast({
        title: 'Import réussi',
        description,
      });

      setShowConfirm(false);
      setPendingBackup(null);
      
      // Reload the page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="rounded-2xl glass p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-primary/10 p-2">
          <FileJson className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Sauvegarde & Restauration</h3>
          <p className="text-xs text-muted-foreground">Exportez ou importez vos données</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Export */}
        <button
          onClick={handleExport}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
        >
          <div className="rounded-full bg-success/10 p-3">
            <Download className="h-6 w-6 text-success" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Exporter</p>
            <p className="text-xs text-muted-foreground">Télécharger une sauvegarde JSON</p>
          </div>
        </button>

        {/* Import */}
        <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            disabled={importing}
          />
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              {importing ? 'Lecture...' : 'Importer'}
            </p>
            <p className="text-xs text-muted-foreground">Charger une sauvegarde JSON</p>
          </div>
        </label>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-warning" />
              <h3 className="text-lg font-bold text-foreground">Confirmer l'import</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Version:</strong> {pendingBackup.version}
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Date:</strong> {new Date(pendingBackup.exportedAt).toLocaleString('fr-FR')}
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Transactions:</strong> {pendingBackup.data.transactions?.length || 0}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Mode d'import :</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMergeMode('merge')}
                    className={cn(
                      'flex-1 p-3 rounded-xl text-sm font-medium transition-all',
                      mergeMode === 'merge'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    <CheckCircle className={cn('h-4 w-4 mx-auto mb-1', mergeMode === 'merge' ? 'opacity-100' : 'opacity-50')} />
                    Fusionner
                    <p className="text-xs opacity-75 mt-1">Ajoute les nouvelles transactions</p>
                  </button>
                  <button
                    onClick={() => setMergeMode('replace')}
                    className={cn(
                      'flex-1 p-3 rounded-xl text-sm font-medium transition-all',
                      mergeMode === 'replace'
                        ? 'bg-destructive text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    <AlertCircle className={cn('h-4 w-4 mx-auto mb-1', mergeMode === 'replace' ? 'opacity-100' : 'opacity-50')} />
                    Remplacer
                    <p className="text-xs opacity-75 mt-1">Écrase toutes les données</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
