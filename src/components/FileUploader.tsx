import { useCallback, useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseCSV, generateSampleCSV } from '@/utils/parseCSV';
import { parsePDF } from '@/utils/parsePDF';
import { Transaction, Account } from '@/utils/types';
import { localStore } from '@/utils/localStore';
import { ImportPreviewModal } from './ImportPreviewModal';
import { AccountSelector } from './AccountSelector';
import { cn } from '@/lib/utils';
import { buildTransactionFingerprint, normalizeLabel, toMinorUnits } from '@/utils/normalization';

interface FileUploaderProps {
  onUpload: (transactions: Transaction[]) => void;
  onClear: () => void;
  hasData: boolean;
}

export const FileUploader = ({ onUpload, onClear, hasData }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'pdf' | null>(null);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[] | null>(null);
  const [previewSource, setPreviewSource] = useState<'csv' | 'pdf'>('csv');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStore.getSelectedAccountId();
    setSelectedAccountId(id);
    
    // Listen for account changes
    const handleAccountChange = () => {
      setSelectedAccountId(localStore.getSelectedAccountId());
    };
    window.addEventListener('account-changed', handleAccountChange);
    return () => window.removeEventListener('account-changed', handleAccountChange);
  }, []);

  // Listen for import shortcut
  useEffect(() => {
    const handleImportShortcut = () => {
      if (!selectedAccountId) {
        setError('Veuillez sélectionner un compte avant d\'importer');
        return;
      }
      const input = document.querySelector('input[type="file"][accept=".csv,.pdf"]') as HTMLInputElement;
      if (input) input.click();
    };
    window.addEventListener('shortcut-import', handleImportShortcut);
    return () => window.removeEventListener('shortcut-import', handleImportShortcut);
  }, [selectedAccountId]);

  const handleFile = useCallback(async (file: File) => {
    if (!selectedAccountId) {
      setError('Veuillez sélectionner un compte avant d\'importer');
      return;
    }

    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    
    if (!isPDF && !isCSV) {
      setError('Formats acceptés : CSV ou PDF');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileType(isPDF ? 'pdf' : 'csv');

    try {
      let transactions: Transaction[];
      
      if (isPDF) {
        transactions = await parsePDF(file);
      } else {
        transactions = await parseCSV(file);
      }

      // Assign accountId to all parsed transactions
      transactions = transactions.map(t => {
        const normalizedLabel = t.normalizedLabel || normalizeLabel(t.label);
        const amountMinor = typeof t.amountMinor === 'number'
          ? t.amountMinor
          : (t.isIncome ? 1 : -1) * toMinorUnits(Math.abs(t.amount));
        const dedupeHash = buildTransactionFingerprint({
          accountId: selectedAccountId,
          date: t.date,
          amountMinor,
          normalizedLabel,
          source: t.source,
        });

        return {
          ...t,
          accountId: selectedAccountId,
          normalizedLabel,
          amountMinor,
          dedupeHash,
        };
      });
      
      if (transactions.length === 0) {
        setError('Aucune transaction valide trouvée dans le fichier');
      } else {
        // Show preview instead of direct import
        setPreviewTransactions(transactions);
        setPreviewSource(isPDF ? 'pdf' : 'csv');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(`Erreur lors de la lecture du fichier ${isPDF ? 'PDF' : 'CSV'}`);
    } finally {
      setIsLoading(false);
      setFileType(null);
    }
  }, [selectedAccountId]);

  const handlePreviewConfirm = (transactions: Transaction[]) => {
    onUpload(transactions);
    setPreviewTransactions(null);
  };

  const handlePreviewCancel = () => {
    setPreviewTransactions(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedAccountId) {
      setError('Veuillez sélectionner un compte avant d\'importer');
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, selectedAccountId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exemple_releve.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const accounts = localStore.getAccounts();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const hasNoAccount = accounts.length === 0;

  return (
    <div className="space-y-4">
      {/* Account Selector for Import */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Compte de destination :</span>
          <AccountSelector compact onChange={setSelectedAccountId} />
        </div>
        {selectedAccount && (
          <span className="text-xs text-muted-foreground">
            Les transactions seront importées dans "{selectedAccount.name}"
          </span>
        )}
      </div>

      {/* No Account Warning */}
      {hasNoAccount && (
        <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Aucun compte créé</p>
            <p className="text-xs text-muted-foreground">
              Créez un compte pour pouvoir importer vos transactions.
            </p>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300',
          !selectedAccountId && 'opacity-50 cursor-not-allowed',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
          isLoading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          accept=".csv,.pdf"
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isLoading || !selectedAccountId}
        />
        
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300',
          isDragging && 'scale-110'
        )}>
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        
        <p className="mt-4 text-center font-semibold text-foreground">
          {isLoading 
            ? `Analyse ${fileType === 'pdf' ? 'PDF' : 'CSV'} en cours...` 
            : !selectedAccountId
              ? 'Sélectionnez un compte pour importer'
              : 'Glissez votre relevé ici'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedAccountId && 'ou cliquez pour sélectionner un fichier'}
        </p>
        
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            <FileText className="h-3.5 w-3.5" />
            PDF (Caisse d'Épargne)
          </div>
        </div>
        
        <p className="mt-3 text-xs text-muted-foreground text-center max-w-xs">
          CSV : Date; Libellé; Montant<br />
          PDF : Relevé bancaire standard
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive animate-scale-in">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadSample}
          className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80 hover:shadow-card"
        >
          <Download className="h-4 w-4" />
          Télécharger un exemple CSV
        </button>

        {hasData && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive transition-all hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Effacer les données
          </button>
        )}
      </div>

      {/* Import Preview Modal */}
      {previewTransactions && selectedAccountId && (
        <ImportPreviewModal
          transactions={previewTransactions}
          source={previewSource}
          accountId={selectedAccountId}
          onConfirm={handlePreviewConfirm}
          onCancel={handlePreviewCancel}
        />
      )}
    </div>
  );
};
