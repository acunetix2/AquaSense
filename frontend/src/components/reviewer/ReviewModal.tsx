import React, { useState } from 'react'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'

import type { Observation } from '../../types/observation'

interface ReviewModalProps {
  observation: Observation
  actionType: 'verify' | 'flag'
  onClose: () => void
  onConfirm: (notes: string) => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  observation,
  actionType,
  onClose,
  onConfirm,
}) => {
  const isVerify = actionType === 'verify'
  const [notes, setNotes] = useState(
    isVerify
      ? 'Field evidence and water appearance are consistent with typical regional baseline.'
      : 'Flagged for environmental field sampling and investigation by local water authority.'
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(notes)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-left">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isVerify ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isVerify ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isVerify ? 'Verify Observation' : 'Flag Observation'}
              </h3>
              <p className="text-xs text-slate-500">
                {observation.site_name} • Signal: {observation.signal.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <p className="font-semibold text-slate-800">AI Assessment Summary:</p>
            <p className="text-slate-600">{observation.ai_summary}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reviewer Notes / Evidence Rationale
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${
                isVerify
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isVerify ? 'Confirm Verification' : 'Confirm Flagging'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
