import React, { useState } from 'react'
import {
  Droplets,
  Activity,
  MapPin,
  Camera,
  Layers,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  Globe2,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import { InfoModal } from './InfoModal'

type FooterModal = 'privacy' | 'qa' | null

export const AppFooter: React.FC = () => {
  const { setActiveView } = useApp()
  const { user } = useAuth()
  const isReviewer = isReviewerRole(user?.role)
  const [modal, setModal] = useState<FooterModal>(null)

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 text-xs mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Droplets size={18} />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">AquaSense</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold">
                Watershed Network
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Empowering community scientists, certified hydrologists, and environmental stewards with real-time stream observation, water clarity analytics, and verified ecological intelligence.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Ingestion Online
              </span>
              <span className="text-[11px] text-slate-500">v2.4.0 • EPA / FHIR R4 Ready</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stream Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveView('home')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Globe2 size={13} className="text-sky-400" />
                  <span>Public Stream Feed</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('map')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin size={13} className="text-teal-400" />
                  <span>Interactive Map & GIS</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('capture')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Camera size={13} className="text-amber-400" />
                  <span>Submit Observation</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('my-observations')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Layers size={13} className="text-indigo-400" />
                  <span>My Submissions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 size={13} className="text-emerald-400" />
                  <span>Watershed Analytics</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Ecological Signals & Clarity Standard */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Water Clarity Signals</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-300 font-medium">Normal / Clear</span>
                <span className="text-slate-500 text-[10px] ml-auto">&lt; 10 NTU</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-slate-300 font-medium">Warning / Moderate</span>
                <span className="text-slate-500 text-[10px] ml-auto">10 - 50 NTU</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-slate-300 font-medium">Alert / High Turbidity</span>
                <span className="text-slate-500 text-[10px] ml-auto">&gt; 50 NTU</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                Field clarity grades use computer vision and secchi disc equivalence.
              </p>
            </div>
          </div>

          {/* Standards & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Standards & Open Data</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Certified Limnologist Review</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Activity size={14} className="text-sky-400" />
                <span>HL7 / FHIR R4 Water Spec</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <ExternalLink size={14} className="text-teal-400" />
                <span>OpenStreetMap Contributors</span>
              </li>
              {isReviewer && (
                <li>
                  <button
                    onClick={() => setActiveView('reviewer-queue')}
                    className="hover:text-white transition-colors cursor-pointer text-sky-400 flex items-center gap-1"
                  >
                    Reviewer Queue Panel →
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Aventorgo LLC. All open data licensed under CC-BY 4.0.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setModal('privacy')}
              className="hover:text-slate-300 cursor-pointer transition-colors"
            >
              Privacy Notice
            </button>
            <button
              type="button"
              onClick={() => setModal('qa')}
              className="hover:text-slate-300 cursor-pointer transition-colors"
            >
              Quality Assurance
            </button>
            <button
              type="button"
              onClick={() => setActiveView('api-docs')}
              className="hover:text-slate-300 cursor-pointer transition-colors"
            >
              API Documentation
            </button>
            <span className="text-slate-400">Aventorgo LLC</span>
          </div>
        </div>
      </div>

      <InfoModal open={modal === 'privacy'} title="Privacy Notice" onClose={() => setModal(null)}>
        <p>
          AquaSense collects only what is needed to record environmental observations:
          the observation itself (location, conditions, photos) and minimal profile
          information you provide (display name, role, optional affiliation).
        </p>
        <p>
          Photos are stored in an AquaSense Supabase storage bucket and are linked to
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
