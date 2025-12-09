import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300',
        'flex items-center gap-2 text-sm font-medium',
        isOnline
          ? 'bg-success text-white animate-fade-in'
          : 'bg-destructive text-white animate-pulse'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Mode hors ligne</span>
        </>
      )}
    </div>
  );
};
