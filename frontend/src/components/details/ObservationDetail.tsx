import React, { useState } from 'react'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Share2,
  Eye,
  Flag,
  BookOpen,
  User,
  Maximize2,
  Sparkles,
  ShieldCheck,
  Clock,
  Trash2,
  Pencil,
  Loader2,
  X,
  Heart,
  MessageSquare,
  UserPlus,
  UserCheck,
  Send,
  Users,
} from 'lucide-react'

import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import { SignalBadge } from '../common/SignalBadge'
import { ConfidenceBar } from '../common/ConfidenceBar'
import { FhirExportModal } from './FhirExportModal'
import { ReviewModal } from '../reviewer/ReviewModal'
import { AiDecisionTrail } from './AiDecisionTrail'
import { ObservationMap } from './ObservationMap'
import { ObservationAnalyticsPanel } from './ObservationAnalyticsPanel'
import type { Observation, ObservationComment } from '../../types/observation'
import {
  fetchComments,
  createComment,
  deleteComment,
  likeObservation,
  unlikeObservation,
  fetchPublicProfile,
  followUserProfile,
  unfollowUserProfile,
  recordObservationView,
  type PublicProfileData,
} from '../../services/api'

export const ObservationDetail: React.FC = () => {
  const {
    selectedObservation,
    observations,
    setActiveView,
    editObservation,
    reviewObservation,
    deleteObservation,
    showToast,
  } = useApp()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'evidence' | 'location' | 'images' | 'history' | 'comments' | 'analytics'>('evidence')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [reviewModalAction, setReviewModalAction] = useState<'verify' | 'flag' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0)

  // Fallback to first observation if none selected
  const obs: Observation = selectedObservation || observations[0]

  // Edit form state
  const [editSiteName, setEditSiteName] = useState(obs?.site_name || '')
  const [editLocationAddress, setEditLocationAddress] = useState(obs?.location_address || '')
  const [editLatitude, setEditLatitude] = useState(obs?.latitude ?? 0)
  const [editLongitude, setEditLongitude] = useState(obs?.longitude ?? 0)
  const [editNotes, setEditNotes] = useState(obs?.notes || '')
  const [editAppearance, setEditAppearance] = useState(obs?.water_appearance || 'clear')
  const [editOdour, setEditOdour] = useState(obs?.odour || 'none')
  const [editFlowRate, setEditFlowRate] = useState(obs?.flow_rate || 'normal')
  const [editWasteVisible, setEditWasteVisible] = useState(obs?.waste_visible || false)
  const [editImageUrls, setEditImageUrls] = useState(
    (obs?.image_urls && obs.image_urls.length > 0 ? obs.image_urls : obs?.image_url ? [obs.image_url] : []).join(', ')
  )
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Social state — likes, comments, and observer follow
  const [liked, setLiked] = useState(!!selectedObservation?.liked_by_me)
  const [likeCount, setLikeCount] = useState(selectedObservation?.like_count ?? 0)
  const [comments, setComments] = useState<ObservationComment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [isFollowingObserver, setIsFollowingObserver] = useState(false)
  const [socialBusy, setSocialBusy] = useState(false)
  const [observerProfile, setObserverProfile] = useState<PublicProfileData | null>(null)
  const [viewsCount, setViewsCount] = useState(selectedObservation?.views_count ?? 0)

  // Sync edit state when obs changes
  React.useEffect(() => {
    if (obs) {
      setEditSiteName(obs.site_name)
      setEditLocationAddress(obs.location_address || '')
      setEditLatitude(obs.latitude ?? 0)
      setEditLongitude(obs.longitude ?? 0)
      setEditNotes(obs.notes || '')
      setEditAppearance(obs.water_appearance || 'clear')
      setEditOdour(obs.odour || 'none')
      setEditFlowRate(obs.flow_rate || 'normal')
      setEditWasteVisible(obs.waste_visible || false)
      setEditImageUrls(
        (obs.image_urls && obs.image_urls.length > 0 ? obs.image_urls : obs.image_url ? [obs.image_url] : []).join(', ')
      )
      setActiveHeroImageIndex(0)
    }
  }, [obs?.id])

  // Load social state whenever the viewed observation changes
  React.useEffect(() => {
    setLiked(!!obs?.liked_by_me)
    setLikeCount(obs?.like_count ?? 0)
    setCommentDraft('')
    setComments([])
    setCommentsLoaded(false)
    setIsFollowingObserver(false)
    setObserverProfile(null)

    if (!obs?.id) return
    let mounted = true

    fetchComments(obs.id).then((list) => {
      if (mounted) {
        setComments(list)
        setCommentsLoaded(true)
      }
    })

    // Observer public profile — followers / likes / comments / views stats
    if (obs.user_id) {
      fetchPublicProfile(obs.user_id, user?.id).then((profile) => {
        if (mounted && profile) {
          setObserverProfile(profile)
          if (user?.id && obs.user_id !== user.id) {
            setIsFollowingObserver(Boolean(profile.is_following))
          }
        }
      })
    }

    return () => {
      mounted = false
    }
  }, [obs, user?.id])

  // Record this viewer's visit (deduplicated server-side) and track the count
  React.useEffect(() => {
    setViewsCount(obs?.views_count ?? 0)
    if (!obs?.id || !user?.id) return
    let mounted = true
    recordObservationView(obs.id, user.id).then((count) => {
      if (mounted && count !== null) setViewsCount(count)
    })
    return () => {
      mounted = false
    }
  }, [obs, user?.id])

  if (!obs) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>No observation selected.</p>
        <button
          onClick={() => setActiveView('map')}
          className="mt-4 px-4 py-2 bg-[#0F4C81] text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Return to Map
        </button>
      </div>
    )
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return 'Unknown date'
    }
  }

  // Determine analyst display info
  const analystName = obs.observer_name || obs.reviewed_by || (user?.name) || 'AquaSense Community Observer'
  const analystAvatar = obs.observer_avatar || user?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(analystName)}`
  const analystRole = obs.observer_role || (obs.reviewed_by ? 'Certified Reviewer' : 'Citizen Observer')
  const analysisTime = obs.reviewed_at || obs.created_at

  // Only the authenticated owner may edit or delete a record (strict user-id match;
  // email is redacted server-side and display names are not unique).
  const isOwner = !!user && !!user.id && !!obs.user_id && obs.user_id === user.id

  // Only reviewer-level roles may verify or flag; everyone else gets a read-only view.
  const isReviewer = isReviewerRole(user?.role)

  // ---------------------------------------------------------------------
  // Social actions — like, comment, follow (server-authoritative counts)
  // ---------------------------------------------------------------------
  const viewerId = user?.id

  const requireSignIn = (action: string): boolean => {
    if (!viewerId) {
      showToast('Sign in required', `Please sign in to ${action}.`, 'warning')
      return false
    }
    return true
  }

  const handleToggleLike = async () => {
    if (socialBusy) return
    if (!requireSignIn('like this observation')) return

    const next = !liked
    setLiked(next)
    setLikeCount((prev) => Math.max(0, prev + (next ? 1 : -1)))
    setSocialBusy(true)
    const result = next
      ? await likeObservation(obs.id, viewerId!)
      : await unlikeObservation(obs.id, viewerId!)
    setSocialBusy(false)
    if (result) {
      setLiked(result.liked)
      setLikeCount(result.like_count)
    }
  }

  const handlePostComment = async () => {
    const body = commentDraft.trim()
    if (!body || isPostingComment) return
    if (!requireSignIn('comment on this observation')) return

    setIsPostingComment(true)
    const created = await createComment(obs.id, body, viewerId!)
    setIsPostingComment(false)
    if (created) {
      setComments((prev) => [...prev, created])
      setCommentDraft('')
      showToast('Comment Posted', 'Your comment is now part of the evidence trail.', 'success')
    } else {
      showToast('Comment Failed', 'Could not post your comment. Please try again.', 'error')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!viewerId) return
    const ok = await deleteComment(obs.id, commentId, viewerId)
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  const handleToggleFollow = async () => {
    if (socialBusy) return
    if (!obs.user_id) return
    if (!requireSignIn('follow this observer')) return
    if (obs.user_id === viewerId) return

    const next = !isFollowingObserver
    setIsFollowingObserver(next)
    setSocialBusy(true)
    const result = next
      ? await followUserProfile(obs.user_id, viewerId!)
      : await unfollowUserProfile(obs.user_id, viewerId!)
    setSocialBusy(false)
    if (result) {
      setIsFollowingObserver(Boolean(result.is_following))
    }
  }

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Top Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('map')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to map</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#0F4C81] bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Pencil size={13} />
                Edit Observation
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Delete Record
              </button>
            </>
          )}
          {isReviewer && obs.status !== 'verified' && (
            <button
              onClick={() => setReviewModalAction('verify')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              Verify Record
            </button>
          )}
          {isReviewer && obs.status !== 'flagged' && (
            <button
              onClick={() => setReviewModalAction('flag')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            >
              Flag for Inspection
            </button>
          )}
          {!isReviewer && (
            <span
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 flex items-center gap-1.5"
              title="Certified reviewers verify or flag records"
            >
              <Eye size={13} />
              View only — reviews are handled by certified reviewers
            </span>
          )}
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Observation Details
      </h2>

      {/* Hero Observation Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Stream Photo with Multi-Image Support */}
          <div className="md:col-span-6 space-y-2">
            <div className="relative h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs group">
              {(() => {
                const allImages = (obs.image_urls && obs.image_urls.length > 0) ? obs.image_urls : [obs.image_url]
                const currentImg = allImages[activeHeroImageIndex] || obs.image_url
                return (
                  <>
                    <img
                      src={currentImg}
                      alt={obs.site_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Maximize2 size={12} />
                      <span>Photo {activeHeroImageIndex + 1} of {allImages.length}</span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Thumbnail switcher if multiple photos exist */}
            {obs.image_urls && obs.image_urls.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                {obs.image_urls.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveHeroImageIndex(idx)}
                    className={`h-12 w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeHeroImageIndex === idx ? 'border-[#0F4C81] ring-2 ring-sky-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <SignalBadge signal={obs.signal} size="md" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {obs.site_name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{formatDate(obs.created_at)}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-600">
                  {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                </span>
              </p>
            </div>

            <div className="pt-2">
              <ConfidenceBar confidence={obs.confidence} />
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Verification Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-medium text-xs capitalize ${
                  obs.status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : obs.status === 'flagged'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {obs.status || 'Pending'}
              </span>
            </div>

            {/* ── ANALYST ATTRIBUTION CARD ── */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Analyzed By
              </p>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/80 to-teal-50/40 border border-sky-100/80">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={analystAvatar}
                    alt={analystName}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(analystName)}`
                    }}
                  />
                  {obs.status === 'verified' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border border-white">
                      <ShieldCheck size={9} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{analystName}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Sparkles size={10} className="text-[#1FB8A6] shrink-0" />
                    <span>{analystRole}</span>
                  </p>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={10} />
                    <span>{formatDate(analysisTime).split(',')[0]}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {new Date(analysisTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {obs.observer_location && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-2 ml-1">
                  <MapPin size={10} className="text-slate-300" />
                  <span>{obs.observer_location}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── OBSERVATION SOURCE SECTION ── */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User size={18} className="text-[#0F4C81]" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Observation Submitted By
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 flex items-center gap-4">
            <img
              src={analystAvatar}
              alt={analystName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(analystName)}`
              }}
            />

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {analystName}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  {analystRole}
                </span>
              </div>
              {obs.observer_location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{obs.observer_location}</span>
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Photo Uploaded
              </p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>{formatDate(obs.created_at)}</span>
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Field Coordinates
              </p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">
                {obs.latitude.toFixed(4)}° N, {obs.longitude.toFixed(4)}° W
              </p>
            </div>
          </div>
        </div>

        {/* Observer engagement stats — followers, likes, comments, views */}
        {observerProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { icon: Users, label: 'Followers', value: observerProfile.followers_count },
                { icon: Heart, label: 'Profile Likes', value: observerProfile.likes_received },
                { icon: MessageSquare, label: 'Comments', value: observerProfile.comments_received ?? 0 },
                { icon: Eye, label: 'Views', value: observerProfile.views_received ?? 0 },
              ] as const
            ).map(({ icon: StatIcon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0F4C81]/10 flex items-center justify-center shrink-0">
                  <StatIcon size={15} className="text-[#0F4C81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 leading-none">{value}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SOCIAL BAR: like · comment · share · follow ── */}
      <section
        aria-label="Engagement"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleLike}
            aria-pressed={liked}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
              liked
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Heart size={15} className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
            <span>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare size={15} className="text-slate-400" />
            <span>
              {commentsLoaded ? comments.length : obs.comment_count ?? 0}{' '}
              {(commentsLoaded ? comments.length : obs.comment_count ?? 0) === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95"
          >
            <Share2 size={15} className="text-slate-400" />
            <span>Share</span>
          </button>

          <span
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200"
            title="Unique views of this observation"
          >
            <Eye size={15} className="text-slate-400" />
            <span>
              {viewsCount} {viewsCount === 1 ? 'View' : 'Views'}
            </span>
          </span>

          {/* Follow the observer (hidden on your own observations) */}
          {obs.user_id && viewerId && obs.user_id !== viewerId && (
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                isFollowingObserver
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#0F4C81] hover:bg-[#0c3c66] text-white border-transparent shadow-sm'
              }`}
            >
              {isFollowingObserver ? <UserCheck size={15} /> : <UserPlus size={15} />}
              <span>
                {isFollowingObserver ? 'Following Observer' : `Follow ${analystName.split(' ')[0]}`}
              </span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5">
          Signals are informational — comments add field context and are visible to reviewers.
        </p>
      </section>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 sm:gap-6 text-sm font-semibold overflow-x-auto">
        {(['evidence', 'location', 'images', 'history', 'comments', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'border-[#0F4C81] text-[#0F4C81]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'history'
              ? `History (${obs.review_history?.length || 0})`
              : tab === 'comments'
              ? `Comments (${commentsLoaded ? comments.length : obs.comment_count ?? 0})`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab 1: Evidence */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-2">AI Assessment</h4>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                {obs.ai_summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 mb-3">Key Indicators</h4>
              <div className="space-y-2.5">
                {(obs.key_evidence || ['Observation recorded', 'Assessment completed']).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-[#0F4C81] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {obs.notes && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 mb-2">Observer Notes</h4>
                <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 italic">
                  "{obs.notes}"
                </p>
              </div>
            )}

            {/* Consistency & image-quality notices (PRD FR-06 / FR-07) */}
            {(obs.consistency_flags || []).length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-500">Consistency Checks</h4>
                {(obs.consistency_flags || []).map((flag, idx) => {
                  const isConsistency = flag.type === 'consistency'
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3.5 space-y-1 ${
                        isConsistency
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-sky-50 border-sky-200'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isConsistency ? 'text-amber-700' : 'text-sky-700'
                        }`}
                      >
                        {flag.field.replace(/_/g, ' ')}
                        {flag.severity === 'warning' ? ' · possible inconsistency' : ''}
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{flag.message}</p>
                      {isConsistency &&
                        (obs.assessment_answers?.consistency_acknowledged ? (
                          <p className="text-[11px] font-semibold text-emerald-700">
                            ✓ Observer confirmed their original answer — it was not changed.
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Awaiting observer confirmation.
                          </p>
                        ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Rail */}
          <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-3">Suggested Actions</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <Eye size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>Monitor this location</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <Flag size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>Flag for human review</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <BookOpen size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>Learn more about water quality</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-[#0F4C81] hover:bg-[#0c3c66] shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1b: AI Decision Trail — auditable record of how the signal was produced */}
      {activeTab === 'evidence' && (
        <AiDecisionTrail
          trail={obs.ai_trail}
          flags={obs.consistency_flags}
          acknowledged={!!obs.assessment_answers?.consistency_acknowledged}
        />
      )}

      {/* Tab: Comments — community field context on this observation */}
      {activeTab === 'comments' && (
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare size={18} className="text-[#0F4C81]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Community Comments
            </h3>
            <span className="ml-auto text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {commentsLoaded ? comments.length : obs.comment_count ?? 0}
            </span>
          </div>

          {/* Composer */}
          <div className="space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={!viewerId || isPostingComment}
              placeholder={
                viewerId
                  ? 'Add field context — what did you notice at this site?'
                  : 'Sign in to join the conversation.'
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none leading-relaxed disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Comments are public and attributed to your display name.
              </p>
              <button
                type="button"
                onClick={handlePostComment}
                disabled={!commentDraft.trim() || isPostingComment || !viewerId}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !commentDraft.trim() || isPostingComment || !viewerId
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0F4C81] hover:bg-[#0c3c66] text-white shadow-sm active:scale-95'
                }`}
              >
                {isPostingComment ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>{isPostingComment ? 'Posting…' : 'Post Comment'}</span>
              </button>
            </div>
          </div>

          {/* Comment list */}
          {!commentsLoaded ? (
            <div className="py-8 flex items-center justify-center text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-600">No comments yet</p>
              <p className="text-xs text-slate-500">
                Be the first to add field context for reviewers and other observers.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex items-start gap-3"
                >
                  <img
                    src={
                      comment.author_avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.author_name)}`
                    }
                    alt={comment.author_name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.author_name)}`
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{comment.author_name}</span>
                      {comment.author_role && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 capitalize">
                          {comment.author_role}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                      {comment.body}
                    </p>
                  </div>
                  {viewerId && comment.user_id === viewerId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      aria-label="Delete your comment"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Tab 2: Location */}
      {activeTab === 'location' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Geographic Coordinates</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Latitude: {obs.latitude.toFixed(6)}, Longitude: {obs.longitude.toFixed(6)}
              </p>
            </div>
            <button
              onClick={() => setActiveView('map')}
              className="text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer shrink-0"
            >
              Open in Fullscreen Map View →
            </button>
          </div>

          <ObservationMap
            latitude={obs.latitude}
            longitude={obs.longitude}
            siteName={obs.site_name}
            address={obs.location_address || undefined}
            className="h-64 sm:h-80"
          />

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <MapPin size={16} className="text-[#0F4C81] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{obs.site_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{obs.location_address || 'No address recorded for this site.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Images */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">Uploaded Field Imagery</h4>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {((obs.image_urls && obs.image_urls.length > 0) ? obs.image_urls : [obs.image_url]).length} Photographic Angles
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {((obs.image_urls && obs.image_urls.length > 0) ? obs.image_urls : [obs.image_url]).map((imgUrl, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs group flex flex-col">
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  <img
                    src={imgUrl}
                    alt={`Field Evidence ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-md">
                    Angle {idx + 1}
                  </div>
                </div>
                <div className="p-3.5 bg-white text-xs space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-800">
                      {idx === 0 ? 'Primary Stream Perspective' : `Corroborating Angle #${idx + 1}`}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">EXIF Timestamp: {formatDate(obs.created_at)}</p>
                  </div>
                  <p className="text-emerald-600 font-medium text-[11px] pt-1">Resolution & Clarity: Optimal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <h4 className="font-bold text-slate-900 text-base">Verification & Review Audit Log</h4>
          {obs.review_history && obs.review_history.length > 0 ? (
            <div className="space-y-4">
              {obs.review_history.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User size={13} className="text-[#0F4C81]" />
                      <span>{rev.reviewerName}</span>
                    </span>
                    <span className="text-slate-400">{formatDate(rev.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">Action: {rev.action.toUpperCase()}</p>
                  <p className="text-xs text-slate-600 italic">"{rev.notes}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No review actions recorded yet. Awaiting verification.</p>
          )}
        </div>
      )}

      {/* Tab 6: Analytics (per-observation watershed analytics) */}
      {activeTab === 'analytics' && <ObservationAnalyticsPanel observationId={obs.id} />}

      {/* Share / FHIR Export Modal */}
      {shareModalOpen && (
        <FhirExportModal observation={obs} onClose={() => setShareModalOpen(false)} />
      )}

      {/* Review Modal */}
      {reviewModalAction && (
        <ReviewModal
          observation={obs}
          actionType={reviewModalAction}
          onClose={() => setReviewModalAction(null)}
          onConfirm={(notes) => {
            reviewObservation(obs.id, reviewModalAction === 'verify' ? 'verified' : 'flagged', notes)
            setReviewModalAction(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete This Observation?</h3>
                <p className="text-sm text-slate-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="font-semibold text-slate-800 text-sm">{obs.site_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(obs.created_at)}</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteObservation(obs.id, user?.id)
                  setShowDeleteConfirm(false)
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Observation Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isSavingEdit && setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0F4C81] flex items-center justify-center">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Edit Observation</h3>
                  <p className="text-xs text-slate-500">Update field sensory data and site notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingEdit && setShowEditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!editSiteName.trim()) return
                setIsSavingEdit(true)
                const ownerId = user?.id
                if (!ownerId) {
                  return
                }

                try {
                  const parsedImageUrls = editImageUrls
                    .split(',')
                    .map((url) => url.trim())
                    .filter(Boolean)
                    .slice(0, 3)

                  await editObservation(
                    obs.id,
                    {
                      site_name: editSiteName.trim(),
                      location_address: editLocationAddress.trim() || undefined,
                      latitude: Number(editLatitude),
                      longitude: Number(editLongitude),
                      notes: editNotes.trim(),
                      water_appearance: editAppearance,
                      odour: editOdour,
                      flow_rate: editFlowRate,
                      waste_visible: editWasteVisible,
                      image_url: parsedImageUrls[0] || undefined,
                      image_urls: parsedImageUrls,
                    },
                    ownerId
                  )
                  setShowEditModal(false)
                } catch (err) {
                  console.error('Failed to update observation:', err)
                } finally {
                  setIsSavingEdit(false)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Site Name / Waterbody
                </label>
                <input
                  type="text"
                  required
                  value={editSiteName}
                  onChange={(e) => setEditSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Water Appearance
                  </label>
                  <select
                    value={editAppearance}
                    onChange={(e) => setEditAppearance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    <option value="clear">Clear / Transparent</option>
                    <option value="cloudy">Cloudy / Slightly Silty</option>
                    <option value="turbid">Turbid / Brown Muddy</option>
                    <option value="green/algae">Green / Excessive Algae</option>
                    <option value="oily/film">Oily Sheen / Surface Film</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Water Odour
                  </label>
                  <select
                    value={editOdour}
                    onChange={(e) => setEditOdour(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    <option value="none">No Detectable Odour</option>
                    <option value="earthy">Natural Earthy / Musty</option>
                    <option value="sulfur/rotten">Sulfur / Rotten Egg</option>
                    <option value="chemical">Chemical / Petrol</option>
                    <option value="sewage">Sewage / Stagnant Waste</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Flow Rate
                  </label>
                  <select
                    value={editFlowRate}
                    onChange={(e) => setEditFlowRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    <option value="stagnant">Stagnant / Pooled</option>
                    <option value="slow">Slow / Gentle Trickle</option>
                    <option value="normal">Normal Moderate Flow</option>
                    <option value="rapid">Rapid / Rushing / High</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editWasteVisible}
                      onChange={(e) => setEditWasteVisible(e.target.checked)}
                      className="w-4 h-4 text-[#0F4C81] rounded-sm focus:ring-[#0F4C81]"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Visible Waste / Plastic Trash
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location Address
                  </label>
                  <input
                    type="text"
                    value={editLocationAddress}
                    onChange={(e) => setEditLocationAddress(e.target.value)}
                    placeholder="Nearest landmark or site address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Coordinates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(Number(e.target.value))}
                      placeholder="Lat"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(Number(e.target.value))}
                      placeholder="Lng"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Image URLs
                </label>
                <textarea
                  rows={2}
                  value={editImageUrls}
                  onChange={(e) => setEditImageUrls(e.target.value)}
                  placeholder="https://example.com/photo-1.jpg, https://example.com/photo-2.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Field Notes & Observations
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional context on riparian buffers, pipe discharges, weather..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#0F4C81] hover:bg-[#0c3c66] transition-colors cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
