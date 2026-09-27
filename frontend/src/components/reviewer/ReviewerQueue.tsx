import React, { useEffect, useState } from 'react'
import {
  BarChart3,
  CheckCircle,
  Flag,
  Search,
} from 'lucide-react'

import { useApp } from '../../context/AppContext'
import { SignalBadge } from '../common/SignalBadge'
import { EmptyState } from '../common/EmptyState'
import { ReviewModal } from './ReviewModal'
import { fetchAIEvaluationMetrics, type AIEvaluationMetrics } from '../../services/api'
import type { AiAssessmentAlignment, Observation } from '../../types/observation'

export const ReviewerQueue: React.FC = () => {
  const { observations, reviewObservation, openObservationDetail } = useApp()

  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [modalObs, setModalObs] = useState<{
    obs: Observation
    action: 'verify' | 'flag'
  } | null>(null)
  const [search, setSearch] = useState('')
  const [evaluationMetrics, setEvaluationMetrics] = useState<AIEvaluationMetrics | null>(null)

  useEffect(() => {
    fetchAIEvaluationMetrics().then(setEvaluationMetrics)
  }, [])

  // Priority counts
  const highCount = observations.filter((o) => o.priority === 'high' || o.signal === 'investigate').length
  const mediumCount = observations.filter((o) => o.priority === 'medium' || o.signal === 'watch').length
  const lowCount = observations.filter((o) => o.priority === 'low' || o.signal === 'normal').length

  const filtered = observations.filter((obs) => {
    if (activeTab === 'high' && !(obs.priority === 'high' || obs.signal === 'investigate')) return false
    if (activeTab === 'medium' && !(obs.priority === 'medium' || obs.signal === 'watch')) return false
    if (activeTab === 'low' && !(obs.priority === 'low' || obs.signal === 'normal')) return false
    if (search && !obs.site_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Apr 25, 2025'
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Page Header matching Screen 7 */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Reviewer Queue
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Prioritized observations requiring human expert review and verification.
        </p>
      </div>

      {evaluationMetrics && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5" aria-label="AI evaluation metrics">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <BarChart3 size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">Human feedback on AI assessments</p>
              <p className="text-xs text-slate-600 mt-0.5">Reviewer alignment is an evaluation signal, not a measure of environmental truth.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <Metric label="Vision assessed" value={evaluationMetrics.vision_assessed} />
                <Metric label="Reviewed with feedback" value={evaluationMetrics.reviewed_with_alignment} />
                <Metric label="Reviewer overrides" value={evaluationMetrics.reviewer_overrides} />
                <Metric label="Agreement rate" value={evaluationMetrics.agreement_rate === null ? '—' : `${Math.round(evaluationMetrics.agreement_rate * 100)}%`} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Priority Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({observations.length})
          </button>

          <button
            onClick={() => setActiveTab('high')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'high'
                ? 'bg-[#E76F51] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            High Priority ({highCount})
          </button>

          <button
            onClick={() => setActiveTab('medium')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'medium'
                ? 'bg-[#F59E0B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Medium ({mediumCount})
          </button>

          <button
            onClick={() => setActiveTab('low')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'low'
                ? 'bg-[#4CAF50] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Low ({lowCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Reviewer Queue Table matching Screen 7 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Location</th>
                <th className="py-3.5 px-4">Signal</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((obs) => {
                const isVerified = obs.status === 'verified'
                const isFlagged = obs.status === 'flagged'

                return (
                  <tr
                    key={obs.id}
                    className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                    onClick={() => openObservationDetail(obs)}
                  >
                    {/* Location & Stream Thumbnail */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          <img
                            src={obs.image_url}
                            alt={obs.site_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors truncate">
                            {obs.site_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {obs.location_address || 'Freshwater stream'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Signal Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SignalBadge signal={obs.signal} size="sm" />
                    </td>

                    {/* Confidence Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                      {Math.round(obs.confidence * 100)}%
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs sm:text-sm">
                      {formatDate(obs.created_at)}
                    </td>

                    {/* Action Buttons: Verify & Flag */}
                    <td
                      className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-2">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                            <CheckCircle size={13} />
                            <span>Verified</span>
                          </span>
                        ) : isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
                            <Flag size={13} />
                            <span>Flagged</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalObs({ obs, action: 'verify' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0284C7] hover:text-white bg-sky-50 hover:bg-[#0284C7] border border-sky-200 transition-colors cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalObs({ obs, action: 'flag' })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer"
                            >
                              Flag
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={CheckCircle}
            title={search || activeTab !== 'all' ? 'No matching reports found' : 'Reviewer queue is all clear'}
            description={
              search || activeTab !== 'all'
                ? 'No stream observations match your current filter and search criteria.'
                : 'All submitted freshwater stream reports have been reviewed and verified by the hydrology team.'
            }
            actionLabel={search || activeTab !== 'all' ? 'Reset Filters' : undefined}
            onAction={
              search || activeTab !== 'all'
                ? () => {
                    setSearch('')
                    setActiveTab('all')
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Review Modal Dialog */}
      {modalObs && (
        <ReviewModal
          observation={modalObs.obs}
          actionType={modalObs.action}
          onClose={() => setModalObs(null)}
          onConfirm={(notes, alignment: AiAssessmentAlignment) => {
            reviewObservation(modalObs.obs.id, modalObs.action === 'verify' ? 'verified' : 'flagged', notes, alignment)
            setModalObs(null)
          }}
        />
      )}
    </div>
  )
}

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-xl border border-indigo-100 bg-white/80 p-3">
    <p className="text-lg font-black text-indigo-800">{value}</p>
    <p className="text-[11px] font-medium text-slate-600 leading-tight mt-0.5">{label}</p>
  </div>
)
