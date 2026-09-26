import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondaryAction?: () => void
  /** Compact mode for inside panels/columns */
  compact?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-10 px-6' : 'py-20 px-8'
      }`}
    >
      {/* Icon bubble */}
      <div
        className={`relative flex items-center justify-center mb-5 ${
          compact ? 'w-14 h-14' : 'w-20 h-20'
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-slate-100 animate-pulse-slow" />
        <div
          className={`relative z-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${
            compact ? 'w-14 h-14' : 'w-20 h-20'
          }`}
        >
          <Icon
            className="text-slate-400"
            size={compact ? 22 : 30}
            strokeWidth={1.6}
          />
        </div>
      </div>

      {/* Text */}
      <h3
        className={`font-bold text-slate-700 tracking-tight mb-2 ${
          compact ? 'text-base' : 'text-xl'
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-slate-400 leading-relaxed max-w-xs ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryLabel) && (
        <div className={`flex items-center gap-3 ${compact ? 'mt-5' : 'mt-7'}`}>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`inline-flex items-center gap-2 font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow transition-all cursor-pointer active:scale-95 ${
                compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
              }`}
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className={`inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95 ${
                compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
              }`}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
