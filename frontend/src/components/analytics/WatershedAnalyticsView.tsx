import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Waves,
  Activity,
  MapPin,
  ShieldCheck,
  ChevronDown,
  Eye,
  Users,
  Info,
  Database,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { SignalBadge } from '../common/SignalBadge'
import {
  fetchLiveAnalytics,
  fetchRegionAnalytics,
  type LiveAnalytics,
  type RegionAnalytics,
} from '../../services/api'

const signalPill: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-50 text-amber-700 border-amber-200',
  investigate: 'bg-rose-50 text-rose-700 border-rose-200',
}

const baselinePill: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-50 text-amber-700 border-amber-200',
  investigate: 'bg-rose-50 text-rose-700 border-rose-200',
}

const sectionTitle = 'text-lg font-extrabold text-slate-900 tracking-tight'
const card = 'bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6'

// ---------------------------------------------------------------------------
// Tiny inline SVG trend line (no chart dependency)
// ---------------------------------------------------------------------------
const TrendLine: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (values.length < 2) return null
  const w = 320
  const h = 80
  const pad = 6
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1)
      const y = h - pad - ((v - min) * (h - pad * 2)) / span
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" role="img" aria-label="Trend line">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / (values.length - 1)
        const y = h - pad - ((v - min) * (h - pad * 2)) / span
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      })}
    </svg>
  )
}

export const WatershedAnalyticsView: React.FC = () => {
  const { observations, openObservationDetail, showToast } = useApp()

  const [overview, setOverview] = useState<LiveAnalytics | null>(null)
  const [regions, setRegions] = useState<RegionAnalytics | null>(null)
  const [failed, setFailed] = useState(false)
  const [expandedSite, setExpandedSite] = useState<string | null>(null)

  const applyResult = useCallback((ov: LiveAnalytics | null, rg: RegionAnalytics | null): boolean => {
    setOverview(ov)
    setRegions(rg)
    const ok = Boolean(ov || rg)
    setFailed(!ok)
    return ok
  }, [])

  // Initial load + silent background revalidation (focus / visibility / 60s).
  useEffect(() => {
    let cancelled = false
    const load = async (announce: boolean) => {
      const [ov, rg] = await Promise.all([fetchLiveAnalytics(), fetchRegionAnalytics()])
      if (cancelled) return
      const ok = applyResult(ov, rg)
      if (!ok && announce) {
        showToast('Analytics Unavailable', 'Could not reach the analytics service. Please retry.', 'error')
      }
    }
    void load(true)
    const revalidate = () => {
      if (document.visibilityState !== 'hidden') void load(false)
    }
    const timer = window.setInterval(revalidate, 60_000)
    window.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
    }
  }, [applyResult, showToast])

  const isLoading = !overview && !regions && !failed

  const healthValues = useMemo(
    () => (regions?.basin_snapshots ?? []).map((s) => s.health_index_score),
    [regions]
  )
  const verifiedValues = useMemo(
    () => (regions?.basin_snapshots ?? []).map((s) => Math.round(s.verified_rate * 100)),
    [regions]
  )
  const latestSnapshot = regions?.basin_snapshots?.[regions.basin_snapshots.length - 1]

  const siteObservations = useMemo(() => {
    if (!expandedSite) return []
    return observations.filter((o) => o.site_name === expandedSite)
  }, [observations, expandedSite])

  const totalLocationObs = regions?.locations.reduce((sum, l) => sum + l.total, 0) ?? 0

  if (isLoading && !regions) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-slate-200" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-3xl border border-slate-200" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Waves size={24} className="text-[#0284C7]" />
            Watershed Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Citizen observations, trusted monitoring sources, and regional trends — combined in one
            view. Refreshes automatically in the background.
          </p>
        </div>
      </div>

      {/* ── 1. Platform overview ── */}
      <section aria-label="Platform overview" className={card}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={17} className="text-[#0284C7]" />
          <h2 className={sectionTitle}>Observation Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Observations', value: overview?.total_observations ?? 0, icon: Eye },
            { label: 'Verified', value: overview?.verified_count ?? 0, icon: ShieldCheck },
            { label: 'Active Observers', value: overview?.active_observers ?? 0, icon: Users },
            {
              label: 'Water Health Index',
              value: `${overview?.water_health_index ?? 0}`,
              icon: TrendingUp,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-[#0284C7]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {overview && (
          <div className="mt-4">
            <div className="flex h-3 rounded-full overflow-hidden border border-slate-200">
              {(['normal', 'watch', 'investigate'] as const).map((sig) => {
                const count = overview.signals[sig]
                const pct = overview.total_observations
                  ? (count / overview.total_observations) * 100
                  : 0
                if (!pct) return null
                return (
                  <div
                    key={sig}
                    style={{ width: `${pct}%` }}
                    className={
                      sig === 'normal'
                        ? 'bg-emerald-400'
                        : sig === 'watch'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }
                    title={`${sig}: ${count}`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-2.5 text-xs font-semibold text-slate-600">
              <span className="text-emerald-600">● Normal {overview.signals.normal}</span>
              <span className="text-amber-600">● Watch {overview.signals.watch}</span>
              <span className="text-rose-600">● Investigate {overview.signals.investigate}</span>
              <span className="text-slate-400">
                Avg confidence {overview.average_confidence}%
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Per-location rollups (citizen observations) ── */}
      <section aria-label="Observations by location" className={card}>
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={17} className="text-[#0284C7]" />
          <h2 className={sectionTitle}>Citizen Observations by Location</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {regions?.locations.length ?? 0} sites · {totalLocationObs} observations. Tap a site to
          inspect individual observations.
        </p>

        {(regions?.locations.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <MapPin size={26} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600 mt-2">No observations yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Locations appear once citizens submit field observations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {regions?.locations.map((loc) => {
              const isExpanded = expandedSite === loc.site_name
              return (
                <div
                  key={loc.site_name}
                  className="rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSite(isExpanded ? null : loc.site_name)}
                    className="w-full flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{loc.site_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {loc.location_address || 'Address not recorded'}
                        {loc.last_observed &&
                          ` · last observed ${new Date(loc.last_observed).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {loc.normal > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${signalPill.normal}`}
                        >
                          {loc.normal} normal
                        </span>
                      )}
                      {loc.watch > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${signalPill.watch}`}
                        >
                          {loc.watch} watch
                        </span>
                      )}
                      {loc.investigate > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${signalPill.investigate}`}
                        >
                          {loc.investigate} investigate
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:block w-28">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>Confidence</span>
                        <span>{Math.round(loc.avg_confidence)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, loc.avg_confidence)}%` }}
                          className="h-full bg-[#0284C7] rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                      <span title="Views">
                        <Eye size={12} className="inline mr-0.5" />
                        {loc.views}
                      </span>
                      <span
                        title="Verified"
                        className="inline-flex items-center gap-0.5 text-emerald-600"
                      >
                        <ShieldCheck size={12} />
                        {loc.verified}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 space-y-2">
                      {siteObservations.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">
                          No observation records loaded for this site.
                        </p>
                      ) : (
                        siteObservations.map((obs) => (
                          <button
                            key={String(obs.id)}
                            type="button"
                            onClick={() => openObservationDetail(obs)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0284C7]/40 transition-colors cursor-pointer text-left"
                          >
                            <SignalBadge signal={obs.signal} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {obs.ai_summary || obs.notes || 'Field observation'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {obs.observer_name || 'Observer'} ·{' '}
                                {new Date(obs.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 shrink-0">
                              {Math.round(obs.confidence)}%
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 3. Trusted sources (scraped, sectionized by basin) ── */}
      <section aria-label="Trusted monitoring sources" className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Database size={17} className="text-[#0284C7]" />
          <h2 className={sectionTitle}>Trusted Monitoring Sources</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Curated regional monitoring stations, grouped by basin. These provide baseline context for
          citizen signals.
        </p>

        {(regions?.trusted_sections.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Database size={26} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600 mt-2">No trusted sources loaded</p>
            <p className="text-xs text-slate-400 mt-1">
              Regional monitoring stations will appear here once imported.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {regions?.trusted_sections.map((section) => (
              <div key={section.basin_name}>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#0284C7] mb-2">
                  {section.basin_name}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.sites.map((site) => (
                    <div
                      key={site.site_name}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{site.site_name}</p>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${
                            baselinePill[site.baseline_quality] ?? baselinePill.normal
                          }`}
                        >
                          {site.baseline_quality} baseline
                        </span>
                      </div>
                      {site.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{site.description}</p>
                      )}
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {site.catchment_area_sq_km != null &&
                          `${site.catchment_area_sq_km} km² catchment · `}
                        {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Regional basin trend ── */}
      <section aria-label="Regional basin trend" className={card}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={17} className="text-[#0284C7]" />
          <h2 className={sectionTitle}>Regional Basin Trend</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Rolling trusted-source snapshots — health index and verified-rate over time.
        </p>

        {(regions?.basin_snapshots.length ?? 0) < 2 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-xs text-slate-400">
              Not enough snapshot history yet — at least 2 days of data are needed to draw a trend.
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Health Index Score
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">
                  {latestSnapshot?.health_index_score ?? '–'}
                </p>
                <TrendLine values={healthValues} color="#0284C7" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Verified Rate
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">
                  {latestSnapshot ? `${Math.round(latestSnapshot.verified_rate * 100)}%` : '–'}
                </p>
                <TrendLine values={verifiedValues} color="#059669" />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4 font-bold">Date</th>
                    <th className="py-2 pr-4 font-bold">Samples</th>
                    <th className="py-2 pr-4 font-bold">Normal</th>
                    <th className="py-2 pr-4 font-bold">Watch</th>
                    <th className="py-2 pr-4 font-bold">Investigate</th>
                    <th className="py-2 font-bold">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(regions?.basin_snapshots ?? [])]
                    .slice(-7)
                    .reverse()
                    .map((snap, i) => (
                      <tr key={`${snap.snapshot_date}-${i}`} className="border-t border-slate-100">
                        <td className="py-2 pr-4 font-semibold text-slate-700">
                          {snap.snapshot_date}
                        </td>
                        <td className="py-2 pr-4 text-slate-500">{snap.total_samples}</td>
                        <td className="py-2 pr-4 text-emerald-600 font-semibold">
                          {snap.normal_count}
                        </td>
                        <td className="py-2 pr-4 text-amber-600 font-semibold">
                          {snap.watch_count}
                        </td>
                        <td className="py-2 pr-4 text-rose-600 font-semibold">
                          {snap.investigate_count}
                        </td>
                        <td className="py-2 font-bold text-slate-700">
                          {snap.health_index_score}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
        <Info size={15} className="text-sky-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong className="font-bold text-slate-800">Informational only.</strong> These analytics
          summarize community observations and trusted monitoring data to support review and
          awareness. They are not a determination that any water source is safe or unsafe for
          consumption, and they do not replace formal regulatory assessment.
        </p>
      </div>
    </div>
  )
}

export default WatershedAnalyticsView
