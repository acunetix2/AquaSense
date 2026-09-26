import React, { useState } from 'react'
import {
  MapPin,
  Calendar,
  Droplets,
  ArrowRight,
  ShieldCheck,
  Clock,
  Heart,
  MessageSquare,
} from 'lucide-react'
import { SignalBadge } from './SignalBadge'
import type { Observation } from '../../types/observation'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { PublicUserProfileModal } from '../profile/PublicUserProfileModal'
import { likeObservation, unlikeObservation } from '../../services/api'

interface PublicObservationCardProps {
  observation: Observation
  onSelect?: (obs: Observation) => void
  compact?: boolean
  showCategory?: boolean
}

// Derive a clean ecosystem category from site name or notes
const getEcosystemCategory = (obs: Observation): string => {
  const text = `${obs.site_name} ${obs.notes || ''} ${obs.location_address || ''}`.toLowerCase()
  if (text.includes('lake') || text.includes('reservoir')) return 'Lake & Reservoir'
  if (text.includes('rapids') || text.includes('mountain') || text.includes('creek')) return 'Stream & Rapids'
  if (text.includes('canal') || text.includes('drain') || text.includes('urban') || text.includes('runoff') || text.includes('bronx')) return 'Urban Watershed'
  if (text.includes('sanctuary') || text.includes('willow') || text.includes('wetland')) return 'Protected Wetland'
  return 'Riparian Corridor'
}

export const PublicObservationCard: React.FC<PublicObservationCardProps> = ({
  observation: obs,
  onSelect,
  compact = false,
  showCategory = true,
}) => {
  const { openObservationDetail, observations, showToast } = useApp()
  const { user } = useAuth()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [liked, setLiked] = useState(!!obs.liked_by_me)
  const [likeCount, setLikeCount] = useState(obs.like_count ?? 0)
  const [likeBusy, setLikeBusy] = useState(false)
  const primaryImage = obs.image_urls?.[0] || obs.image_url || ''

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likeBusy) return
    if (!user?.id) {
      showToast('Sign in required', 'Please sign in to like this observation.', 'warning')
      return
    }

    const next = !liked
    setLiked(next)
    setLikeCount((prev) => Math.max(0, prev + (next ? 1 : -1)))
    setLikeBusy(true)
    const result = next
      ? await likeObservation(obs.id, user.id)
      : await unlikeObservation(obs.id, user.id)
    setLikeBusy(false)
    if (result) {
      setLiked(result.liked)
      setLikeCount(result.like_count)
    }
  }

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelect) {
      onSelect(obs)
    } else {
      openObservationDetail(obs)
    }
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(obs)
    } else {
      openObservationDetail(obs)
    }
  }

  // Format date in human-friendly format
  const formatSubmittedDate = (isoString?: string) => {
    if (!isoString) return 'Recent'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Recent'
    }
  }

  const formatSubmittedTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const observerName = obs.observer_name || obs.reviewed_by || 'Civic Observer'
  const observerAvatar =
    obs.observer_avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(observerName)}`
  const observerRole = obs.observer_role || (obs.reviewed_by ? 'Certified Reviewer' : 'Citizen Scientist')
  const observerLocation = obs.observer_location || obs.location_address || 'Regional Watershed'
  const category = getEcosystemCategory(obs)

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#0F4C81]/35 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer text-left relative"
    >
      {/* Stream Photo Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={obs.site_name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-sky-50 to-slate-100 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            No image
          </div>
        )}

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />

        {/* Signal Badge Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <SignalBadge signal={obs.signal} size="sm" />
        </div>

        {/* Category Pill Top Right */}
        {showCategory && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/10 text-[11px] font-medium tracking-wide">
            {category}
          </div>
        )}

        {/* Location Tag Bottom Left */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 font-medium truncate drop-shadow-md">
            <MapPin size={13} className="text-teal-300 shrink-0" />
            <span className="truncate">{obs.location_address || obs.site_name}</span>
          </div>
          <span className="text-[11px] font-mono shrink-0 bg-black/40 px-1.5 py-0.5 rounded-sm backdrop-blur-xs">
            {Math.round(obs.confidence * 100)}% conf
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Site Title */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#0F4C81] transition-colors line-clamp-1">
              {obs.site_name}
            </h3>
            {obs.status === 'verified' && (
              <span
                title="Verified by certified hydrologist"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0"
              >
                <ShieldCheck size={11} />
                Verified
              </span>
            )}
          </div>

          {/* AI Summary / Diagnosis snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {obs.ai_summary}
          </p>
        </div>

        {/* UPLOADER & ANALYST INFO SECTION (Prominently displayed) */}
        <div className="pt-3 border-t border-slate-100/90 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Contributor Profile (Clickable to view public profile) */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                setShowProfileModal(true)
              }}
              title="Click to view observer public profile and stats"
              className="flex items-center gap-2.5 min-w-0 p-1 -m-1 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer group/prof"
            >
              <div className="relative shrink-0">
                <img
                  src={observerAvatar}
                  alt={observerName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs group-hover/prof:ring-2 group-hover/prof:ring-[#0F4C81]/30 transition-all"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(observerName)}`
                  }}
                />
                {obs.status === 'verified' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <ShieldCheck size={8} className="text-white" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover/prof:text-[#0F4C81] transition-colors underline-offset-2 group-hover/prof:underline">
                    {observerName}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                  <span className="shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-full bg-gradient-to-tr from-[#0F4C81] to-[#1FB8A6]">
                    <Droplets size={8} className="text-white" />
                  </span>
                  <span>{observerRole}</span>
                </p>
              </div>
            </div>

            {/* Formatted Date & Time */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 justify-end">
                <Calendar size={11} className="text-slate-400" />
                <span>{formatSubmittedDate(obs.created_at)}</span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                <Clock size={10} className="text-slate-300" />
                <span>{formatSubmittedTime(obs.created_at)}</span>
              </p>
            </div>
          </div>

          {/* Engagement — like & comments (never trigger the card click) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleToggleLike}
              aria-pressed={liked}
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                liked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart size={12} className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleCommentsClick}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
              title="Open observation to read or add comments"
            >
              <MessageSquare size={12} className="text-slate-400" />
              <span>{obs.comment_count ?? 0}</span>
            </button>
          </div>

          {/* Quick Inspector Link */}
          {!compact && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {observerLocation}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#0F4C81] group-hover:translate-x-0.5 transition-transform text-xs">
                Inspect analysis
                <ArrowRight size={13} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Public User Profile Modal */}
      {showProfileModal && (
        <PublicUserProfileModal
          userId={obs.user_id}
          observerName={observerName}
          observerAvatar={observerAvatar}
          observerRole={observerRole}
          observerLocation={observerLocation}
          allObservations={observations}
          onSelectObservation={(o) => {
            setShowProfileModal(false)
            openObservationDetail(o)
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </article>
  )
}
