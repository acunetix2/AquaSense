import React, { useState } from 'react'
import {
  Droplets,
  Layers,
  Sparkles,
  Camera,
  ShieldCheck,
  Activity,
  ArrowRight,
  MapPin,
  Globe,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { SignalBadge } from '../common/SignalBadge'
import { CustomDropdown } from '../common/CustomDropdown'
import { PublicObservationCard } from '../common/PublicObservationCard'
import { GLOBAL_WATERWAYS, CONTINENTS, type GlobalWaterway } from '../../data/globalWaterways'

// Curated showcase river slides matching inspiration.png Screen 1
const HERO_RIVER_SLIDES = [
  {
    id: 'victoria',
    site_name: 'Lake Victoria Basin',
    location: 'Kisumu / Entebbe Riparian Zone',
    headline: 'Rivers build healthier communities',
    description: 'Clean water supports millions of people, vibrant fisheries, wildlife corridors, and local agricultural economies.',
    signal: 'normal' as const,
    confidence: '94%',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'danube',
    site_name: 'Danube River Riparian Corridor',
    location: 'Wachau Valley, Austria',
    headline: 'Transboundary European Waterways',
    description: 'Continuous monitoring helps maintain biodiversity hotspots and protect municipal drinking reserves.',
    signal: 'watch' as const,
    confidence: '86%',
    image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'amazon',
    site_name: 'Amazon Rainforest Tributaries',
    location: 'Manaus Confluence, Brazil',
    headline: 'The World’s Largest Freshwater Artery',
    description: 'Community alerts enable rapid responses to seasonal siltation, agricultural runoff, and aquatic health.',
    signal: 'normal' as const,
    confidence: '96%',
    image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
]

export const LandingPage: React.FC = () => {
  const { setActiveView, observations, openObservationDetail } = useApp()
  const { isAuthenticated } = useAuth()
  const [heroSlideIdx, setHeroSlideIdx] = useState(0)
  const [selectedContinent, setSelectedContinent] = useState<string>('All Continents')
  const [selectedWaterwayType, setSelectedWaterwayType] = useState<string>('all')
  const [selectedPublicCategory, setSelectedPublicCategory] = useState<string>('All')

  const currentHeroSlide = HERO_RIVER_SLIDES[heroSlideIdx]

  const handleStartCapture = () => {
    setActiveView('capture')
  }

  const handleExploreMap = () => {
    setActiveView('map')
  }

  const handleWaterwayObserve = (_waterway: GlobalWaterway) => {
    setActiveView('capture')
  }

  // Filter global waterways by continent and type
  const filteredGlobalWaterways = GLOBAL_WATERWAYS.filter((w) => {
    const matchesContinent = selectedContinent === 'All Continents' || w.continent === selectedContinent
    const matchesType = selectedWaterwayType === 'all' || w.type === selectedWaterwayType
    return matchesContinent && matchesType
  })

  const continentOptions = CONTINENTS.map((c) => ({
    value: c,
    label: c,
  }))

  const typeOptions = [
    { value: 'all', label: 'All Waterways (Rivers & Lakes)' },
    { value: 'river', label: 'Rivers Only' },
    { value: 'lake', label: 'Lakes Only' },
  ]

  return (
    <div className="space-y-20 py-4 sm:py-6">
      {/* 1. HERO SECTION — real freshwater photograph backdrop + glassmorphism panels */}
      <section className="relative overflow-hidden rounded-3xl border border-white/20 p-6 sm:p-10 lg:p-12 shadow-sm text-white">
        {/* Real (non-AI) waterfall photograph as the full-bleed backdrop */}
        <img
          src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80"
          alt="Forest waterfall feeding a freshwater stream"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06263f]/95 via-[#06263f]/85 to-[#06263f]/55" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-sky-100 text-xs font-semibold">
              <Sparkles size={14} className="text-teal-300" />
              <span>Real-Time Freshwater Watershed Monitoring</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-lg">
              Healthier Freshwater.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-200">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-sky-100 max-w-lg leading-relaxed">
              See it. Share it. Help protect our rivers, streams and lakes. Real-time community stream monitoring with automated visual intelligence and hydrologist review.
            </p>

            {/* CTAs (Compact, not oversized - matching inspiration.png) */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleStartCapture}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0F4C81] bg-white hover:bg-sky-50 shadow-md transition-all duration-150 cursor-pointer active:scale-98"
              >
                <span>Assess a Stream →</span>
              </button>

              <button
                type="button"
                onClick={handleExploreMap}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md shadow-2xs transition-all duration-150 cursor-pointer"
              >
                <Layers size={15} className="text-teal-300" />
                <span>Explore Live Basin Map</span>
              </button>
            </div>

            {/* Three key pillars matching Screen 1 bottom icons */}
            <div className="pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-sky-100 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 text-sky-200 flex items-center justify-center shrink-0">
                  <Camera size={14} />
                </div>
                <span>Capture observations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 text-teal-200 flex items-center justify-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <span>Get AI-assisted insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 text-indigo-200 flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <span>Support research and communities</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: frosted-glass river card with interactive slider */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 overflow-hidden shadow-2xl group">
              {/* Main River Image */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900/40">
                <img
                  src={currentHeroSlide.image_url}
                  alt={currentHeroSlide.site_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Signal Badge */}
                <div className="absolute top-3.5 left-3.5">
                  <SignalBadge signal={currentHeroSlide.signal} size="md" />
                </div>

                {/* Telemetry pill */}
                <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                  <Activity size={12} className="text-teal-300" />
                  <span>AI Confidence: {currentHeroSlide.confidence}</span>
                </div>

                {/* Location indicator */}
                <div className="absolute bottom-3 left-3.5 px-3 py-1 rounded-lg bg-slate-900/70 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-1.5">
                  <MapPin size={13} className="text-sky-300" />
                  <span>{currentHeroSlide.site_name} • {currentHeroSlide.location}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-2.5 text-left">
                <h3 className="text-xl font-bold text-white leading-snug">
                  {currentHeroSlide.headline}
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                  {currentHeroSlide.description}
                </p>

                {/* Carousel controls */}
                <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {HERO_RIVER_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setHeroSlideIdx(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          heroSlideIdx === idx ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <span className="text-xs text-sky-200/80">
                    Watershed {heroSlideIdx + 1} of 3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. GLOBAL WATERWAYS EXPLORER (Worldwide Rivers & Lakes Across Continents) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81]">
              <Globe size={14} className="text-[#1FB8A6]" />
              <span>Worldwide Freshwater Explorer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Monitored Rivers & Lakes Worldwide
            </h2>
            <p className="text-sm text-slate-500 max-w-xl">
              Select freshwater basins across Africa, Europe, Asia, the Americas, and Oceania to examine conditions or begin an observation.
            </p>
          </div>

          {/* Filter Controls Using CustomDropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-48">
              <CustomDropdown
                label="Continent"
                options={continentOptions}
                value={selectedContinent}
                onChange={setSelectedContinent}
              />
            </div>
            <div className="w-56">
              <CustomDropdown
                label="Waterbody Type"
                options={typeOptions}
                value={selectedWaterwayType}
                onChange={setSelectedWaterwayType}
              />
            </div>
          </div>
        </div>

        {/* Global Waterways Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGlobalWaterways.slice(0, 6).map((waterway) => (
            <div
              key={waterway.id}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-[#0F4C81]/30 transition-all flex flex-col justify-between space-y-4 text-left group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-sky-50 text-[#0F4C81] border border-sky-100">
                    {waterway.type === 'river' ? 'River' : 'Lake'} • {waterway.continent}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {waterway.latitude.toFixed(2)}°, {waterway.longitude.toFixed(2)}°
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0F4C81] transition-colors">
                  {waterway.name}
                </h3>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#0F4C81] shrink-0" />
                  <span>{waterway.country}</span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {waterway.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic truncate max-w-[170px]">
                  {waterway.significance}
                </span>

                <button
                  type="button"
                  onClick={() => handleWaterwayObserve(waterway)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C81] hover:text-[#0c3c66] hover:underline cursor-pointer"
                >
                  <span>Observe Stream</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. RECENT COMMUNITY WATERWAY ANALYSES (Public Basin Analysed Cards with Uploader Details) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81]">
              <Sparkles size={14} className="text-[#1FB8A6]" />
              <span>Live Public Basin Reports</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Recent Basin Observations
            </h2>
            <p className="text-sm text-slate-500 max-w-xl">
              Real field uploads verified across regional freshwater watersheds. Discover signal alerts, water clarity ratings, and civic contributors.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Riparian', 'Urban Stream', 'Rapids', 'Lakes'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedPublicCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedPublicCategory === cat
                    ? 'bg-[#0F4C81] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Public Observation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {observations
            .filter((obs) => {
              if (selectedPublicCategory === 'All') return true
              const text = `${obs.site_name} ${obs.notes || ''} ${obs.location_address || ''}`.toLowerCase()
              if (selectedPublicCategory === 'Urban Stream') return text.includes('canal') || text.includes('urban') || text.includes('drain') || text.includes('bronx') || text.includes('runoff')
              if (selectedPublicCategory === 'Rapids') return text.includes('rapids') || text.includes('mountain') || text.includes('creek')
              if (selectedPublicCategory === 'Lakes') return text.includes('lake') || text.includes('reservoir')
              return !text.includes('canal') && !text.includes('lake')
            })
            .slice(0, 3)
            .map((obs) => (
              <PublicObservationCard
                key={obs.id}
                observation={obs}
                onSelect={() => openObservationDetail(obs)}
              />
            ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setActiveView(isAuthenticated ? 'home' : 'map')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0F4C81] bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-all cursor-pointer"
          >
            <span>{isAuthenticated ? 'View Full Community Feed' : 'Explore All on Basin Map'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-[#0F4C81]">
            The AquaSense Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How The System Protects Local Watersheds
          </h2>
          <p className="text-slate-500 text-sm">
            A continuous loop connecting community observers, automated vision models, and hydrology experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Module 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group">
            <div>
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
                  alt="Citizen scientist photographing river"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white flex items-center gap-1">
                  <Camera size={11} className="text-teal-300" />
                  <span>Step 1: Capture</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Guided Field Capture</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pin stream GPS coordinates, photograph water bodies, and note clarity, odor, and debris in under 60 seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group">
            <div>
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80"
                  alt="Water testing and AI diagnostics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white flex items-center gap-1">
                  <Sparkles size={11} className="text-teal-300" />
                  <span>Step 2: AI Diagnostic</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Vision Model Diagnostics</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automated visual inspection detects water clarity (cloudiness), algae blooms, flow disruptions, and floating waste with calibrated confidence scores.
                </p>
              </div>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group">
            <div>
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80"
                  alt="GIS mapping and watershed visualization"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white flex items-center gap-1">
                  <Layers size={11} className="text-teal-300" />
                  <span>Step 3: Basin GIS Map</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Interactive Basin Mapping</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every observation is plotted on interactive OpenStreetMap tiles with color-coded signal indicators and historical evidence records.
                </p>
              </div>
            </div>
          </div>

          {/* Module 4 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group">
            <div>
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"
                  alt="Hydrologist peer review"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-white flex items-center gap-1">
                  <ShieldCheck size={11} className="text-teal-300" />
                  <span>Step 4: Certified Review</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Expert Reviewer Queue</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Certified hydrologists verify findings, add calibration notes, and escalate critical anomalies to regional water councils.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER (Glassmorphism + River Backdrop) */}
      <section className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-white shadow-lg">
        {/* Background Image with Deep Overlay */}
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
          alt="Freshwater stream"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C81]/95 via-[#0F4C81]/85 to-[#1FB8A6]/80 backdrop-blur-xs" />

        <div className="max-w-2xl space-y-4 relative z-10 text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-teal-200 text-xs font-semibold backdrop-blur-md">
            Ready to Protect Your Local Watershed?
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            Start Monitoring Streams in Your Neighborhood Today.
          </h2>
          <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
            Join civic observers and certified hydrologists across regional catchments. Sign in with Google or create an account in seconds.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => (isAuthenticated ? setActiveView('home') : setActiveView('signup'))}
              className="px-5 py-2.5 rounded-xl font-semibold bg-white text-[#0F4C81] hover:bg-slate-100 transition-colors shadow-sm cursor-pointer text-sm"
            >
              {isAuthenticated ? 'Open Full Workspace' : 'Sign In / Create Account'}
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0F4C81] flex items-center justify-center text-white">
            <Droplets size={13} />
          </div>
          <span className="font-semibold text-slate-800">AquaSense Freshwater Intelligence</span>
          <span>• Civic science open monitoring platform</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setActiveView('map')} className="hover:text-slate-800 cursor-pointer">
            Basin Map
          </button>
          <button type="button" onClick={() => setActiveView('auth')} className="hover:text-slate-800 cursor-pointer">
            Sign In / Reviewer Portal
          </button>
        </div>
      </footer>
    </div>
  )
}
