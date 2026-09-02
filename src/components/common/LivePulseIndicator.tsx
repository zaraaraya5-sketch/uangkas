import React from 'react';
import { Wifi } from 'lucide-react';

interface LivePulseIndicatorProps {
  className?: string;
  showText?: boolean;
}

export const LivePulseIndicator: React.FC<LivePulseIndicatorProps> = ({
  className = '',
  showText = true,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 text-xs font-medium shadow-sm backdrop-blur-sm ${className}`}
      title="Sistem sinkronisasi realtime aktif (Multi-tab, multi-device & Supabase Ready)"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
      {showText && <span>Realtime Sync</span>}
    </div>
  );
};
