import React from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4"
    >
      {toasts.map((toast) => {
        let Icon = CheckCircle2
        let borderClass = 'border-emerald-300'
        let bgClass = 'bg-white'
        let iconColor = 'text-emerald-600'

        if (toast.type === 'warning') {
          Icon = AlertTriangle
          borderClass = 'border-amber-300'
          iconColor = 'text-amber-600'
        } else if (toast.type === 'error') {
          Icon = AlertCircle
          borderClass = 'border-rose-300'
          iconColor = 'text-rose-600'
        } else if (toast.type === 'info') {
          Icon = Info
          borderClass = 'border-sky-300'
          iconColor = 'text-sky-600'
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${bgClass} ${borderClass}`}
          >
            <Icon size={20} className={`shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-800">{toast.title}</p>
              <p className="text-slate-600 mt-0.5 text-xs md:text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
