import React, { useEffect, useRef } from 'react'
import { LogOut, AlertTriangle, X } from 'lucide-react'

interface SignOutModalProps {
  userName: string
  onConfirm: () => void
  onCancel: () => void
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  userName,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Focus the "Yes, Sign Out" button automatically so it is preselected
  useEffect(() => {
    confirmBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100 p-6 sm:p-7 text-left space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <h3 id="signout-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
            Sign out of AquaSense?
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            You are currently signed in as <span className="font-semibold text-slate-800">{userName}</span>.
            Any unsaved drafts in the observation wizard may be cleared.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-xs text-slate-600">
          <LogOut size={16} className="text-slate-400 shrink-0" />
          <span>You can sign back in at any time to submit or review stream data.</span>
        </div>

        {/* Buttons with YES preselected/highlighted */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 ring-4 ring-rose-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignOutModal
