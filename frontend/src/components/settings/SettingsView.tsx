import React, { useState } from 'react'
import {
  User,
  BadgeCheck,
  Cpu,
  ShieldCheck,
  Info,
  ArrowLeft,
  LogOut,
  Mail,
  Hash,
  Calendar,
  BookOpen,
  ExternalLink,
  Droplets,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { getRoleDefinition } from '../../types/roles'
import { ProfileSettingsPage } from '../profile/ProfileSettingsPage'
import { VisionAuditLogs } from './VisionAuditLogs'
import { SignOutModal } from '../common/SignOutModal'
import { OnboardingTour } from '../common/OnboardingTour'

type SettingsSection = 'profile' | 'account' | 'vision' | 'privacy' | 'about'

const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType; blurb: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, blurb: 'Manage your public identity on AquaSense' },
  { id: 'account', label: 'Account', icon: BadgeCheck, blurb: 'Sign-in details, role, and session controls' },
  { id: 'vision', label: 'Vision Audit Logs', icon: Cpu, blurb: 'Every vision model run on your observations' },
  { id: 'privacy', label: 'Privacy & Quality', icon: ShieldCheck, blurb: 'How data is handled and how signals are quality-assured' },
  { id: 'about', label: 'About & API', icon: Info, blurb: 'Product information and developer resources' },
]

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const SettingsView: React.FC = () => {
  const { user, signOut } = useAuth()
  const { setActiveView, showToast } = useApp()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showTour, setShowTour] = useState(false)

  if (!user) return null

  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]
  const roleDef = getRoleDefinition(user.role)

  const handleConfirmSignOut = async () => {
    await signOut()
    setActiveView('landing')
  }

  const handleRestartTour = () => {
    localStorage.removeItem('aquasense_tour_done')
    setShowTour(true)
    showToast('Tour Restarted', 'The onboarding tour will start again now.', 'success')
  }

  return (
    <>
      {showSignOutModal && (
        <SignOutModal
          userName={user.name}
          onConfirm={handleConfirmSignOut}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}

      {showTour && (
        <OnboardingTour
          forceOpen
          onClose={() => setShowTour(false)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
            <span className="text-slate-300">/</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Settings
            </h1>
          </div>
          <button
            onClick={() => setShowSignOutModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Settings sidebar ── */}
          <nav
            aria-label="Settings sections"
            className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24"
          >
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-3 space-y-1">
              <div className="px-3 pt-1 pb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Settings Menu
                </p>
              </div>
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#0F4C81] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Account chip */}
            <div className="mt-3 bg-slate-50 rounded-3xl border border-slate-200/80 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0F4C81]/10 flex items-center justify-center shrink-0">
                <Droplets size={16} className="text-[#0F4C81]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{roleDef.label.split('/')[0].trim()}</p>
              </div>
            </div>
          </nav>

          {/* ── Section content ── */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{section.label}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{section.blurb}</p>
            </div>

            {activeSection === 'profile' && <ProfileSettingsPage embedded />}

            {activeSection === 'account' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck size={16} className="text-[#0F4C81]" />
                    Sign-in Details
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Email is managed by your sign-in provider and is never shown publicly.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Account ID
                    </label>
                    <div className="relative">
                      <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={user.id}
                        readOnly
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used to attribute your observations and reviewer actions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Contributor Role
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleDef.badgeColor}`}>
                        <ShieldCheck size={10} />
                        {roleDef.label.split('/')[0].trim()}
                      </span>
                      <span className="text-xs text-slate-500">{roleDef.desc}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Change your role from the Profile section (Contributor Role).
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={16} className="text-[#0F4C81]" />
                    Session & Onboarding
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRestartTour}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      📅 Restart App Tour
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignOutModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Signing out ends this session on this device. Your observations stay in the shared dataset.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'vision' && <VisionAuditLogs />}

            {activeSection === 'privacy' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Privacy Notice
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    AquaSense collects only what is needed to record environmental observations:
                    the observation itself (location, conditions, photos) and minimal profile
                    information you provide (display name, role, optional affiliation).
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Photos are stored in an AquaSense Supabase storage bucket and are linked to
                    your observation. Your email is never shown publicly and is only visible to
                    certified reviewers for verification purposes.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We do not sell personal data. Observations you submit are part of a public
                    environmental dataset licensed under CC-BY 4.0. You can request deletion of
                    your observations and account data at any time from this settings area.
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck size={16} className="text-sky-600" />
                    Quality Assurance
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Every observation passes a consistency check: your answers are compared
                    against the photo analysis, and any possible mismatch is shown to you
                    before saving. The AI never changes your answers — you confirm or correct
                    them.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Signals (Normal / Watch / Investigate) are informational indicators, not
                    safety determinations. A certified reviewer verifies or flags each
                    important observation before it is treated as confirmed evidence.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Every AI assessment carries a decision trail showing the inputs, the model
                    and prompt version used, the rules that fired, and the confidence of the
                    output — so researchers and reviewers can audit how each signal was
                    produced.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        AquaSense
                      </h3>
                      <p className="text-xs text-slate-500">by Aventorgo LLC</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    AquaSense helps communities observe freshwater conditions, interpret them
                    responsibly, and route important findings to expert review. It is an
                    informational and decision-support platform: AI assists the work, but
                    certified reviewers stay in control, and the platform never declares a
                    water source safe or unsafe for consumption.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                      Open data · CC-BY 4.0
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                      HL7 / FHIR R4 ready
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                      Human-in-the-loop review
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-[#0F4C81]" />
                    Developer Resources
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Browse the REST API reference for observations, profiles, review, and
                    analytics endpoints — including auth headers and request examples.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveView('api-docs')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0F4C81] hover:bg-[#0c3c66] transition-colors cursor-pointer"
                    >
                      <BookOpen size={15} />
                      API Documentation
                    </button>
                    <a
                      href={`${API_BASE_URL.replace(/\/api\/v1$/, '')}/docs`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink size={15} />
                      Open Swagger UI
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Base URL: {API_BASE_URL}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsView
