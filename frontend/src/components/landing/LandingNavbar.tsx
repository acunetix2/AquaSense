import React, { useState, useEffect } from 'react'
import {
  Droplets,
  Menu,
  X,
  BarChart2,
  Waves,
  MapPin,
  Home,
  ArrowRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import type { ActiveView } from '../../types/observation'

export const LandingNavbar: React.FC = () => {
  const { activeView, setActiveView } = useApp()
  const { isAuthenticated, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      // if the section doesn't exist, go to landing first
      setActiveView('landing')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }
  }

  return (
    <header
      className={`public-nav sticky top-0 z-40 w-full transition-shadow duration-200 ${
        scrolled ? 'shadow-lg border-b border-slate-200' : 'border-b border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* ── Brand Logo ── */}
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 focus:outline-none group cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#1FB8A6] flex items-center justify-center text-white shadow-md shadow-sky-900/15 group-hover:scale-105 transition-transform duration-200">
              <Droplets size={22} className="stroke-[2.2]" />
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                Aqua<span className="text-[#0284C7]">Sense</span>
              </span>
              <span className="block text-[11px] text-slate-600 font-normal -mt-0.5 tracking-wide">
                Freshwater Intelligence
              </span>
            </div>
          </button>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1 bg-transparent">

            {/* Home — pill active state */}
            <button
              onClick={() => handleNavClick('landing')}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer group ${
                activeView === 'landing' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home size={15} className="text-[#0284C7]" />
              <span>Home</span>
              {activeView === 'landing' && <span className="absolute -bottom-0.5 left-4 right-4 h-[2.5px] rounded-full bg-[#0284C7]" />}
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <BarChart2 size={15} className="text-[#0284C7]" />
              <span>Steps</span>
            </button>

            <button
              onClick={() => scrollToSection('featured-rivers')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Waves size={15} className="text-[#0284C7]" />
              <span>Rivers</span>
            </button>

            <button
              onClick={() => handleNavClick('public-map')}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'public-map' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin size={15} className="text-[#0284C7]" />
              <span>Public Basin Map</span>
              {activeView === 'public-map' && <span className="absolute -bottom-0.5 left-4 right-4 h-[2.5px] rounded-full bg-[#0284C7]" />}
            </button>
          </nav>

          {/* ── Right CTA ── */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('home')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Go to App</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('signup')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#071722] px-5 pt-4 pb-6 space-y-2 shadow-xl">
          <button
            onClick={() => handleNavClick('landing')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 flex items-center gap-2"
          >
            <Home size={17} className="text-[#1FB8A6]" />
            Home
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-2"
          >
            <BarChart2 size={17} className="text-[#0284C7]" />
            Steps
          </button>
          <button
            onClick={() => scrollToSection('featured-rivers')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-2"
          >
            <Waves size={17} className="text-[#0284C7]" />
            Rivers
          </button>
          <button
            onClick={() => handleNavClick('public-map')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-2"
          >
            <MapPin size={17} className="text-[#0284C7]" />
            Public Basin Map
          </button>

          <div className="pt-3 border-t border-white/10">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('home')}
                className="w-full py-3 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Go to App Workspace ({user?.name})</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('signup')}
                className="w-full py-3 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Get Started — Sign In / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
