import React from 'react';
import { useKas } from '../../context/KasContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useKas();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let bgClass = 'bg-white border-slate-200 text-slate-800';
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;

        if (toast.type === 'success') {
          bgClass = 'bg-white border-emerald-100 shadow-soft-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        } else if (toast.type === 'error') {
          bgClass = 'bg-white border-red-100 shadow-soft-lg';
          icon = <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-white border-amber-100 shadow-soft-lg';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
        } else if (toast.type === 'info') {
          bgClass = 'bg-white border-brand-100 shadow-soft-lg';
          icon = <Info className="w-5 h-5 text-brand-500 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-soft transition-all duration-200 animate-fade-in ${bgClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
