import React, { useState, useMemo } from 'react'
import {
  Camera,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'

import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import { HeroCarousel } from './HeroCarousel'
import { PublicObservationCard } from '../common/PublicObservationCard'
import type { SignalType } from '../../types/observation'

const ECOSYSTEM_CATEGORIES = [
  'All Watersheds',
  'Riparian Corridor',
  'Stream & Rapids',
  'Urban Watershed',
  'Lake & Reservoir',
  'Protected Wetland',
] as const

export const HeroSection: React.FC = () => {
  const { setActiveView, observations, openObservationDetail } = useApp()
  const { user } = useAuth()
  const isReviewer = isReviewerRole(user?.role)

  const [selectedCategory, setSelectedCategory] = useState<string>('All Watersheds')
  const [selectedSignal, setSelectedSignal] = useState<'all' | SignalType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'confidence' | 'priority'>('newest')

  // Calculate live stats
  const stats = useMemo(() => {
    const total = observations.length
    const verified = observations.filter((o) => o.status === 'verified').length
    const investigate = observations.filter((o) => o.signal === 'investigate').length
    const watch = observations.filter((o) => o.signal === 'watch').length
    return { total, verified, investigate, watch }
  }, [observations])

  // Filter and sort observations
  const filteredObservations = useMemo(() => {
    return observations
      .filter((obs) => {
        // Signal filter
        if (selectedSignal !== 'all' && obs.signal !== selectedSignal) {
          return false
        }

        // Category filter
        if (selectedCategory !== 'All Watersheds') {
          const text = `${obs.site_name} ${obs.notes || ''} ${obs.location_address || ''}`.toLowerCase()
          if (selectedCategory === 'Lake & Reservoir' && !text.includes('lake') && !text.includes('reservoir')) return false
          if (selectedCategory === 'Stream & Rapids' && !text.includes('rapids') && !text.includes('mountain') && !text.includes('creek')) return false
          if (selectedCategory === 'Urban Watershed' && !text.includes('canal') && !text.includes('drain') && !text.includes('urban') && !text.includes('runoff') && !text.includes('bronx')) return false
          if (selectedCategory === 'Protected Wetland' && !text.includes('sanctuary') && !text.includes('willow') && !text.includes('wetland')) return false
          if (selectedCategory === 'Riparian Corridor' && (text.includes('lake') || text.includes('canal') || text.includes('rapids'))) return false
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchSite = obs.site_name.toLowerCase().includes(q)
          const matchLocation = (obs.location_address || '').toLowerCase().includes(q)
          const matchObserver = (obs.observer_name || '').toLowerCase().includes(q)
          const matchSummary = (obs.ai_summary || '').toLowerCase().includes(q)
          if (!matchSite && !matchLocation && !matchObserver && !matchSummary) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'confidence') {
          return b.confidence - a.confidence
        }
        if (sortBy === 'priority') {
          const pScore: Record<string, number> = { investigate: 3, watch: 2, normal: 1 }
          return (pScore[b.signal] || 0) - (pScore[a.signal] || 0)
        }
        return 0
      })
  }, [observations, selectedCategory, selectedSignal, searchQuery, sortBy])

  return (
    <div className="space-y-12 py-4 md:py-8 text-left">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-50 via-white to-white border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-sm">
        {/* Soft Background Accent Circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/90 text-[#0284C7] text-xs font-semibold">
              <Sparkles size={14} className="text-[#1FB8A6]" />
              <span>Continuous River & Watershed Monitoring</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Healthier Freshwater.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#1FB8A6]">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Explore public river analyses from community observers and certified hydrologists. Real-time visual diagnostics, explainable evidence, and health tracking across regional watersheds.
            </p>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setActiveView('capture')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-900/10 hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <Camera size={16} />
                <span>Assess a Stream</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setActiveView('map')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              >
                <Layers size={16} className="text-[#0284C7]" />
                <span>Explore Basin Map</span>
              </button>
            </div>

            {/* 3 Metric Pills */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-900">{stats.total}</span>
                <span>Community Records</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-lg text-emerald-800">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span className="font-bold">{stats.verified}</span>
                <span>Hydrologist Verified</span>
              </div>
              {stats.investigate > 0 && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200/70 px-3 py-1.5 rounded-lg text-rose-800">
                  <AlertTriangle size={13} className="text-rose-600" />
                  <span className="font-bold">{stats.investigate}</span>
                  <span>Active Alerts</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Hero Visual Carousel */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* 2. ADVANCED FEED CONTROLS & FILTER BAR */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Community Freshwater Feed
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Field observations and visual analysis uploaded by community members and scientific researchers
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search river, observer, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 focus:border-[#0284C7] shadow-2xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {ECOSYSTEM_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Secondary Filter & Sort Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          {/* Signal Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Signal:</span>
            <button
              onClick={() => setSelectedSignal('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedSignal === 'all'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Signals ({observations.length})
            </button>
            <button
              onClick={() => setSelectedSignal('normal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedSignal === 'normal'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Normal</span>
            </button>
            <button
              onClick={() => setSelectedSignal('watch')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedSignal === 'watch'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Eye size={13} />
              <span>Watch</span>
            </button>
            <button
              onClick={() => setSelectedSignal('investigate')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedSignal === 'investigate'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Investigate</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="confidence">Highest Confidence</option>
              <option value="priority">Priority Alerts</option>
            </select>
          </div>
        </div>

        {/* 3. OBSERVATION CARDS GRID */}
        {filteredObservations.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center mx-auto">
              <Search size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No waterway analyses match your filters</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Try selecting a different ecosystem category, clearing your search query, or viewing all signal types.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All Watersheds')
                setSelectedSignal('all')
                setSearchQuery('')
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredObservations.map((obs) => (
              <PublicObservationCard
                key={obs.id}
                observation={obs}
                onSelect={() => openObservationDetail(obs)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. ONE HEALTH / ECOSYSTEM SCIENTIFIC SECTION */}
      <section className="bg-gradient-to-r from-[#0284C7] to-sky-600 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-sky-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-xs font-semibold tracking-wide">
              <ShieldCheck size={14} />
              <span>OneAquaHealth Interoperability</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Evidence-based Freshwater Intelligence
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Freshwater health directly impacts community drinking water, urban cooling, biodiversity, and epidemiological resilience. AquaSense links citizen observations to explainable AI and HL7 FHIR standards for IEEE and scientific research integration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center items-stretch md:items-end">
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-5 py-3 rounded-xl bg-white text-[#0284C7] font-bold text-sm hover:bg-sky-50 shadow-md transition-all cursor-pointer text-center"
            >
              Explore Impact Dashboard
            </button>
            {isReviewer && (
              <button
                onClick={() => setActiveView('reviewer-queue')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition-all cursor-pointer text-center"
              >
                Open Reviewer Queue
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
