import React, { useState } from 'react'
import {
  Droplets,
  PlusCircle,
  ShieldCheck,
  User,
  Home,
  MapPin,
  FileText,
  BarChart2,
  BarChart3,
  LogOut,
  LogIn,
  Sparkles,
  Newspaper,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import { NotificationCenter } from './NotificationCenter'
import { ThemeToggle } from './ThemeToggle'
import type { ActiveView } from '../../types/observation'

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, observations, showToast } = useApp()
  const { user, isAuthenticated, signOut, signInWithGoogle } = useAuth()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const isReviewer = isReviewerRole(user?.role)
  const pendingReviewCount = observations.filter((o) => o.status === 'pending').length

  // Nav links matching reference design (review queue is reviewer-only)
  const authenticatedNavLinks: {
    id: ActiveView
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    tourKey: string
  }[] = [
    { id: 'home', label: 'Home', icon: Home, tourKey: 'nav-feed' },
    { id: 'feed', label: 'Feed', icon: Newspaper, tourKey: 'nav-social-feed' },
    { id: 'map', label: 'Map', icon: MapPin, tourKey: 'nav-map' },
    { id: 'my-observations', label: 'Records', icon: FileText, tourKey: 'nav-records' },
    { id: 'dashboard', label: 'Data', icon: BarChart2, tourKey: 'nav-data' },
    { id: 'analytics', label: 'Watershed', icon: BarChart3, tourKey: 'nav-watershed' },
    ...(isReviewer
      ? [{ id: 'reviewer-queue' as ActiveView, label: 'Reviews', icon: ShieldCheck, tourKey: 'nav-reviews' }]
      : []),
  ]

  const publicNavLinks: {
    id: ActiveView
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    tourKey: string
  }[] = [
    { id: 'landing', label: 'Overview', icon: Sparkles, tourKey: 'nav-overview' },
    { id: 'map', label: 'Map', icon: MapPin, tourKey: 'nav-map' },
  ]

  const navLinks = isAuthenticated ? authenticatedNavLinks : publicNavLinks

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartCapture = () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please sign in with Google to submit field observations.', 'info')
      setActiveView('auth')
    } else {
      handleNavClick('capture')
    }
  }

  const handleSignOut = async () => {
    setUserDropdownOpen(false)
    await signOut()
    setActiveView('landing')
    showToast('Signed Out', 'You have been signed out successfully.', 'info')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2 sm:gap-4">
          {/* Brand — pinned to the far-left corner */}
          <div className="shrink-0">
            <button
              onClick={() => handleNavClick(isAuthenticated ? 'home' : 'landing')}
              className="flex items-center gap-3 focus:outline-hidden group text-left cursor-pointer"
              data-tour="brand"
            >
              <div className="w-10 h-10 rounded-full bg-[#008f9b] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Droplets size={21} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center leading-tight">
                  AquaSense
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium -mt-0.5">
                  Freshwater Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links — centered between brand and actions */}
          <nav className="hidden md:flex flex-1 items-center justify-center min-w-0 space-x-0.5 lg:space-x-2 px-2">
            {navLinks.map((item) => {
              const isActive = activeView === item.id
              const isReviewerLink = item.id === 'reviewer-queue'

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  data-tour={item.tourKey}
                  className={`relative px-4 py-2 rounded-xl text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'text-[#0284c7] bg-[#e8f3fc] dark:text-[#7dd3fc] dark:bg-[#12324c] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <item.icon size={16} className={isActive ? 'text-[#0284c7] dark:text-[#7dd3fc]' : 'text-slate-500'} />
                  <span>{item.label}</span>
                  {isReviewerLink && pendingReviewCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                      {pendingReviewCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#0284c7] rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right actions — pushed to the far-right end so everything fits */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 shrink-0 ml-auto">
            {/* Report CTA Button */}
            <button
              onClick={handleStartCapture}
              data-tour="new-stream"
              className="inline-flex items-center gap-2 px-3.5 lg:px-5 py-2 text-sm font-semibold rounded-full text-white bg-[#0284c7] hover:bg-[#0369a1] shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
            >
              <PlusCircle size={17} className="stroke-[2.3]" />
              <span className="hidden lg:inline">Report</span>
            </button>

            <ThemeToggle />

            {isAuthenticated && <NotificationCenter />}

            {isAuthenticated ? (
              /* Authenticated User Menu — avatar only, at the far right */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  data-tour="user-profile"
                  className="relative w-9 h-9 rounded-full hover:ring-2 hover:ring-slate-200 focus:outline-hidden transition-all cursor-pointer"
                  title="User Profile & Settings"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || 'Profile'}
                      className="w-full h-full rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs ring-2 ring-slate-100">
                      <User size={16} />
                    </div>
                  )}
                  {/* Active green status indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleNavClick('profile')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <User size={15} className="text-[#0F4C81]" />
                        <span>Profile & Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          handleNavClick('my-observations')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText size={15} className="text-slate-400" />
                        <span>My Observations</span>
                      </button>
                      <button
                        onClick={() => {
                          handleNavClick('dashboard')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <BarChart3 size={15} className="text-slate-400" />
                        <span>Impact Dashboard</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-xs font-semibold"
                      >
                        <LogOut size={15} className="text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Public / Unauthenticated Actions */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('auth')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#0F4C81] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn size={15} />
                  <span>Log In</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      await signInWithGoogle()
                    } catch {
                      handleNavClick('auth')
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-[#0F4C81] to-[#1FB8A6] hover:opacity-95 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {/* Google G icon */}
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                  </svg>
                  <span>Google Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile actions — navigation lives in the bottom bar (BottomNav) */}
          <div className="flex md:hidden items-center gap-1.5 ml-auto shrink-0">
            {isAuthenticated && <NotificationCenter className="sm:hidden" />}
            <ThemeToggle className="sm:hidden" />
          </div>
        </div>
      </div>
    </header>
  )
}
