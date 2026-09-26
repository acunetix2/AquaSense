import React, { useMemo, useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Award,
  ArrowUpRight,
  Droplets,
  BarChart3,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { EmptyState } from '../common/EmptyState'
import { fetchLiveAnalytics, type LiveAnalytics } from '../../services/api'

export const DashboardView: React.FC = () => {
  const { observations, setActiveView, deleteObservation, refreshObservations } = useApp()
  const { user } = useAuth()
  const [liveStats, setLiveStats] = useState<LiveAnalytics | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadAnalytics = async () => {
    setIsRefreshing(true)
    try {
      const stats = await fetchLiveAnalytics()
      if (stats) setLiveStats(stats)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const myObservations = user
    ? observations.filter(
        (obs) => !!user.id && !!obs.user_id && obs.user_id === user.id
      )
    : []

  const total = liveStats?.total_observations ?? observations.length
  const completed = liveStats?.verified_count ?? observations.filter((o) => o.status === 'verified').length
  const pending = liveStats?.pending_count ?? observations.filter((o) => o.status === 'pending').length
  const flagged = liveStats?.flagged_count ?? observations.filter((o) => o.status === 'flagged').length

  // Compute real chart data from actual observation timestamps (last 8 days)
  const { chartDays, maxVal } = useMemo(() => {
    const days: { label: string; date: Date; normal: number; watch: number; investigate: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      days.push({ label, date: d, normal: 0, watch: 0, investigate: 0 })
    }

    observations.forEach((obs) => {
      const obsDate = new Date(obs.created_at)
      obsDate.setHours(0, 0, 0, 0)
      const dayEntry = days.find((d) => d.date.getTime() === obsDate.getTime())
      if (dayEntry) {
        if (obs.signal === 'normal') dayEntry.normal++
        else if (obs.signal === 'watch') dayEntry.watch++
        else if (obs.signal === 'investigate') dayEntry.investigate++
      }
    })

    const maxVal = Math.max(
      ...days.flatMap((d) => [d.normal, d.watch, d.investigate]),
      4 // minimum scale to avoid flat lines with zero data
    )

    return { chartDays: days, maxVal }
  }, [observations])

  // Donut health index: ratio of 'normal' signals
  const normalCount = observations.filter((o) => o.signal === 'normal').length
  const healthPct = total > 0 ? Math.round((normalCount / total) * 100) : 0
  const healthColor = healthPct >= 70 ? '#1FB8A6' : healthPct >= 40 ? '#F59E0B' : '#E76F51'
  const healthLabel = healthPct >= 70 ? 'Healthy' : healthPct >= 40 ? 'Caution' : 'At Risk'

  // SVG Chart
  const svgWidth = 560
  const svgHeight = 180
  const paddingX = 40
  const paddingY = 25
  const plotWidth = svgWidth - paddingX * 2
  const plotHeight = svgHeight - paddingY * 2

  const getCoordinates = (val: number, idx: number) => {
    const x = paddingX + (idx / (chartDays.length - 1)) * plotWidth
    const y = svgHeight - paddingY - (val / maxVal) * plotHeight
    return { x, y }
  }

  const makePathD = (key: 'normal' | 'watch' | 'investigate') =>
    chartDays
      .map((d, i) => {
        const { x, y } = getCoordinates(d[key], i)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

  const normalPath = makePathD('normal')
  const watchPath = makePathD('watch')
  const investigatePath = makePathD('investigate')

  // Donut circumference
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - healthPct / 100)

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Watershed Impact Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time computed data from the regional freshwater observation database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live DB Synced
          </span>
          <button
            type="button"
            onClick={async () => {
              await Promise.all([loadAnalytics(), refreshObservations()])
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh database analytics"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#0F4C81]' : ''} />
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs py-6">
          <EmptyState
            icon={BarChart3}
            title="No watershed observations recorded yet"
            description="The impact dashboard generates real-time regional trends, health indices, and verification metrics as community observations are submitted."
            actionLabel="Submit First Observation"
            onAction={() => setActiveView('capture')}
            secondaryLabel="Explore Public Map"
            onSecondaryAction={() => setActiveView('map')}
          />
        </div>
      ) : (
        <>
          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Total */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Observations</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <Droplets size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{total}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Across all monitored sites</p>
              </div>
            </div>

            {/* Card 2: Verified */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Verified</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4CAF50] flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{completed}</span>
                  {total > 0 && (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight size={12} />
                      {Math.round((completed / total) * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Verified with full evidence cards</p>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Review</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{pending}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Awaiting expert verification</p>
              </div>
            </div>

            {/* Card 4: Flagged or Health */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Flagged</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{flagged}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Require field inspection</p>
              </div>
            </div>
          </div>

          {/* Chart + Donut Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Chart: Observations Over Time */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <h3 className="font-bold text-slate-900 text-base">Observations Over Time</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span>Watch</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E76F51]" />
                      <span>Investigate</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Daily signal counts across your last 8 days of monitoring
                </p>
              </div>

              <div className="mt-4 w-full overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 sm:h-52 select-none">
                  {/* Grid lines */}
                  <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#F1F5F9" strokeWidth="1" />
                  <line x1={paddingX} y1={paddingY + plotHeight / 2} x2={svgWidth - paddingX} y2={paddingY + plotHeight / 2} stroke="#F1F5F9" strokeWidth="1" />
                  <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#E2E8F0" strokeWidth="1" />

                  {/* Y labels */}
                  <text x={paddingX - 6} y={paddingY + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{maxVal}</text>
                  <text x={paddingX - 6} y={paddingY + plotHeight / 2 + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{Math.round(maxVal / 2)}</text>
                  <text x={paddingX - 6} y={svgHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="#94A3B8">0</text>

                  {/* Normal series */}
                  <path d={normalPath} fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartDays.map((d, i) => {
                    const { x, y } = getCoordinates(d.normal, i)
                    return <circle key={`n${i}`} cx={x} cy={y} r="3" fill="#4CAF50" />
                  })}

                  {/* Watch series */}
                  <path d={watchPath} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartDays.map((d, i) => {
                    const { x, y } = getCoordinates(d.watch, i)
                    return <circle key={`w${i}`} cx={x} cy={y} r="3" fill="#F59E0B" />
                  })}

                  {/* Investigate series */}
                  <path d={investigatePath} fill="none" stroke="#E76F51" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartDays.map((d, i) => {
                    const { x, y } = getCoordinates(d.investigate, i)
                    return <circle key={`iv${i}`} cx={x} cy={y} r="3" fill="#E76F51" />
                  })}

                  {/* X labels */}
                  {chartDays.map((d, i) => {
                    const { x } = getCoordinates(0, i)
                    return (
                      <text key={`xl${i}`} x={x} y={svgHeight - 6} textAnchor="middle" fontSize="10" fill="#64748B">
                        {d.label}
                      </text>
                    )
                  })}
                </svg>
              </div>
            </div>

            {/* Donut: Watershed Health */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between text-center">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-base">Watershed Health</h3>
                <p className="text-xs text-slate-400">Based on your recorded signal distribution</p>
              </div>

              <div className="my-6 relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} stroke="#F1F5F9" strokeWidth="14" fill="transparent" />
                  <circle
                    cx="60" cy="60" r={radius}
                    stroke={healthColor}
                    strokeWidth="14"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900">{healthPct}%</span>
                  <span className="text-[11px] font-semibold" style={{ color: healthColor }}>{healthLabel}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border text-left" style={{ background: `${healthColor}14`, borderColor: `${healthColor}30` }}>
                <p className="text-xs font-semibold text-slate-800">
                  {healthPct >= 70 ? 'Water quality is in good shape.' : healthPct >= 40 ? 'Moderate concerns detected.' : 'Elevated risk — action needed.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {normalCount} of {total} observations show normal conditions.
                </p>
              </div>
            </div>
          </div>

          {/* My Recent Observations with Delete */}
          {user && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Your Recent Submissions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Observations associated with your account</p>
                </div>
                <button
                  onClick={() => setActiveView('my-observations')}
                  className="text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-3">
                {myObservations.slice(0, 5).map((obs) => (
                  <div key={obs.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        obs.signal === 'normal' ? 'bg-emerald-500' :
                        obs.signal === 'watch' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{obs.site_name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(obs.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          <span className={`capitalize font-medium ${
                            obs.status === 'verified' ? 'text-emerald-600' :
                            obs.status === 'flagged' ? 'text-rose-600' : 'text-amber-600'
                          }`}>{obs.status || 'pending'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteObservation(obs.id, user?.id)}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete observation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Challenge Banner */}
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-sky-50 via-teal-50/30 to-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81]">
                <Award size={14} className="text-[#1FB8A6]" />
                <span>Active Community Challenge</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Watershed Resilience Survey
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Every verified observation strengthens regional environmental baseline records and helps water councils respond faster to anomalies.
              </p>
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Your Progress: {completed} verified of {total} total</span>
                  <span className="font-bold text-[#0F4C81]">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F4C81] to-[#1FB8A6] rounded-full transition-all duration-700"
                    style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveView('capture')}
              className="shrink-0 px-6 py-3 rounded-xl bg-[#0F4C81] text-white font-bold text-sm hover:bg-[#0c3c66] shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Submit Observation
            </button>
          </div>
        </>
      )}
    </div>
  )
}
