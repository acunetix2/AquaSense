import React, { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  Heart,
  MessageSquare,
  Eye,
  Droplets,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { fetchMyProfile, type PublicProfileData } from '../../services/api'
import { SignalBadge } from '../common/SignalBadge'
import type { Observation } from '../../types/observation'

const engagementScore = (obs: Observation): number =>
  (obs.views_count ?? 0) + (obs.like_count ?? 0) + (obs.comment_count ?? 0)

export const EngagementDashboard: React.FC = () => {
  const { user } = useAuth()
  const { observations, openObservationDetail } = useApp()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    fetchMyProfile(user.id).then((p) => {
      if (mounted) {
        setProfile(p)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-10 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 size={18} className="animate-spin text-[#0F4C81]" />
        <span className="text-sm font-semibold">Loading your engagement stats…</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Profile not found</p>
        <p className="text-xs text-slate-400 mt-1">Sign in again to see your engagement dashboard.</p>
      </div>
    )
  }

  const myObs = observations.filter((obs) => user?.id && obs.user_id === user.id)
  const topObservations = [...myObs].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 5)

  const cards: { icon: React.ElementType; label: string; value: number; hint: string }[] = [
    { icon: Users, label: 'Followers', value: profile.followers_count, hint: 'People following you' },
    { icon: UserPlus, label: 'Following', value: profile.following_count, hint: 'Observers you follow' },
    { icon: Heart, label: 'Profile Likes', value: profile.likes_received, hint: 'Likes on your profile' },
    { icon: MessageSquare, label: 'Comments Received', value: profile.comments_received ?? 0, hint: 'On your observations' },
    { icon: Eye, label: 'Observation Views', value: profile.views_received ?? 0, hint: 'Unique views on your work' },
    { icon: Droplets, label: 'Observations', value: myObs.length, hint: 'You have submitted' },
  ]

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ icon: Icon, label, value, hint }) => (
          <div
            key={label}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Icon size={14} className="text-[#0F4C81]" />
              <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      {/* Top observations by engagement */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <TrendingUp size={16} className="text-[#0F4C81]" />
          <h3 className="text-sm font-bold text-slate-900">Your Top Observations</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-semibold">by engagement</span>
        </div>

        {topObservations.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            No observations yet — submit your first field observation to start building engagement.
          </p>
        ) : (
          <div className="space-y-2">
            {topObservations.map((obs) => (
              <button
                key={String(obs.id)}
                type="button"
                onClick={() => openObservationDetail(obs)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-white transition-colors cursor-pointer text-left"
              >
                <SignalBadge signal={obs.signal} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{obs.site_name}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(obs.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 shrink-0">
                  <span className="inline-flex items-center gap-1" title="Views">
                    <Eye size={13} className="text-slate-400" />
                    {obs.views_count ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Likes">
                    <Heart size={13} className="text-slate-400" />
                    {obs.like_count ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Comments">
                    <MessageSquare size={13} className="text-slate-400" />
                    {obs.comment_count ?? 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Engagement stats are informational counts (follows, likes, comments, unique views).
        They do not affect signal strength or verification status — review decisions are made
        by certified reviewers based on evidence.
      </p>
    </div>
  )
}

export default EngagementDashboard
