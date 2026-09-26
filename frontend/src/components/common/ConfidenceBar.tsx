import React from 'react'

interface ConfidenceBarProps {
  confidence: number
  showLabel?: boolean
  className?: string
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  showLabel = true,
  className = '',
}) => {
  const percent = Math.min(100, Math.max(0, Math.round(confidence > 1 ? confidence : confidence * 100)))

  // Color mapping based on confidence level
  let barColor = 'bg-[#1FB8A6]' // fresh teal
  if (percent >= 80) {
    barColor = 'bg-[#4CAF50]' // river green
  } else if (percent >= 60) {
    barColor = 'bg-[#1FB8A6]'
  } else {
    barColor = 'bg-[#F59E0B]' // amber
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs md:text-sm font-medium text-slate-600">
          <span>Confidence {percent}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
