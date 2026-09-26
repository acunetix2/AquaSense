import React, { useState } from 'react'
import {
  Home,
  Newspaper,
  PlusCircle,
  MapPin,
  MoreHorizontal,
  Sparkles,
  FileText,
  BarChart2,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import type { ActiveView } from '../../types/observation'

// Mobile bottom navigation — replaces the hamburger drawer inside the app.
// Primary tabs live in the bar; everything else sits behind the "More" sheet.
export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, observations, showToast } = useApp()
  const { user, isAuthenticated, signOut, setUserRole, signInWithGoogle } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  const isReviewer = isReviewerRole(user?.role)
  const pendingReviewCount = observations.filter((o) => o.status === 'pending').length

  const go = (view: ActiveView) => {
    setMoreOpen(false)
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReport = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please sign in to submit field observations.', 'info')
      go('auth')
    } else {
      go('capture')
    }
  }

  const handleSignOut = async () => {
    setMoreOpen(false)
    await signOut()
    setActiveView('landing')
    showToast('Signed Out', 'You have been signed out successfully.', 'info')
  }

  const primaryTabs: { id: ActiveView; label: string; icon: React.FC<{ size?: number; className?: string }> }[] =
    isAuthenticated
      ? [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'feed', label: 'Feed', icon: Newspaper },
          { id: 'map', label: 'Map', icon: MapPin },
        ]
      : [
          { id: 'landing', label: 'Overview', icon: Sparkles },
          { id: 'feed', label: 'Feed', icon: Newspaper },
          { id: 'map', label: 'Map', icon: MapPin },
        ]

  const moreLinks: {
    id: ActiveView
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    badge?: number
  }[] = [
    { id: 'my-observations', label: 'My Records', icon: FileText },
    { id: 'dashboard', label: 'Impact Dashboard', icon: BarChart2 },
    { id: 'analytics', label: 'Watershed Analytics', icon: BarChart3 },
    ...(isReviewer
      ? [
          {
            id: 'reviewer-queue' as ActiveView,
            label: 'Review Queue',
            icon: ShieldCheck,
            badge: pendingReviewCount,
          },
        ]
      : []),
  ]

  const tabClass = (isActive: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[10px] font-semibold transition-colors cursor-pointer ${
      isActive
        ? 'text-[#0284c7] dark:text-[#7dd3fc]'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    }`

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 dark:bg-[#0e1117]/95 dark:border-[#262e3c] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch h-[60px]">
          {[0, 1].map((i) => {
            const tab = primaryTabs[i]
            const isActive = activeView === tab.id
            return (
              <button key={tab.id} onClick={() => go(tab.id)} className={tabClass(isActive)}>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-7 rounded-full bg-[#0284c7] dark:bg-[#7dd3fc]" />
                )}
                <tab.icon size={20} className="stroke-[2]" />
                <span>{tab.label}</span>
              </button>
            )
          })}

          {/* Center Report FAB */}
          <button
            onClick={handleReport}
            aria-label="Report an observation"
            className="flex-1 flex flex-col items-center justify-center pb-1.5 cursor-pointer group"
          >
            <span
              className={`w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-[#0F4C81] to-[#1FB8A6] text-white shadow-lg shadow-sky-900/30 ring-4 ring-white dark:ring-[#0e1117] flex items-center justify-center transition-transform group-active:scale-95 ${
                activeView === 'capture' ? 'scale-105' : ''
              }`}
            >
              <PlusCircle size={24} className="stroke-[2.2]" />
            </span>
            <span className="text-[10px] font-semibold mt-1 text-slate-600 dark:text-slate-300">Report</span>
          </button>

          {primaryTabs.slice(2).map((tab) => {
            const isActive = activeView === tab.id
            return (
              <button key={tab.id} onClick={() => go(tab.id)} className={tabClass(isActive)}>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-7 rounded-full bg-[#0284c7] dark:bg-[#7dd3fc]" />
                )}
                <tab.icon size={20} className="stroke-[2]" />
                <span>{tab.label}</span>
              </button>
            )
          })}

          {/* More — opens the secondary sheet */}
          <button onClick={() => setMoreOpen(!moreOpen)} className={tabClass(moreOpen)}>
            {moreOpen && (
              <span className="absolute top-0 h-0.5 w-7 rounded-full bg-[#0284c7] dark:bg-[#7dd3fc]" />
            )}
            <MoreHorizontal size={20} className="stroke-[2]" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] md:hidden animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white dark:bg-[#0e1117] rounded-t-3xl border-t border-slate-200 dark:border-[#262e3c] shadow-2xl px-4 pt-3 pb-7 animate-in slide-in-from-bottom-4 duration-200">
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Explore</p>

            <div className="space-y-1">
              {moreLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                    activeView === item.id
                      ? 'text-[#0F4C81] bg-sky-50 dark:text-sky-300 dark:bg-sky-900/40 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={17} className="text-slate-400" />
                    <span>{item.label}</span>
                  </span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setUserRole('citizen')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                        !isReviewer ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Citizen
                    </button>
                    <button
                      onClick={() => setUserRole('reviewer')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                        isReviewer ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Reviewer
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => go('profile')}
                  className="w-full py-2.5 px-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <User size={15} className="text-[#0F4C81]" />
                  <span>Profile &amp; Account Settings</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 text-center text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => go('auth')}
                  className="w-full py-2.5 rounded-xl bg-[#0F4C81] text-white font-bold text-sm text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn size={15} />
                  <span>Log In</span>
                </button>
                <button
                  onClick={async () => {
                    setMoreOpen(false)
                    try {
                      await signInWithGoogle()
                    } catch {
                      go('auth')
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0F4C81] to-[#1FB8A6] text-white font-bold text-sm text-center cursor-pointer"
                >
                  Continue with Google
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
