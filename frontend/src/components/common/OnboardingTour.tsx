import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import {
  Droplets,
  Home,
  MapPin,
  FileText,
  BarChart2,
  ShieldCheck,
  PlusCircle,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react'

interface TourStep {
  targetSelector: string
  title: string
  badge: string
  description: string
  tip: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  preferredSide?: 'bottom' | 'top'
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="brand"]',
    title: 'Welcome to AquaSense',
    badge: 'Civic Freshwater Intelligence',
    description:
      'AquaSense connects community stream watchers, professional hydrologists, and AI vision intelligence to monitor and safeguard our shared rivers and freshwater basins.',
    tip: 'Field observations contribute directly to regional watershed registries.',
    icon: Droplets,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="nav-feed"]',
    title: 'Live Stream Feed',
    badge: 'Community Reports',
    description:
      'Browse real-time stream sightings, field photos, and calibrated environmental signal indicators submitted by local scouts.',
    tip: 'Filter observations by Normal, Watch, and Investigate signals.',
    icon: Home,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="nav-map"]',
    title: 'Interactive Basin Map',
    badge: 'Live Geospatial Intelligence',
    description:
      'Explore monitoring sites across the region with live satellite overlays, signal status filters, and pinned water body conditions.',
    tip: 'Toggle between Satellite and Street views on the top-right layer switch.',
    icon: MapPin,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="nav-records"]',
    title: 'Stream Records',
    badge: 'Your Watershed Logs',
    description:
      'Access your logged observations, review verified credentials, and edit your recorded observations directly.',
    tip: 'Observations autosave and can be updated anytime by the owner.',
    icon: FileText,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="nav-data"]',
    title: 'Hydrological Data Analytics',
    badge: 'Basin Telemetry',
    description:
      'Deep-dive into water clarity trends, dissolved oxygen distributions, and real-time regional environmental impact statistics.',
    tip: 'Interactive analytics reflect actual submissions across connected river basins.',
    icon: BarChart2,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="nav-reviews"]',
    title: 'Peer Review Workflow',
    badge: 'Open Science Standards',
    description:
      'Certified reviewers verify or flag urgent observations, ensuring scientific accuracy and regulatory transparency.',
    tip: 'Verified records strengthen public water policy and remediation actions.',
    icon: ShieldCheck,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="new-stream"]',
    title: '4-Step Field Wizard',
    badge: 'Log River Observations',
    description:
      'Click "Report" to launch the 4-step wizard: pinpoint GPS, snap up to 3 stream photos, report odor and clarity, and get instant GROQ Vision analysis.',
    tip: 'AI computer vision evaluates river turbidity and chemical slicks immediately.',
    icon: PlusCircle,
    preferredSide: 'bottom',
  },
  {
    targetSelector: '[data-tour="user-profile"]',
    title: 'Scout Profile & Role Switcher',
    badge: 'Contributor Identity',
    description:
      'Manage your account settings, monitor verified observations, and quickly toggle between Citizen Scout and Hydrologist Reviewer workspaces.',
    tip: 'Switch active workspace modes directly from this dropdown menu.',
    icon: User,
    preferredSide: 'bottom',
  },
]

const STORAGE_KEY = 'aquasense_tour_done'

interface OnboardingTourProps {
  forceOpen?: boolean
  onClose?: () => void
}

interface CardCoords {
  top: number
  left: number
  arrowOffset: number
  side: 'bottom' | 'top'
  targetRect: DOMRect | null
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState<CardCoords | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      setCurrentStep(0)
      return
    }

    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [forceOpen])

  // Reposition card next to targeted element
  const updatePosition = () => {
    if (!isOpen) return
    const step = TOUR_STEPS[currentStep]
    if (!step) return

    const target = document.querySelector(step.targetSelector)
    if (!target) {
      // Fallback: center card in viewport
      setCoords({
        top: 90,
        left: Math.max(16, (window.innerWidth - 350) / 2),
        arrowOffset: 175,
        side: 'bottom',
        targetRect: null,
      })
      return
    }

    // Scroll into view if offscreen
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })

    const rect = target.getBoundingClientRect()
    const cardWidth = cardRef.current ? cardRef.current.offsetWidth : 350
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 230
    const margin = 14

    // Default: position below target
    let side: 'bottom' | 'top' = step.preferredSide || 'bottom'
    let top = rect.bottom + margin

    // Check if bottom overflows viewport
    if (top + cardHeight > window.innerHeight - 16 && rect.top > cardHeight + margin + 16) {
      side = 'top'
      top = rect.top - cardHeight - margin
    }

    // Horizontal centering over target
    const targetCenterX = rect.left + rect.width / 2
    let left = targetCenterX - cardWidth / 2

    // Clamp within viewport
    const minLeft = 16
    const maxLeft = window.innerWidth - cardWidth - 16
    left = Math.max(minLeft, Math.min(maxLeft, left))

    // Arrow pointer position relative to card
    const arrowOffset = Math.max(22, Math.min(cardWidth - 22, targetCenterX - left))

    setCoords({
      top,
      left,
      arrowOffset,
      side,
      targetRect: rect,
    })
  }

  useLayoutEffect(() => {
    updatePosition()
  }, [isOpen, currentStep])

  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') handleComplete()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentStep])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
    if (onClose) onClose()
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon
  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dimmed backdrop */}
      <div
        onClick={handleComplete}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-300"
      />

      {/* Spotlight Ring around target element */}
      {coords?.targetRect && (
        <div
          style={{
            top: coords.targetRect.top - 4,
            left: coords.targetRect.left - 4,
            width: coords.targetRect.width + 8,
            height: coords.targetRect.height + 8,
          }}
          className="absolute rounded-xl ring-4 ring-[#0284c7] ring-offset-2 ring-offset-white shadow-[0_0_25px_rgba(2,132,199,0.45)] pointer-events-none transition-all duration-300 z-50 animate-pulse"
        />
      )}

      {/* Interactive Tour Card */}
      {coords && (
        <div
          ref={cardRef}
          style={{
            top: coords.top,
            left: coords.left,
          }}
          className="absolute w-[330px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-5 pointer-events-auto z-50 text-left transition-all duration-200 animate-in fade-in zoom-in-95"
        >
          {/* Pointing Arrow (Top or Bottom) */}
          {coords.side === 'bottom' ? (
            /* Arrow pointing UP towards element */
            <div
              style={{ left: coords.arrowOffset }}
              className="absolute -top-[9px] -translate-x-1/2 w-0 h-0 border-x-[9px] border-x-transparent border-b-[9px] border-b-white drop-shadow-[0_-2px_1px_rgba(0,0,0,0.06)]"
            />
          ) : (
            /* Arrow pointing DOWN towards element */
            <div
              style={{ left: coords.arrowOffset }}
              className="absolute -bottom-[9px] -translate-x-1/2 w-0 h-0 border-x-[9px] border-x-transparent border-t-[9px] border-t-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.06)]"
            />
          )}

          {/* Card Top: Badge & Skip */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284c7] text-[11px] font-bold border border-sky-100">
              <Icon size={12} className="text-[#0284c7]" />
              <span>{step.badge}</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono text-slate-400">
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={handleComplete}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Exit Walkthrough"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
            {step.title}
          </h4>

          {/* Description */}
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
            {step.description}
          </p>

          {/* Pro-Tip Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2 text-[11px] text-sky-900 leading-snug">
            <Sparkles size={14} className="text-[#0284c7] shrink-0 mt-0.5" />
            <span className="font-medium">{step.tip}</span>
          </div>

          {/* Bottom Bar: Dots & Navigation Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {/* Step Dots */}
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === currentStep
                      ? 'w-5 bg-[#0284c7]'
                      : idx < currentStep
                      ? 'w-2 bg-emerald-500'
                      : 'w-1.5 bg-slate-200'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] transition-all shadow-xs shadow-sky-900/10 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Got it</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
