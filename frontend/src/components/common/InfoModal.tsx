import React from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface InfoModalProps {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}

/** Lightweight modal for static informational content (privacy, quality assurance). */
export const InfoModal: React.FC<InfoModalProps> = ({ open, title, children, onClose }) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 sm:p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">{children}</div>

        <Button onClick={onClose} variant="primary" className="w-full">
          Close
        </Button>
      </div>
    </div>
  )
}

export default InfoModal
