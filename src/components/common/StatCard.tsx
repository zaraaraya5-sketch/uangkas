import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'indigo' | 'default';
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          iconBg: 'bg-brand-50 text-brand-600 border border-brand-100',
          accent: 'hover:border-brand-300',
          badge: 'text-brand-700 bg-brand-50',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          accent: 'hover:border-emerald-300',
          badge: 'text-emerald-700 bg-emerald-50',
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
          accent: 'hover:border-rose-300',
          badge: 'text-rose-700 bg-rose-50',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          accent: 'hover:border-amber-300',
          badge: 'text-amber-700 bg-amber-50',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigoSoft-50 text-indigoSoft-600 border border-indigoSoft-100',
          accent: 'hover:border-indigoSoft-300',
          badge: 'text-indigoSoft-700 bg-indigoSoft-50',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
          accent: 'hover:border-slate-300',
          badge: 'text-slate-700 bg-slate-100',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover-card transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${colors.accent}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            {title}
          </p>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight truncate">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 mt-1 font-normal flex items-center gap-1.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600">Performa</span>
          <span className={`font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
