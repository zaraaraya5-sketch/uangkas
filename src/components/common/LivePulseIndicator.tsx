import React, { useState } from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import { useKas } from '../../context/KasContext';

interface LivePulseIndicatorProps {
  className?: string;
  showText?: boolean;
}

export const LivePulseIndicator: React.FC<LivePulseIndicatorProps> = ({
  className = '',
  showText = true,
}) => {
  const { syncFromCloud, isCloudConnected, showToast } = useKas();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncFromCloud();
      showToast({
        type: 'success',
        title: '⚡ Sinkronisasi Cloud',
        message: 'Data kas realtime diperbarui dari database pusat.',
        duration: 2500,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Gagal Sinkronisasi',
        message: 'Tidak dapat terhubung ke server cloud.',
      });
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleManualSync}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
        isCloudConnected
          ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/90'
          : 'bg-amber-50/90 text-amber-700 border border-amber-200/80 hover:bg-amber-100/90'
      } text-xs font-medium shadow-sm backdrop-blur-sm cursor-pointer transition-all active:scale-95 ${className}`}
      title="Klik untuk menyinkronkan data langsung dengan cloud (Supabase Realtime)"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      {isSyncing ? (
        <RefreshCw className="w-3 h-3 text-emerald-600 shrink-0 animate-spin" />
      ) : (
        <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
      )}
      {showText && <span>{isSyncing ? 'Menyinkronkan...' : 'Realtime Sync'}</span>}
    </button>
  );
};
