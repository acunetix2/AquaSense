import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Eye,
  Flag,
  BookOpen,
  ArrowLeft,
  MapPin,
  Save,
  Compass,
  Brain,
  AlertTriangle,
  Droplets,
  Wind,
  Leaf,
  Trash2,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { SignalBadge } from '../common/SignalBadge'
import { ConfidenceBar } from '../common/ConfidenceBar'
import type { SignalType, AssessmentAnswers, ConsistencyFlag } from '../../types/observation'

interface EcosystemIndicators {
  turbidity: string
  algae_presence: string
  waste_visible: boolean
  flow_condition: string
  bank_condition: string
  color_anomaly: string
}

interface AIAnalysisResult {
  signal: SignalType
  confidence: number
  title: string
  summary: string
  visual_condition_score: number
  assessment_status: 'assessed' | 'needs_better_photo' | 'questionnaire_only'
  detected_issues: string[]
  key_evidence: string[]
  suggested_steps: string[]
  ecosystem_indicators: EcosystemIndicators
  urgency: string
  consistency_flags?: ConsistencyFlag[]
  analysis_meta?: {
    source: string
    model: string
    prompt_version: string
    image_count: number
    assessment_status?: 'assessed' | 'needs_better_photo' | 'questionnaire_only'
    analysed_at: string
  }
}

interface Step4ReviewProps {
  location: {
    site_name: string
    address: string
    latitude: number
    longitude: number
  }
  imageUrl?: string
  imageData?: string
  imageUrls?: string[]
  imageDataList?: string[]
  imageMime: string
  answers: AssessmentAnswers
  onBack: () => void
  onRetakePhoto: () => void
  onSave: (calculated: {
    signal: SignalType
    confidence: number
    summary: string
    keyEvidence: string[]
    suggestedSteps: string[]
    aiResult: AIAnalysisResult | null
    consistencyAcknowledged: boolean
  }) => Promise<void>
  onViewOnMap: () => void
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

// Urgency level styling
const URGENCY_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  routine: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Routine Monitoring' },
  monitor: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Monitor Closely' },
  urgent: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Urgent Attention' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Critical — Escalate' },
}

// Visual-condition score colour. This expresses what the image visibly shows;
// it is never a measure of water safety or suitability for use.
function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-rose-600'
}

function scoreTrackColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-rose-500'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'bg-amber-50 border-amber-200'
  if (score >= 40) return 'bg-orange-50 border-orange-200'
  return 'bg-rose-50 border-rose-200'
}

// Indicator icons
const INDICATOR_ICONS: Record<string, React.ReactNode> = {
  turbidity: <Droplets size={14} />,
  algae_presence: <Leaf size={14} />,
  flow_condition: <Wind size={14} />,
  bank_condition: <Layers size={14} />,
  color_anomaly: <Activity size={14} />,
  waste_visible: <Trash2 size={14} />,
}

const INDICATOR_LABELS: Record<string, string> = {
  turbidity: 'Water Clarity (Cloudiness)',
  algae_presence: 'Algae',
  flow_condition: 'Flow',
  bank_condition: 'Bank',
  color_anomaly: 'Colour',
  waste_visible: 'Waste',
}

function formatIndicatorValue(_key: string, value: string | boolean): string {
  if (typeof value === 'boolean') return value ? 'Detected' : 'None'
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function indicatorBadgeColor(key: string, value: string | boolean): string {
  if (key === 'waste_visible' && value) return 'bg-rose-100 text-rose-700'
  if (key === 'turbidity' && (value === 'cloudy' || value === 'very_cloudy')) return 'bg-orange-100 text-orange-700'
  if (key === 'algae_presence' && (value === 'moderate' || value === 'heavy')) return 'bg-amber-100 text-amber-700'
  if (key === 'flow_condition' && value === 'stagnant') return 'bg-rose-100 text-rose-700'
  if (key === 'color_anomaly' && value !== 'none') return 'bg-purple-100 text-purple-700'
  return 'bg-slate-100 text-slate-600'
}

const FLAG_FIELD_LABELS: Record<string, string> = {
  water_clarity: 'Water clarity',
  unusual_color: 'Unusual colour',
  waste_visible: 'Visible waste',
  flow_rate: 'Flow rate',
  image_analysis: 'Image analysis',
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  location,
  imageUrl,
  imageData,
  imageUrls: propImageUrls,
  imageDataList: propImageDataList,
  imageMime,
  answers,
  onBack,
  onRetakePhoto,
  onSave,
  onViewOnMap,
}) => {
  const allUrls = propImageUrls && propImageUrls.length > 0 ? propImageUrls : (imageUrl ? [imageUrl] : [])
  const allDataList = propImageDataList && propImageDataList.length > 0 ? propImageDataList : (imageData ? [imageData] : [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showRawJSON, setShowRawJSON] = useState(false)
  const [autosaveTime, setAutosaveTime] = useState<string | null>(null)
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(0)
  const [consistencyAcknowledged, setConsistencyAcknowledged] = useState(false)

  // Run analysis automatically and autosave draft when component mounts
  useEffect(() => {
    // Autosave draft state to localStorage
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      localStorage.setItem('aquasense_pending_draft', JSON.stringify({
        location,
        answers,
        photosCount: allUrls.length,
        timestamp: now,
      }))
      setAutosaveTime(now)
    } catch {}

    if (allDataList.length > 0) {
      runAnalysis()
    }
  }, [])

  const runAnalysis = async () => {
    setIsAnalysing(true)
    setAnalysisError(null)

    try {
      const hasMulti = allDataList.length > 1
      const endpoint = hasMulti ? `${API_URL}/observations/analyze-images` : `${API_URL}/observations/analyze-image`
      
      const payload = hasMulti ? {
        image_data_list: allDataList.slice(0, 3),
        image_mime: imageMime || 'image/jpeg',
        site_name: location.site_name,
        water_appearance: answers.waterClarity?.replace(/_/g, ' ') || 'not specified',
        odour: answers.noticeableOdor === 'yes' ? 'noticeable' : 'none',
        waste_visible: !!answers.wasteVisible,
        flow_rate: answers.flowRate || 'not specified',
        notes: answers.additionalNotes || '',
        assessment_answers: answers,
      } : {
        image_data: allDataList[0] || '',
        image_mime: imageMime || 'image/jpeg',
        site_name: location.site_name,
        water_appearance: answers.waterClarity?.replace(/_/g, ' ') || 'not specified',
        odour: answers.noticeableOdor === 'yes' ? 'noticeable' : 'none',
        waste_visible: !!answers.wasteVisible,
        flow_rate: answers.flowRate || 'not specified',
        notes: answers.additionalNotes || '',
        assessment_answers: answers,
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.detail || `Analysis failed with status ${response.status}`)
      }

      const result: AIAnalysisResult = await response.json()
      setConsistencyAcknowledged(false)
      setAiResult(result)
    } catch (err: any) {
      setAnalysisError(err.message || 'AI analysis failed. Please try again.')
    } finally {
      setIsAnalysing(false)
    }
  }

  const handleSaveClick = async () => {
    setIsSubmitting(true)
    try {
      await onSave({
        signal: aiResult?.signal || 'normal',
        confidence: aiResult?.confidence || 0.7,
        summary: aiResult?.summary || 'Observation submitted.',
        keyEvidence: aiResult?.key_evidence || [],
        suggestedSteps: aiResult?.suggested_steps || [],
        aiResult,
        consistencyAcknowledged,
      })
      // Clear draft on successful save
      localStorage.removeItem('aquasense_pending_draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  const urgencyConfig = URGENCY_CONFIG[aiResult?.urgency || 'routine']
  const allFlags = aiResult?.consistency_flags || []
  const consistencyFlags = allFlags.filter((f) => f.type === 'consistency')
  const qualityFlags = allFlags.filter((f) => f.type === 'image_quality')
  const assessmentStatus = aiResult?.assessment_status ?? aiResult?.analysis_meta?.assessment_status ?? 'assessed'
  const needsBetterPhoto = assessmentStatus === 'needs_better_photo'
  const isQuestionnaireOnly = assessmentStatus === 'questionnaire_only'

  return (
    <div className="space-y-6">
      {/* Header matching inspiration.png Screen 5 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Assessment Results</h2>
        <p className="text-sm text-slate-500 mt-1">
          Here's what we found based on your photo and answers.
        </p>
      </div>

      {/* Loading State */}
      {isAnalysing && (
        <div className="rounded-2xl border border-[#0284C7]/20 bg-gradient-to-br from-[#0284C7]/5 to-[#1FB8A6]/5 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#0284C7] flex items-center justify-center">
                <Brain size={28} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1FB8A6] flex items-center justify-center">
                <Loader2 size={10} className="text-white animate-spin" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Analysing stream conditions...</h3>
          <p className="text-sm text-slate-500 mb-2">
            AquaSense Vision is scanning for water clarity, algae, waste, flow conditions and colour anomalies.
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {['Scanning image...', 'Detecting indicators...', 'Generating report...'].map((step, i) => (
              <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {analysisError && !isAnalysing && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-800">Analysis failed</p>
              <p className="text-xs text-rose-600 mt-0.5">{analysisError}</p>
            </div>
            <button
              type="button"
              onClick={runAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Results */}
      {aiResult && !isAnalysing && (
        <div className="space-y-5">
          {needsBetterPhoto && (
            <div className="rounded-2xl border border-sky-300 bg-sky-50 p-5 flex items-start gap-3">
              <AlertTriangle size={19} className="text-sky-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-sky-900">A clearer water photo is needed</p>
                <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                  AquaSense did not infer stream conditions from this image. Retake the photo so the water surface is well lit, in focus and clearly visible.
                </p>
              </div>
            </div>
          )}

          {isQuestionnaireOnly && (
            <div className="rounded-2xl border border-sky-300 bg-sky-50 p-5 flex items-start gap-3">
              <AlertTriangle size={19} className="text-sky-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-sky-900">Photo analysis was unavailable</p>
                <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                  This preliminary record reflects your reported observations only. No visual AI conclusion was produced, so a reviewer or follow-up photo is needed to verify it.
                </p>
              </div>
            </div>
          )}

          {/* Top Row: Signal + Score + Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Signal */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center text-center shadow-sm">
              <p className="text-xs text-slate-400 mb-2">{needsBetterPhoto ? 'Photo check' : 'Monitoring signal'}</p>
              {needsBetterPhoto ? (
                <>
                  <AlertTriangle size={30} className="text-sky-600" />
                  <p className="text-xs text-sky-700 font-semibold mt-2">Needs a clearer photo</p>
                </>
              ) : (
                <>
                  <SignalBadge signal={aiResult.signal} size="lg" />
                  <p className="text-xs text-slate-500 mt-2">{aiResult.signal.charAt(0).toUpperCase() + aiResult.signal.slice(1)}</p>
                </>
              )}
            </div>

            {/* Visual-condition score */}
            <div className={`rounded-2xl border p-5 flex flex-col items-center text-center shadow-sm ${needsBetterPhoto || isQuestionnaireOnly ? 'bg-slate-50 border-slate-200' : scoreBg(aiResult.visual_condition_score)}`}>
              <p className="text-xs text-slate-400 mb-2">Visual conditions in image</p>
              {needsBetterPhoto || isQuestionnaireOnly ? (
                <>
                  <span className="text-sm font-bold text-slate-600">Not available</span>
                  <p className="text-[10px] text-slate-500 mt-2">No image conclusion</p>
                </>
              ) : (
                <>
                  <div className={`text-4xl font-black ${scoreColor(aiResult.visual_condition_score)}`}>
                    {aiResult.visual_condition_score}
                  </div>
                  <div className="w-full mt-2 h-1.5 rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all ${scoreTrackColor(aiResult.visual_condition_score)}`}
                      style={{ width: `${aiResult.visual_condition_score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Image interpretation only — not a safety rating</p>
                </>
              )}
            </div>

            {/* Urgency */}
            <div className={`rounded-2xl border p-5 flex flex-col items-center text-center shadow-sm ${urgencyConfig.bg} ${urgencyConfig.border}`}>
              <p className="text-xs text-slate-400 mb-2">Urgency</p>
              <span className={`text-sm font-black ${urgencyConfig.text}`}>{urgencyConfig.label}</span>
              <div className="mt-2">
                <ConfidenceBar confidence={aiResult.confidence} />
              </div>
              <p className="text-xs text-slate-400 mb-2">AI confidence: {Math.round(aiResult.confidence * 100)}%</p>
            </div>
          </div>

          {/* Assessment Headline + Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0284C7] flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0284C7] mb-0.5">AquaSense Vision Assessment</p>
                <h3 className="text-xl font-bold text-slate-900">{aiResult.title}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{aiResult.summary}</p>
          </div>

          {/* ── CONSISTENCY CHECK (PRD FR-07) — the observer always decides ── */}
          {consistencyFlags.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Possible inconsistency between your answers and the photo
                  </p>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    AI never overwrites your answers. Review each point, then decide — your answer stands
                    unless you change it.
                  </p>
                </div>
              </div>

              {consistencyFlags.map((flag, idx) => (
                <div key={idx} className="rounded-xl bg-white/80 border border-amber-200 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {FLAG_FIELD_LABELS[flag.field] || flag.field}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">{flag.message}</p>
                  {(flag.reported || flag.observed) && (
                    <p className="text-[11px] text-slate-500">
                      You said: <span className="font-semibold text-slate-700">{flag.reported || '—'}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      Photo shows: <span className="font-semibold text-slate-700">{flag.observed || '—'}</span>
                    </p>
                  )}
                </div>
              ))}

              {!consistencyAcknowledged ? (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0b3b64] transition-colors cursor-pointer"
                  >
                    Adjust my answers
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsistencyAcknowledged(true)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    My answer is correct — keep it
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 pt-1">
                  <CheckCircle2 size={14} />
                  <span>Confirmed — your original answers were recorded as you reported them.</span>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGE-QUALITY NOTICE (PRD FR-06) ── */}
          {qualityFlags.map((flag, idx) => (
            <div
              key={`quality-${idx}`}
              className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-start gap-2.5"
            >
              <AlertTriangle size={15} className="text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">{flag.message}</p>
            </div>
          ))}

          {/* Ecosystem Indicators */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">
              Ecosystem indicators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(aiResult.ecosystem_indicators).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl ${indicatorBadgeColor(key, value)}`}
                >
                  <span className="shrink-0">{INDICATOR_ICONS[key]}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold opacity-80 truncate">{INDICATOR_LABELS[key]}</p>
                    <p className="text-xs font-semibold truncate">{formatIndicatorValue(key, value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column: Evidence + Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Evidence */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#0284C7]" />
                Key evidence
              </h4>
              <ul className="space-y-2.5">
                {aiResult.key_evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{evidence}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Steps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Compass size={13} className="text-[#1FB8A6]" />
                Suggested next steps
              </h4>
              <ul className="space-y-2.5">
                {aiResult.suggested_steps.map((step, idx) => {
                  const Icons = [Eye, Flag, BookOpen, Activity, CheckCircle2]
                  const Icon = Icons[idx % Icons.length]
                  return (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Icon size={14} className="text-[#1FB8A6] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Detected Issues (if any) */}
          {aiResult.detected_issues.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-900 mb-2">
                Detected issues
              </p>
              <div className="flex flex-wrap gap-2">
                {aiResult.detected_issues.map((issue, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autosaved Indicator & Observation Preview Row */}
          <div className="space-y-2">
            {autosaveTime && (
              <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 size={13} />
                  Draft autosaved locally ({autosaveTime})
                </span>
                <span>{allUrls.length} photo{allUrls.length > 1 ? 's' : ''} attached</span>
              </div>
            )}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {allUrls.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {allUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhotoPreview(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPhotoPreview === idx ? 'border-[#0284C7] ring-2 ring-sky-200' : 'border-slate-200 opacity-80'
                      }`}
                    >
                      <img src={url} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Observation site</p>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5 truncate">
                  <MapPin size={13} className="text-[#0284C7] shrink-0" />
                  {location.site_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{location.address}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400">Coordinates</p>
                <p className="text-xs font-mono text-slate-600">{location.latitude.toFixed(4)}°</p>
                <p className="text-xs font-mono text-slate-600">{location.longitude.toFixed(4)}°</p>
              </div>
            </div>
          </div>

          {/* Raw JSON toggle (for devs/power users) */}
          <button
            type="button"
            onClick={() => setShowRawJSON(v => !v)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {showRawJSON ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showRawJSON ? 'Hide' : 'Show'} raw AI response
          </button>

          {showRawJSON && (
            <pre className="rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 text-[10px] p-4 overflow-x-auto max-h-64 leading-relaxed">
              {JSON.stringify(aiResult, null, 2)}
            </pre>
          )}

          {/* Action Buttons matching inspiration.png Screen 5 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSubmitting || needsBetterPhoto}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0b3b64] shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" />Saving observation...</>
              ) : (
                <><Save size={14} />Save Observation</>
              )}
            </button>

            {needsBetterPhoto && (
              <button
                type="button"
                onClick={onRetakePhoto}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0b3b64] shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                Retake photo
              </button>
            )}

            <button
              type="button"
              onClick={onViewOnMap}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              View on Map
            </button>

            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalysing}
              className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#0284C7] bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              Re-analyse
            </button>
          </div>
        </div>
      )}

      {/* No image data fallback */}
      {!isAnalysing && !aiResult && !analysisError && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Brain size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">No image data to analyse</p>
          <p className="text-xs text-slate-400 mt-1">Please go back and upload an image first.</p>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Assessment
        </button>
      </div>
    </div>
  )
}
