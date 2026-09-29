import { useState } from 'react'
import { ChevronDown, ClipboardList, Camera, ShieldCheck, Sparkles, Bot, Info } from 'lucide-react'
import { SignalBadge } from '../common/SignalBadge'
import type { AiTrail, ConsistencyFlag, SignalType } from '../../types/observation'

interface AiDecisionTrailProps {
  trail?: AiTrail
  flags?: ConsistencyFlag[]
  acknowledged?: boolean
}

const SOURCE_LABELS: Record<string, { label: string; tone: string }> = {
  groq: { label: 'AI vision model', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  step4_reuse: { label: 'Reused from review step', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  heuristic: { label: 'Rule-based fallback', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  questionnaire: { label: 'Questionnaire only', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
}

function formatTimestamp(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * AI Decision Trail — an auditable, plain-language record of how the AI
 * produced a signal (theme: explainable AI / human-in-the-loop).
 * Rendered under the Evidence tab so researchers and reviewers can trace
 * every step from inputs to signal.
 */
export function AiDecisionTrail({ trail, flags = [], acknowledged = false }: AiDecisionTrailProps) {
  const [open, setOpen] = useState(false)

  if (!trail) return null

  const source = SOURCE_LABELS[trail.source] || {
    label: trail.source,
    tone: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  const hits = trail.consistency_rule_hits || []
  const qualityNotes = flags.filter((f) => f.type === 'image_quality')
  const observerResponse = trail.observer_consistency_response
  const reviewEvents = trail.review_events || []
  const latestReview = reviewEvents[reviewEvents.length - 1]

  const steps = [
    {
      icon: ClipboardList,
      title: '1 · Inputs recorded',
      body: (
        <div className="flex flex-wrap gap-1.5">
          {[
            trail.inputs?.site_name,
            trail.inputs?.water_appearance && `clarity: ${trail.inputs.water_appearance}`,
            trail.inputs?.odour && `odour: ${trail.inputs.odour}`,
            trail.inputs?.flow_rate && `flow: ${trail.inputs.flow_rate}`,
            trail.inputs?.waste_visible !== undefined &&
              `waste seen: ${trail.inputs.waste_visible ? 'yes' : 'no'}`,
          ]
            .filter(Boolean)
            .map((chip, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
              >
                {String(chip)}
              </span>
            ))}
        </div>
      ),
    },
    {
      icon: Camera,
      title: '2 · Evidence analysed',
      body: (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-700">
            {trail.assessment_status === 'needs_better_photo'
              ? 'The photo was not suitable for analysis — a clearer photo is required'
              : trail.assessment_status === 'questionnaire_only'
              ? 'Photo analysis was unavailable — assessment is based on questionnaire answers only'
              : trail.image_count > 0
              ? `${trail.image_count} photo${trail.image_count > 1 ? 's' : ''} analysed`
              : 'No photograph provided — assessment based on questionnaire answers only'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${source.tone}`}>
              {source.label}
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: ShieldCheck,
      title: '3 · Consistency rules checked',
      body:
        hits.length > 0 ? (
          <ul className="space-y-1">
            {hits.map((hit, i) => (
              <li key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                Possible mismatch: {hit.replace(/_/g, ' ')} — observer answer was never overwritten
              </li>
            ))}
            {(observerResponse?.action === 'kept_reported_answers' || acknowledged) && (
              <li className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Observer kept their reported answer — recorded in the decision trail
              </li>
            )}
          </ul>
        ) : (
          <p className="text-xs text-slate-600">
            Answers, photo, and heuristics agreed — no inconsistencies detected.
            {qualityNotes.length > 0 && ' Image-quality notes are shown above the trail.'}
          </p>
        ),
    },
    {
      icon: Sparkles,
      title: '4 · Signal emitted',
      body: (
        <div className="flex flex-wrap items-center gap-3">
          <SignalBadge signal={(trail.output?.signal as SignalType) || 'normal'} size="sm" />
          <span className="text-xs text-slate-700">
            Confidence{' '}
            <span className="font-bold">{Math.round((trail.output?.confidence || 0) * 100)}%</span>
          </span>
          <span className="text-[11px] text-slate-400">{formatTimestamp(trail.analysed_at)}</span>
        </div>
      ),
    },
  ]

  if (latestReview) {
    steps.push({
      icon: ShieldCheck,
      title: '5 · Human review recorded',
      body: (
        <div className="space-y-1">
          <p className="text-xs text-slate-700">
            <span className="font-bold capitalize">{latestReview.action}</span> by {latestReview.reviewer_name}
            <span className="text-slate-400"> · {formatTimestamp(latestReview.reviewed_at)}</span>
          </p>
          {latestReview.notes && <p className="text-xs text-slate-600 italic">“{latestReview.notes}”</p>}
        </div>
      ),
    })
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#0284C7]/10 flex items-center justify-center shrink-0">
            <Bot size={17} className="text-[#0284C7]" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900">AI Decision Trail</p>
            <p className="text-xs text-slate-500 truncate">
              How this signal was produced — inputs, analysis, rules, output
            </p>
          </div>
        </div>
        <ChevronDown
          size={17}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon size={14} className="text-slate-600" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-xs font-bold text-slate-800">{step.title}</p>
                  {step.body}
                </div>
              </div>
            )
          })}

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 rounded-xl p-3">
            <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
            <span>
              Automated assistance only — final verification always comes from a certified
              reviewer, and the observer's own answers are never overwritten by the model.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
