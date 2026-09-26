import React, { useEffect, useState } from 'react'
import {
  Eye,
  Heart,
  MessageSquare,
  Activity,
  ShieldCheck,
  Flag,
  Database,
  MapPin,
  User,
} from 'lucide-react'
import { fetchObservationAnalytics, type ObservationAnalytics } from '../../services/api'

const card = 'bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6'
const sub = 'rounded-2xl bg-slate-50 border border-slate-100 p-4'

export const ObservationAnalyticsPanel: React.FC<{ observationId: number | string }> = ({
  observationId,
}) => {
  const [state, setState] = useState<{
    id: number | string
    data: ObservationAnalytics | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchObservationAnalytics(observationId).then((result) => {
      if (!cancelled) setState({ id: observationId, data: result })
    })
    return () => {
      cancelled = true
    }
  }, [observationId])

  const isLoading = state?.id !== observationId
  const data = state?.id === observationId ? state.data : null

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="h-40 bg-white rounded-3xl border border-slate-200" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className={card}>
        <p className="text-sm font-bold text-slate-600">Analytics unavailable</p>
        <p className="text-xs text-slate-400 mt-1">
          Could not load analytics for this observation. Please retry later.
        </p>
      </div>
    )
  }

  const aiEntries = Object.entries(data.ai ?? {}).slice(0, 8)

  return (
    <div className="space-y-4">
      {/* Engagement */}
      <section aria-label="Engagement analytics" className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#0F4C81]" />
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Observation Analytics
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Views', value: data.engagement.views, icon: Eye },
            { label: 'Likes', value: data.engagement.likes, icon: Heart },
            { label: 'Comments', value: data.engagement.comments, icon: MessageSquare },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center rounded-2xl bg-slate-50 border border-slate-100 py-4">
              <Icon size={16} className="mx-auto text-[#0F4C81]" />
              <p className="text-xl font-extrabold text-slate-900 mt-1.5">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div className={sub}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI Confidence
            </p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">
              {Math.round(data.confidence)}%
            </p>
          </div>
          <div className={sub}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1 capitalize">{data.status}</p>
          </div>
          <div className={sub}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Consistency Flags
            </p>
            <p className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              {data.consistency_flag_count}
              {data.consistency_flag_count > 0 && (
                <Flag size={14} className="text-amber-500" />
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Region context: how this observation sits within its site cohort */}
      {data.region && (
        <section aria-label="Regional context" className={card}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[#0F4C81]" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Regional Context — {data.region.site_name}
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={sub}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Observations at Site
              </p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {data.region.total_at_site}
              </p>
            </div>
            <div className={sub}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Site Avg Confidence
              </p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {Math.round(data.region.avg_confidence)}%
              </p>
            </div>
            <div className={sub}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Engagement Rank
              </p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                #{data.region.engagement_rank ?? '–'}
                <span className="text-xs font-semibold text-slate-400 ml-1">
                  of {data.region.total_at_site}
                </span>
              </p>
            </div>
            <div className={sub}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Verified at Site
              </p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
                <ShieldCheck size={16} />
                {data.region.verified}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-slate-600">
            <span className="text-emerald-600">● Normal {data.region.normal}</span>
            <span className="text-amber-600">● Watch {data.region.watch}</span>
            <span className="text-rose-600">● Investigate {data.region.investigate}</span>
          </div>
        </section>
      )}

      {/* Trusted-source site baseline + AI decision meta */}
      <div className="grid md:grid-cols-2 gap-4">
        <section aria-label="Trusted source context" className={card}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-[#0F4C81]" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Trusted Source Baseline
            </h3>
          </div>
          {data.site_context ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 capitalize">
                  {data.site_context.baseline_quality} baseline
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {data.site_context.basin_name}
                </span>
              </div>
              {data.site_context.description && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {data.site_context.description}
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-semibold">
                Matched trusted monitoring station: {data.site_context.site_name}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No trusted monitoring station matches this location yet. The observation still
              contributes to community trend analysis for this site.
            </p>
          )}
        </section>

        <section aria-label="AI decision meta" className={card}>
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-[#0F4C81]" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              How This Signal Was Produced
            </h3>
          </div>
          {aiEntries.length > 0 ? (
            <dl className="space-y-1.5">
              {aiEntries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3 text-xs">
                  <dt className="text-slate-400 font-semibold capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-slate-700 font-bold text-right max-w-[60%] break-words">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No AI trail metadata was recorded for this observation. Signal rationale is shown in
              the Evidence tab.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default ObservationAnalyticsPanel
