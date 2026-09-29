import React from 'react'
import { Cpu, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

const VISION_SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  groq: { label: 'AI vision', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  step4_reuse: { label: 'Reused (review step)', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  heuristic: { label: 'Rule-based fallback', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  questionnaire: { label: 'Questionnaire only', className: 'bg-sky-50 text-sky-700 border-sky-200' },
}

const SIGNAL_STYLES: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-50 text-amber-700 border-amber-200',
  investigate: 'bg-rose-50 text-rose-700 border-rose-200',
}

const formatLogTime = (iso?: string, fallback?: string) => {
  const d = new Date(iso || fallback || '')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Every vision model run on this user's observations — model, prompt version, and rules fired. */
export const VisionAuditLogs: React.FC = () => {
  const { user } = useAuth()
  const { observations } = useApp()

  const visionRuns = observations
    .filter(
      (o) => (o.user_id === user?.id || o.observer_name === user?.name) && o.ai_trail
    )
    .map((o) => ({ obs: o, trail: o.ai_trail! }))
    .sort(
      (a, b) =>
        new Date(b.trail.analysed_at || b.obs.created_at).getTime() -
        new Date(a.trail.analysed_at || a.obs.created_at).getTime()
    )

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#0284C7]/10 flex items-center justify-center">
              <Cpu size={16} className="text-[#0284C7]" />
            </span>
            AquaSense Vision Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1 ml-10">
            Every vision model run on your observations — model, prompt version, and rules fired.
          </p>
        </div>
        <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {visionRuns.length} {visionRuns.length === 1 ? 'run' : 'runs'}
        </span>
      </div>

      {visionRuns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-600">No vision runs recorded yet</p>
          <p className="text-xs text-slate-500">
            Submit an observation with a photo and its analysis will appear here.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
          {visionRuns.map(({ obs, trail }, idx) => {
            const source = VISION_SOURCE_LABELS[trail.source] || {
              label: trail.source,
              className: 'bg-slate-100 text-slate-600 border-slate-200',
            }
            const hits = trail.consistency_rule_hits || []
            return (
              <div
                key={`${obs.id}-${idx}`}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 truncate">{obs.site_name}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock size={12} />
                    {formatLogTime(trail.analysed_at, obs.created_at)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-md border font-semibold ${source.className}`}>
                    {source.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border font-semibold ${
                      SIGNAL_STYLES[trail.output?.signal || obs.signal] || SIGNAL_STYLES.normal
                    }`}
                  >
                    {(trail.output?.signal || obs.signal).toUpperCase()}
                  </span>
                  <span className="text-slate-500">
                    confidence{' '}
                    <span className="font-bold text-slate-700">
                      {Math.round((trail.output?.confidence ?? obs.confidence ?? 0) * 100)}%
                    </span>
                  </span>
                  <span className="text-slate-500">
                    {trail.image_count} photo{trail.image_count === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-full">
                    {trail.model?.includes('/') ? 'vision-model' : trail.model}
                  </span>
                  <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-full">
                    {trail.prompt_version}
                  </span>
                </div>

                {hits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {hits.map((hit, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"
                      >
                        rule: {hit.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default VisionAuditLogs
