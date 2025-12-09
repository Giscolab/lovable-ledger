import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title?: string;
  message?: string;
  itemLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal = ({
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible.',
  itemLabel,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm glass rounded-2xl p-6 animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          
          <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
          
          {itemLabel && (
            <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
              « {itemLabel} »
            </p>
          )}
          
          <p className="text-sm text-muted-foreground mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
