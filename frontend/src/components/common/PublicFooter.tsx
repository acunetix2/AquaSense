import React from 'react'
import { Droplets, Waves, Map as MapIcon, Camera, BookOpen, LogIn, GitBranch, ShieldCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { ActiveView } from '../../types/observation'

const scrollToSection = (id: string) => () => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export const PublicFooter: React.FC = () => {
  const { setActiveView } = useApp()
  const go = (view: ActiveView) => () => setActiveView(view)
  const year = new Date().getFullYear()

  const linkClass = 'inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0284C7] transition-colors cursor-pointer rounded focus:ring-2 focus:ring-[#0284C7]/30'

  return (
    <footer className="public-footer border-t border-slate-200 bg-[#F9FAFB] text-left">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#1FB8A6] text-white shadow-sm">
                <Droplets size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">AquaSense</p>
                <p className="text-[11px] text-slate-500">Freshwater Intelligence</p>
              </div>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-slate-500">
              Community-led, evidence-first monitoring for rivers, lakes, and watersheds — clear, reviewable observations, never safety verdicts.
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Explore</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <button type="button" onClick={scrollToSection('featured-rivers')} className={linkClass}>
                  <Waves size={13} aria-hidden="true" />
                  <span>Monitored waterways</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={go('public-map')} className={linkClass}>
                  <MapIcon size={13} aria-hidden="true" />
                  <span>Public basin map</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={scrollToSection('how-it-works')} className={linkClass}>
                  <BookOpen size={13} aria-hidden="true" />
                  <span>How it works</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={go('api-docs')} className={linkClass}>
                  <span>API documentation</span>
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Contribute">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Contribute</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <button type="button" onClick={go('capture')} className={linkClass}>
                  <Camera size={13} aria-hidden="true" />
                  <span>Report an observation</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={go('auth')} className={linkClass}>
                  <LogIn size={13} aria-hidden="true" />
                  <span>Sign in</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={go('signup')} className={linkClass}>
                  <span>Create an account</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={go('auth')} className={linkClass}>
                  <span>Reviewer portal</span>
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Standards</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <ShieldCheck size={13} className="text-[#0284C7]" aria-hidden="true" />
                  <span>OneAquaHealth &amp; HL7 FHIR ready</span>
                </span>
              </li>
              <li>
                <a
                  href="https://github.com/acunetix2/AquaSense"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <GitBranch size={13} aria-hidden="true" />
                  <span>Open source on GitHub</span>
                </a>
              </li>
              <li>
                <span className="text-[11px] leading-relaxed text-slate-500">
                  Map data © OpenStreetMap contributors.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} AquaSense · Community freshwater monitoring.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#0284C7]" aria-hidden="true" />
            <span>Community reports are not official water-safety advisories.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
