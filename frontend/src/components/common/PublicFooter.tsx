import React from 'react'
import { Droplets } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { ActiveView } from '../../types/observation'

const scrollToSection = (id: string) => () => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const linkClass =
  'inline-block text-[13px] text-slate-700 hover:text-[#0284C7] hover:underline underline-offset-4 decoration-[#0284C7] transition-colors cursor-pointer rounded focus:outline focus:outline-2 focus:outline-[#0284C7]'

const headingClass = 'text-[13px] font-bold text-slate-900'

export const PublicFooter: React.FC = () => {
  const { setActiveView, observations } = useApp()
  const go = (view: ActiveView) => () => setActiveView(view)
  const year = new Date().getFullYear()

  const sites = new Set(observations.map((o) => o.site_name?.trim()).filter(Boolean)).size

  return (
    <footer className="public-footer border-t-2 border-slate-900 bg-paper text-left">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-9 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0284C7] text-white">
                <Droplets size={17} aria-hidden="true" />
              </span>
              <span className="text-base font-bold tracking-tight text-slate-900">AquaSense</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
              A field photo, four plain questions and a location become a dated record that anyone in
              the basin can read and a reviewer can check. AquaSense documents what is visible in the
              water. It does not say whether the water is safe to drink.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {observations.length > 0 && (
                <>
                  {observations.length.toLocaleString()} public records
                  {sites > 0 ? ` across ${sites} site${sites === 1 ? '' : 's'}` : ''} ·{` `}
                </>
              )}
              Built by Aventorgo LLC for INCEPTION 2026.
            </p>
          </div>

          <nav aria-label="Look around">
            <h3 className={headingClass}>Look around</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={scrollToSection('featured-rivers')} className={linkClass}>
                  Waterways
                </button>
              </li>
              <li>
                <button type="button" onClick={go('public-map')} className={linkClass}>
                  Basin map
                </button>
              </li>
              <li>
                <button type="button" onClick={scrollToSection('how-it-works')} className={linkClass}>
                  How a record is built
                </button>
              </li>
              <li>
                <button type="button" onClick={go('api-docs')} className={linkClass}>
                  API documentation
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Take part">
            <h3 className={headingClass}>Take part</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={go('capture')} className={linkClass}>
                  Record an observation
                </button>
              </li>
              <li>
                <button type="button" onClick={go('signup')} className={linkClass}>
                  Create an account
                </button>
              </li>
              <li>
                <button type="button" onClick={go('auth')} className={linkClass}>
                  Sign in
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/acunetix2/AquaSense"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Source on GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-9 border-t border-slate-200 pt-5">
          <dl className="grid gap-x-8 gap-y-1.5 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-1.5">
              <dt className="text-slate-400">Vision</dt>
              <dd className="text-slate-600">AI vision model, confirmed by the observer</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-slate-400">Prompt</dt>
              <dd className="text-slate-600">aquasense-vision-2026-09-v1</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-slate-400">Stack</dt>
              <dd className="text-slate-600">FastAPI · React · PostgreSQL</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-slate-400">Data</dt>
              <dd className="text-slate-600">CC-BY 4.0</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2 text-[11px] leading-relaxed text-slate-500 sm:flex-row sm:items-start sm:justify-between">
            <p>© {year} AquaSense</p>
            <p className="sm:text-right">
              Map data © OpenStreetMap contributors, tiles by CARTO · satellite imagery © Esri.
              Community reports are not official water-quality advisories.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
