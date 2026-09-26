import React from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import type { SignalType } from '../../types/observation'

interface SignalBadgeProps {
  signal: SignalType | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({
  signal,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normSignal = (signal || 'normal').toLowerCase() as SignalType

  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200'
  let label = 'Normal'
  let Icon = CheckCircle2

  if (normSignal === 'watch') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200'
    label = 'Watch'
    Icon = AlertTriangle
  } else if (normSignal === 'investigate') {
    bgClass = 'bg-rose-50 text-rose-800 border-rose-200'
    label = 'Investigate'
    Icon = AlertCircle
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm md:text-base px-3.5 py-1.5 gap-2 font-semibold',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors duration-150 ${bgClass} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0 stroke-[2.2]" />}
      <span>{label}</span>
    </span>
  )
}
