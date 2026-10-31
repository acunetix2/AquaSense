import React, { useState } from 'react'
import { Droplets } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import { InfoModal } from './InfoModal'

type FooterModal = 'privacy' | 'qa' | null

const linkClass =
  'inline-block text-[13px] text-slate-400 hover:text-white underline-offset-4 hover:underline transition-colors cursor-pointer rounded focus:outline focus:outline-2 focus:outline-[#0284C7]'

const headingClass = 'text-[13px] font-bold text-white'

export const AppFooter: React.FC = () => {
  const { setActiveView, observations } = useApp()
  const { user } = useAuth()
  const isReviewer = isReviewerRole(user?.role)
  const [modal, setModal] = useState<FooterModal>(null)
  const go = (view: Parameters<typeof setActiveView>[0]) => () => setActiveView(view)

  return (
    <footer className="w-full bg-slate-900 border-t-2 border-[#0284C7] text-slate-400 text-xs mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-9 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0284C7] text-white">
                <Droplets size={17} aria-hidden="true" />
              </span>
              <span className="text-base font-bold tracking-tight text-white">AquaSense</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
              A record of what freshwater looks like, kept by the people who live next to it. Each
              entry carries a photo, a place, the observer's own answers and the review it went
              through. None of it is a laboratory result.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {observations.length > 0
                ? `${observations.length.toLocaleString()} observation${observations.length === 1 ? '' : 's'} in this workspace · `
                : ''}
              Open data under CC-BY 4.0.
            </p>
          </div>

          <nav aria-label="Workspace">
            <h3 className={headingClass}>Workspace</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={go('home')} className={linkClass}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={go('map')} className={linkClass}>
                  Basin map
                </button>
              </li>
              <li>
                <button type="button" onClick={go('capture')} className={linkClass}>
                  Record an observation
                </button>
              </li>
              <li>
                <button type="button" onClick={go('my-observations')} className={linkClass}>
                  My submissions
                </button>
              </li>
              <li>
                <button type="button" onClick={go('dashboard')} className={linkClass}>
                  Analytics
                </button>
              </li>
              {isReviewer && (
                <li>
                  <button type="button" onClick={go('reviewer-queue')} className={linkClass}>
                    Reviewer queue
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <h3 className={headingClass}>Reading the signals</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 bg-emerald-400" aria-hidden="true" />
                Normal — nothing unusual visible
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 bg-amber-400" aria-hidden="true" />
                Watch — worth a second look
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 bg-rose-400" aria-hidden="true" />
                Investigate — ask a reviewer
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              A signal describes a photograph, not the water. Records can be exported as HL7 FHIR R4
              observations for anyone who wants to work with them elsewhere.
            </p>
          </div>
        </div>

        <div className="mt-9 border-t border-slate-800 pt-5 flex flex-col gap-2 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aventorgo</p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <button type="button" onClick={() => setModal('privacy')} className={linkClass}>
              Privacy Notice
            </button>
            <button type="button" onClick={() => setModal('qa')} className={linkClass}>
              Quality Assurance
            </button>
            <button type="button" onClick={go('api-docs')} className={linkClass}>
              API Documentation
            </button>
          </p>
        </div>
      </div>

      <InfoModal open={modal === 'privacy'} title="Privacy Notice" onClose={() => setModal(null)}>
        <p>
          AquaSense collects only what is needed to record environmental observations:
          the observation itself (location, conditions, photos) and minimal profile
          information you provide (display name, role, optional affiliation).
        </p>
        <p>
          Photos are stored in the AquaSense observation media bucket and are linked to
          your observation. Your email is never shown publicly and is only visible to
          certified reviewers for verification purposes.
        </p>
        <p>
          We do not sell personal data. Observations you submit are part of a public
          environmental dataset licensed under CC-BY 4.0. You can request deletion of
          your observations and account data at any time from this settings area.
        </p>
      </InfoModal>

      <InfoModal open={modal === 'qa'} title="Quality Assurance" onClose={() => setModal(null)}>
        <p>
          Every observation passes a consistency check: your answers are compared
          against the photo analysis, and any possible mismatch is shown to you
          before saving. The AI never changes your answers — you confirm or correct
          them.
        </p>
        <p>
          Signals (Normal / Watch / Investigate) are informational indicators, not
          safety determinations. A certified reviewer verifies or flags each
          important observation before it is treated as confirmed evidence.
        </p>
        <p>
          Every AI assessment carries a decision trail showing the inputs, the model
          and prompt version used, the rules that fired, and the confidence of the
          output — so researchers and reviewers can audit how each signal was
          produced.
        </p>
      </InfoModal>
    </footer>
  )
}

export default AppFooter
