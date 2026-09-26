import React, { useMemo, useState } from 'react'
import {
  Newspaper,
  Flame,
  Sparkles,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  MapPin,
  BadgeCheck,
  Droplets,
  Loader2,
  ImageOff,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { SignalBadge } from '../common/SignalBadge'
import { likeObservation, unlikeObservation } from '../../services/api'
import type { Observation } from '../../types/observation'

type FeedTab = 'for-you' | 'trending'
type Category = 'all' | 'normal' | 'watch' | 'investigate' | 'verified' | 'photos'

const PAGE_SIZE = 10

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'normal', label: 'Normal' },
  { id: 'watch', label: 'Watch' },
  { id: 'investigate', label: 'Investigate' },
  { id: 'verified', label: 'Verified' },
  { id: 'photos', label: 'With Photos' },
]

const engagementOf = (obs: Observation): number =>
  (obs.like_count ?? 0) * 3 + (obs.comment_count ?? 0) * 5 + (obs.views_count ?? 0) * 0.5

const ageHoursOf = (obs: Observation): number =>
  Math.max(0, (Date.now() - new Date(obs.created_at).getTime()) / 3_600_000)

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const signalGradient: Record<string, string> = {
  normal: 'from-emerald-500/90 via-teal-500/80 to-sky-600/90',
  watch: 'from-amber-400/90 via-orange-500/80 to-rose-400/90',
  investigate: 'from-rose-500/90 via-rose-600/80 to-slate-700/90',
}

// Real observation media — falls back through the image list to a branded
// signal-colored panel (never generic stock imagery).
const FeedMedia: React.FC<{ obs: Observation }> = ({ obs }) => {
  const images = (obs.image_urls?.length ? obs.image_urls : obs.image_url ? [obs.image_url] : [])
    .filter(Boolean)
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const src = images[idx]

  if (!src || failed) {
    return (
      <div
        className={`h-64 sm:h-80 w-full bg-gradient-to-br ${signalGradient[obs.signal] ?? signalGradient.normal} flex flex-col items-center justify-center text-white relative`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        <Droplets size={40} className="opacity-90 relative" />
        <p className="font-bold text-base mt-3 px-6 text-center relative">{obs.site_name}</p>
        <p className="text-[11px] opacity-90 mt-1 relative">Field observation · no photo attached</p>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
          <ImageOff size={11} /> No image
        </span>
      </div>
    )
  }

  return (
    <div className="relative h-64 sm:h-80 w-full bg-slate-100">
      <img
        src={src}
        alt={`Field photo of ${obs.site_name}`}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => {
          if (idx + 1 < images.length) setIdx(idx + 1)
          else setFailed(true)
        }}
      />
      <div className="absolute top-3 left-3">
        <SignalBadge signal={obs.signal} size="sm" />
      </div>
      {images.length > 1 && (
        <span className="absolute top-3 right-3 text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm px-2 py-1 rounded-full">
          1/{images.length}
        </span>
      )}
    </div>
  )
}

export const FeedView: React.FC = () => {
  const { observations, isLoading, openObservationDetail, updateObservationSocial, showToast } =
    useApp()
  const { user } = useAuth()

  const [tab, setTab] = useState<FeedTab>('for-you')
  const [category, setCategory] = useState<Category>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const items = useMemo(() => {
    const filtered = observations.filter((obs) => {
      if (category === 'normal' || category === 'watch' || category === 'investigate') {
        return obs.signal === category
      }
      if (category === 'verified') return obs.status === 'verified'
      if (category === 'photos') {
        return Boolean(obs.image_url || (obs.image_urls && obs.image_urls.length > 0))
      }
      return true
    })

    const scored = filtered.map((obs) => {
      const ageH = ageHoursOf(obs)
      const engagement = engagementOf(obs)
      // For You: fresh activity rises to the top; engagement breaks ties.
      const forYou = (engagement + 2) / (ageH + 6)
      // Trending: engagement dominates, decaying gently over days.
      const trending = engagement / (Math.pow(ageH / 24, 0.75) + 1)
      return { obs, score: tab === 'for-you' ? forYou : trending }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.obs)
  }, [observations, category, tab])

  const visible = items.slice(0, visibleCount)

  const handleLike = async (obs: Observation) => {
    if (!user?.id) {
      showToast('Sign In Required', 'Sign in to like observations in the feed.', 'info')
      return
    }
    const key = String(obs.id)
    if (busyId === key) return
    const isLiked = likedMap[key] ?? obs.liked_by_me ?? false
    setBusyId(key)
    const result = isLiked
      ? await unlikeObservation(obs.id, user.id)
      : await likeObservation(obs.id, user.id)
    if (result) {
      setLikedMap((prev) => ({ ...prev, [key]: result.liked }))
      updateObservationSocial(obs.id, { liked_by_me: result.liked, like_count: result.like_count })
    } else {
      showToast('Like Failed', 'Could not save your like. Please try again.', 'error')
    }
    setBusyId(null)
  }

  const handleShare = async (obs: Observation) => {
    const url = `${window.location.origin}/detail?obs=${obs.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link Copied', 'A shareable link to this observation is on your clipboard.', 'success')
    } catch {
      showToast('Share Link', url, 'info')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Newspaper size={24} className="text-[#0F4C81]" />
            Community Feed
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Field observations from citizen scientists, ranked for freshness and engagement. Updates
            automatically as new records arrive.
          </p>
        </div>
      </div>

      {/* Tabs: For You / Trending */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs w-fit">
        {(
          [
            { id: 'for-you' as FeedTab, label: 'For You', icon: Sparkles },
            { id: 'trending' as FeedTab, label: 'Trending', icon: Flame },
          ]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setVisibleCount(PAGE_SIZE)
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              tab === id ? 'bg-[#0F4C81] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setCategory(cat.id)
              setVisibleCount(PAGE_SIZE)
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              category === cat.id
                ? 'bg-sky-50 border-[#0F4C81]/30 text-[#0F4C81]'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {isLoading && observations.length === 0 && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/90 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-56 bg-slate-200 rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Feed cards */}
      {visible.length > 0 ? (
        <div className="space-y-5">
          {visible.map((obs) => {
            const key = String(obs.id)
            const isLiked = likedMap[key] ?? obs.liked_by_me ?? false
            const observerName = obs.observer_name || 'Community Observer'
            const avatar =
              obs.observer_avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(observerName)}`
            return (
              <article
                key={key}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <img
                    src={avatar}
                    alt={observerName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(observerName)}`
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{observerName}</p>
                      {obs.status === 'verified' && (
                        <BadgeCheck size={14} className="text-emerald-500 shrink-0" aria-label="Verified" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{obs.site_name}</span>
                      <span>·</span>
                      <span className="shrink-0">{timeAgo(obs.created_at)}</span>
                    </p>
                  </div>
                </div>

                {/* Media (real observation photo, or branded signal panel) */}
                <button
                  type="button"
                  onClick={() => openObservationDetail(obs)}
                  className="block w-full cursor-pointer"
                >
                  <FeedMedia obs={obs} />
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 px-3 pt-3">
                  <button
                    type="button"
                    onClick={() => handleLike(obs)}
                    disabled={busyId === key}
                    aria-pressed={isLiked}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                      isLiked ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                    {obs.like_count ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => openObservationDetail(obs)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    {obs.comment_count ?? 0}
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400">
                    <Eye size={16} />
                    {obs.views_count ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShare(obs)}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>

                {/* Caption + stats */}
                <div className="px-4 pb-4 pt-1 space-y-2" onClick={() => openObservationDetail(obs)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SignalBadge signal={obs.signal} size="sm" />
                    {obs.location_address && (
                      <span className="text-[11px] text-slate-400 truncate">{obs.location_address}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                    <span className="font-bold text-slate-900 mr-1">{obs.site_name.split(' ').slice(0, 2).join(' ')}:</span>
                    {obs.ai_summary || obs.notes || 'Observation recorded for community review.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openObservationDetail(obs)}
                    className="text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
                  >
                    View observation & analytics →
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center">
            <Newspaper size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700 mt-3">No observations in this category yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Try another category, or submit a field observation to start the feed.
            </p>
          </div>
        )
      )}

      {/* Load more */}
      {visibleCount < items.length && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0F4C81] bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Loader2 size={15} className="hidden" />
            Load more ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

export default FeedView
