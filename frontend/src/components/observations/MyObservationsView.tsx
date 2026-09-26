import React, { useState } from 'react'
import { PlusCircle, Search, Calendar, MapPin, ArrowRight, Compass, Trash2, X, Images } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { SignalBadge } from '../common/SignalBadge'
import { EmptyState } from '../common/EmptyState'

export const MyObservationsView: React.FC = () => {
  const { observations, openObservationDetail, setActiveView, deleteObservation } = useApp()
  const { user } = useAuth()
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null)

  const myObs = observations.filter((obs) => {
    // Strict owner match only — email is redacted server-side and display
    // names are not unique, so name/email matching would leak other users'
    // records into this view (with edit/delete controls).
    const matchesCurrentUser = !!user && !!user.id && !!obs.user_id && obs.user_id === user.id

    if (user && !matchesCurrentUser) return false
    if (filter === 'verified' && obs.status !== 'verified') return false
    if (filter === 'pending' && obs.status !== 'pending') return false
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
      return 'Unknown date'
    }
  }

  const handleDeleteConfirm = () => {
    if (confirmDeleteId !== null) {
      deleteObservation(confirmDeleteId, user?.id)
      setConfirmDeleteId(null)
    }
  }

  const confirmTarget = observations.find((o) => o.id === confirmDeleteId)

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Observations
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your submitted freshwater stream assessments and verification updates.
          </p>
        </div>

        <button
          onClick={() => setActiveView('capture')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <PlusCircle size={16} />
          <span>New Observation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#0284C7] text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({observations.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Verified ({observations.filter((o) => o.status === 'verified').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pending ({observations.filter((o) => o.status === 'pending').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my observations..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
          />
        </div>
      </div>

      {/* Grid of My Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myObs.map((obs) => (
          <div
            key={obs.id}
            className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative"
          >
            {/* Delete Button (top-right overlay) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDeleteId(obs.id)
              }}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shadow-sm"
              title="Delete observation"
            >
              <Trash2 size={14} />
            </button>

            <div onClick={() => openObservationDetail(obs)} className="cursor-pointer">
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={(obs.image_urls && obs.image_urls[0]) || obs.image_url}
                  alt={obs.site_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <SignalBadge signal={obs.signal} size="sm" />
                </div>
                {obs.image_urls && obs.image_urls.length > 1 && (
                  <div className="absolute top-3 right-11 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Images size={11} />
                    <span>{obs.image_urls.length}</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700 capitalize">
                  {obs.status || 'Pending'}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors truncate pr-6">
                  {obs.site_name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400" />
                  <span className="truncate">{obs.location_address || 'Regional stream'}</span>
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {obs.ai_summary}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(obs.created_at)}</span>
              </span>
              <button
                onClick={() => openObservationDetail(obs)}
                className="font-semibold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {myObs.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs">
          <EmptyState
            icon={Compass}
            title={search || filter !== 'all' ? 'No matching observations' : 'No stream assessments yet'}
            description={
              search || filter !== 'all'
                ? 'Try adjusting your search terms or filter tabs to find what you are looking for.'
                : 'You have not recorded any stream observations yet. Start by logging your local river conditions.'
            }
            actionLabel="Record Stream Observation"
            onAction={() => setActiveView('capture')}
            secondaryLabel={search || filter !== 'all' ? 'Reset Filters' : undefined}
            onSecondaryAction={
              search || filter !== 'all'
                ? () => {
                    setSearch('')
                    setFilter('all')
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 max-w-md w-full space-y-5">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Observation?</h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            {confirmTarget && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="font-semibold text-slate-800 text-sm">{confirmTarget.site_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(confirmTarget.created_at)}</p>
              </div>
            )}

            <p className="text-sm text-slate-600 leading-relaxed">
              This will permanently remove this observation from your records and the regional dataset. Are you sure?
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
