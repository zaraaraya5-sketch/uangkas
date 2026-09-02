import React from 'react';
import { PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';

  if (status === 'Lunas') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Lunas
      </span>
    );
  }

  if (status === 'Sebagian') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        Sebagian
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
      Belum Membayar
    </span>
  );
};
