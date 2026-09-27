import React, { useState } from 'react'
import {
  Layers,
  Camera,
  ShieldCheck,
  Activity,
  ArrowRight,
  MapPin,
  Globe,
  Waves,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { SignalBadge } from '../common/SignalBadge'
import { CustomDropdown } from '../common/CustomDropdown'
import { PublicObservationCard } from '../common/PublicObservationCard'
import { GLOBAL_WATERWAYS, CONTINENTS, type GlobalWaterway } from '../../data/globalWaterways'
import { WATER_CATEGORIES, filterByCategory, countByCategory } from '../../data/waterCategories'
import { WaterwayArt } from './WaterwayArt'
import { PublicFooter } from '../common/PublicFooter'

// Curated showcase river slides matching inspiration.png Screen 1
const HERO_RIVER_SLIDES = [
  {
    id: 'victoria',
    site_name: 'Lake Victoria Basin',
    location: 'Kisumu / Entebbe Riparian Zone',
    headline: 'Freshwater observations, shared context',
    description: 'Freshwater ecosystems support communities, fisheries, wildlife corridors, and local agricultural economies.',
    signal: 'normal' as const,
    confidence: '94%',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'danube',
    site_name: 'Danube River Riparian Corridor',
    location: 'Wachau Valley, Austria',
    headline: 'Transboundary European Waterways',
    description: 'Community observations can help researchers recognize changes across a shared river corridor.',
    signal: 'watch' as const,
    confidence: '86%',
    image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'amazon',
    site_name: 'Amazon Rainforest Tributaries',
    location: 'Manaus Confluence, Brazil',
    headline: 'The World’s Largest Freshwater Artery',
    description: 'Repeated observations make seasonal siltation, runoff, and habitat change easier to see over time.',
    signal: 'normal' as const,
    confidence: '96%',
    image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
]

const OBSERVATION_FLOW = [
  {
    number: '01',
    label: 'Document',
    title: 'Record what you can see',
    description: 'Choose a waterway, add a current photo, and describe visible conditions in your own words.',
    image: '/images/river_nairobi.jpg',
    imageAlt: 'Nairobi River in Kenya',
    icon: Camera,
  },
  {
    number: '02',
    label: 'Check',
    title: 'AI checks visible cues',
    description: 'The system compares the photo and answers, then asks for clearer evidence when it cannot assess responsibly.',
    image: '/images/river_mara.jpg',
    imageAlt: 'Mara River in Kenya and Tanzania',
    icon: Activity,
  },
  {
    number: '03',
    label: 'Locate',
    title: 'Place it on the basin map',
    description: 'A dated record keeps its location, visual evidence, and monitoring signal together for people to explore.',
    image: '/images/lake_victoria.jpg',
    imageAlt: 'Lake Victoria in East Africa',
    icon: MapPin,
  },
  {
    number: '04',
    label: 'Review',
    title: 'Add expert accountability',
    description: 'Reviewers can verify or flag a record and explain whether their judgement agrees with the AI assessment.',
    image: '/images/lake_tanganyika.jpg',
    imageAlt: 'Lake Tanganyika in East Africa',
    icon: ShieldCheck,
  },
] as const

export const LandingPage: React.FC = () => {
  const { setActiveView, observations, openObservationDetail } = useApp()
  const { isAuthenticated } = useAuth()
  const [heroSlideIdx, setHeroSlideIdx] = useState(0)
  const [selectedContinent, setSelectedContinent] = useState<string>('All Continents')
  const [selectedWaterwayType, setSelectedWaterwayType] = useState<string>('all')
  const [selectedPublicCategory, setSelectedPublicCategory] = useState<string>('all')

  const currentHeroSlide = HERO_RIVER_SLIDES[heroSlideIdx]

  const handleStartCapture = () => {
    setActiveView('capture')
  }

  const handleExploreMap = () => {
    setActiveView('public-map')
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
  const showcasedWaterways = filteredGlobalWaterways.slice(0, 8)
  const publicResults = filterByCategory(observations, selectedPublicCategory)
  const publicResultCount = publicResults.length

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
    <div className="public-experience space-y-12 sm:space-y-16 py-4 sm:py-6">
      {/* 1. HERO SECTION — Clean light theme with freshwater photograph and content overlay */}
      <section className="public-hero relative overflow-hidden rounded-3xl border border-slate-200 shadow-lg bg-[#F9FAFB]">
        {/* Real (non-AI) waterfall photograph as the full-bleed backdrop - FULLY VISIBLE */}
        <img
          src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80"
          alt="Forest waterfall feeding a freshwater stream"
          className="absolute inset-0 w-full h-full object-cover rounded-3xl"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 p-6 sm:p-10 lg:p-12">
          {/* Hero Left Content - Solid white background for text visibility */}
          <div className="lg:col-span-6 space-y-6 text-left bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-slate-200 shadow-lg">
            <div className="inline-flex px-3 py-1.5 rounded-full bg-[#0284C7]/10 border border-[#0284C7]/20 text-[#0284C7] text-xs font-semibold">
              Community freshwater observations
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Freshwater observations.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-emerald-600">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
              Document what you see in local rivers, streams, and lakes. AquaSense combines community observations, transparent visual analysis, and reviewer feedback.
            </p>

            {/* CTAs (Compact, not oversized - matching inspiration.png) */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleStartCapture}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-all duration-150 cursor-pointer active:scale-95 focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2"
              >
                <span>Record an observation</span>
              </button>

              <button
                type="button"
                onClick={handleExploreMap}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0284C7] bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-sm transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2"
              >
                <Layers size={15} className="text-[#0284C7]" />
                <span>Explore Live Basin Map</span>
              </button>
            </div>

            {/* Three key pillars matching Screen 1 bottom icons */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                  <Camera size={14} />
                </div>
                <span>Capture observations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Layers size={14} />
                </div>
                <span>Get photo-assisted insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <span>Support research and communities</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: Clean card with river photo and signal badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl bg-[#F9FAFB] border border-slate-200 overflow-hidden shadow-lg group">
              {/* Main River Image */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-200">
                <img
                  src={currentHeroSlide.image_url}
                  alt={currentHeroSlide.site_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Signal Badge */}
                <div className="absolute top-3.5 left-3.5">
                  <SignalBadge signal={currentHeroSlide.signal} size="md" />
                </div>

                {/* Location indicator */}
                <div className="absolute bottom-3 left-3.5 px-3 py-1 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                  <MapPin size={13} className="text-[#0284C7]" />
                  <span>{currentHeroSlide.site_name} • {currentHeroSlide.location}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-2.5 text-left">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentHeroSlide.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentHeroSlide.description}
                </p>

                {/* Carousel controls */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {HERO_RIVER_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setHeroSlideIdx(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 ${
                          heroSlideIdx === idx ? 'w-7 bg-[#0284C7]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <span className="text-xs text-slate-500">
                    Watershed {heroSlideIdx + 1} of 3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. GLOBAL WATERWAYS EXPLORER (Worldwide Rivers & Lakes Across Continents) */}
      <section id="featured-rivers" className="public-section space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Globe size={14} className="text-[#0284C7]" />
              <span>Worldwide Freshwater Explorer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Monitored Rivers & Lakes Worldwide
            </h2>
            <p className="text-sm max-w-xl text-slate-600">
              Select freshwater basins across Africa, Europe, Asia, the Americas, and Oceania to examine conditions or begin an observation.
            </p>
          </div>

          {/* Filter Controls Using CustomDropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-48">
              <CustomDropdown
                className="public-dropdown"
                buttonClassName="public-dropdown-button"
                label="Continent"
                options={continentOptions}
                value={selectedContinent}
                onChange={setSelectedContinent}
              />
            </div>
            <div className="w-56">
              <CustomDropdown
                className="public-dropdown"
                buttonClassName="public-dropdown-button"
                label="Waterbody Type"
                options={typeOptions}
                value={selectedWaterwayType}
                onChange={setSelectedWaterwayType}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-600" aria-live="polite">
          <span>
            Showing {showcasedWaterways.length} of {filteredGlobalWaterways.length} waterways
          </span>
          <button
            type="button"
            onClick={handleExploreMap}
            className="inline-flex items-center gap-1 font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 rounded"
          >
            Explore on map
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>

        {/* Global Waterways Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {showcasedWaterways.map((waterway) => (
            <article
              key={waterway.id}
              className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col text-left group border border-slate-200 bg-[#F9FAFB]"
            >
              <div className="relative h-44 overflow-hidden bg-slate-200">
                <WaterwayArt waterway={waterway} className="absolute inset-0 h-full w-full" />
                {waterway.image_url && (
                  <img
                    src={waterway.image_url}
                    alt={`${waterway.name} waterway view`}
                    className="relative h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                {/* Remove gradient - keep images crystal clear */}
                <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                  {waterway.type === 'river' ? 'River' : 'Lake'} · {waterway.continent}
                </span>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-xs font-medium bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 text-slate-800 shadow-sm">
                  <MapPin size={13} className="text-[#0284C7]" aria-hidden="true" />
                  {waterway.country}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors">
                      {waterway.name}
                    </h3>
                    <span className="shrink-0 text-[11px] font-mono text-slate-400">
                      {waterway.latitude.toFixed(2)}°, {waterway.longitude.toFixed(2)}°
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {waterway.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 italic line-clamp-2">
                    {waterway.significance}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleWaterwayObserve(waterway)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] hover:underline cursor-pointer focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 rounded transition-colors"
                    aria-label={`Start an observation for ${waterway.name}`}
                  >
                    <span>Start observation</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>


      {/* 4. RECENT COMMUNITY OBSERVATIONS */}
      <section className="public-section space-y-6">
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Activity size={14} className="text-[#0284C7]" />
            Live Public Basin Reports
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Recent Basin Observations
          </h2>
          <p className="text-sm max-w-xl text-slate-600">
            Explore recent community observations, their visible evidence, and the people helping document watershed change.
          </p>
        </div>

        {/* Category filter cards - same categories as the public basin map, counts computed from live records */}
        <div
          className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory"
          role="tablist"
          aria-label="Filter observations by waterbody category"
        >
          {WATER_CATEGORIES.map((cat) => {
            const count = countByCategory(observations, cat.id)
            const active = selectedPublicCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedPublicCategory(cat.id)}
                className={`relative flex-shrink-0 w-52 h-32 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer snap-start group ${
                  active
                    ? 'border-[#0284C7] shadow-lg scale-[1.02]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-left">
                  <h3 className="text-base font-bold bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 shadow-sm inline-block mb-1.5">
                    {cat.label}
                  </h3>
                  <span className="text-xs font-semibold bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 shadow-sm inline-block w-fit">
                    {count} record{count === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-slate-500" aria-live="polite">
          {publicResultCount} matching record{publicResultCount === 1 ? '' : 's'} · showing the{' '}
          {Math.min(6, publicResultCount)} most recent
        </p>

        {publicResultCount === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">No records in this category yet</p>
            <p className="mt-1.5 text-xs text-slate-500">
              Try another category or start the first observation.
            </p>
          </div>
        )}

        {/* Public Observation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicResults
            .slice(0, 6)
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0284C7] hover:text-[#0369A1] bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2"
          >
            <span>{isAuthenticated ? 'View Full Community Feed' : 'Explore All on Basin Map'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 5. OBSERVATION FLOW */}
      <section id="how-it-works" className="public-section space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
            <Layers size={14} className="text-[#0284C7]" />
            A clear evidence journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            From a local photo to a shared, reviewable record
          </h2>
          <p className="text-sm text-slate-600">
            Each stage preserves context, so a photo becomes more useful without pretending to be a laboratory result.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {OBSERVATION_FLOW.map((step, index) => {
            const StepIcon = step.icon
            return (
              <article key={step.number} className="relative rounded-2xl overflow-visible shadow-sm hover:shadow-md transition-all text-left group bg-[#F9FAFB] border border-slate-200">
                <div className="overflow-hidden rounded-2xl">
                  <div className="relative h-44 overflow-hidden bg-slate-200">
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Remove gradient - keep images crystal clear */}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                      <StepIcon size={12} className="text-[#0284C7]" aria-hidden="true" />
                      {step.number} · {step.label}
                    </span>
                  </div>
                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {index < OBSERVATION_FLOW.length - 1 && (
                  <div className="hidden xl:flex absolute -right-4 top-20 z-10 h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-[#F9FAFB] text-[#0284C7] shadow-lg" aria-hidden="true">
                    <ArrowRight size={15} />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* 6. PUBLIC RECORD EXPECTATIONS */}
      <section className="public-section grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
        <div className="relative min-h-72 overflow-hidden rounded-2xl bg-slate-200">
          <img
            src="/images/athi_river.jpg"
            alt="Athi River in Kenya"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {/* Subtle gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/10 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <span className="inline-flex rounded-full border border-slate-200 bg-white backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-[#0284C7] shadow-sm">Athi River · Kenya</span>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-slate-900 bg-white backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-sm">Useful freshwater evidence starts with a real place, a clear view, and enough context for someone else to understand it.</p>
          </div>
        </div>

        <div className="space-y-5 text-left">
          <div>
            <span className="public-kicker inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} className="text-[#0284C7]" />
              Evidence before conclusions
            </span>
            <h2 className="public-title mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">What a public record carries with it</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Place', 'Waterway and location context'],
              ['Evidence', 'Photos and observer notes'],
              ['Review', 'AI and reviewer decision trail'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            AquaSense documents visible conditions. It does not replace laboratory testing, an official water-quality determination, or an emergency response.
          </p>
        </div>
      </section>

      {/* 7. PARTICIPATION PATHS */}
      <section className="public-section space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Globe size={14} className="text-[#0284C7]" />
            Choose a starting point
          </span>
          <h2 className="public-title text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Take the next useful step for your watershed</h2>
          <p className="public-copy text-sm text-slate-600">Whether you are exploring, contributing, or reviewing, each path starts with the same clear evidence record.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button type="button" onClick={() => document.getElementById('featured-rivers')?.scrollIntoView({ behavior: 'smooth' })} className="text-left rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer">
            <Waves size={20} className="text-[#0284C7]" aria-hidden="true" />
            <h3 className="mt-4 font-bold text-slate-900">Explore waterways</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Browse rivers and lakes with local photos and basin context.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">Browse waterways <ArrowRight size={13} aria-hidden="true" /></span>
          </button>
          <button type="button" onClick={handleExploreMap} className="text-left rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer">
            <MapPin size={20} className="text-[#0284C7]" aria-hidden="true" />
            <h3 className="mt-4 font-bold text-slate-900">Explore the basin map</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">See public observations by location and monitoring signal.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">Open public map <ArrowRight size={13} aria-hidden="true" /></span>
          </button>
          <button type="button" onClick={handleStartCapture} className="text-left rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer">
            <Camera size={20} className="text-[#0284C7]" aria-hidden="true" />
            <h3 className="mt-4 font-bold text-slate-900">Add an observation</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Bring a current photo, your location, and a few field notes.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">Start an observation <ArrowRight size={13} aria-hidden="true" /></span>
          </button>
        </div>
      </section>

      {/* 7. CALL TO ACTION BANNER */}
      <section className="public-cta relative rounded-2xl overflow-hidden p-8 sm:p-12 text-white shadow-lg bg-gradient-to-r from-[#0284C7] to-emerald-600">
        {/* Background Image with Overlay */}
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
          alt="Freshwater stream"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0284C7]/95 via-[#0284C7]/90 to-emerald-600/85 backdrop-blur-xs" />

        <div className="max-w-2xl space-y-4 relative z-10 text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
            Add a useful local observation
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
            Help make freshwater change easier to see.
          </h2>
          <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
            Join observers and reviewers building a clearer, evidence-led picture of local freshwater conditions.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => (isAuthenticated ? setActiveView('home') : setActiveView('signup'))}
              className="px-5 py-2.5 rounded-xl font-semibold bg-white text-[#0284C7] hover:bg-sky-50 transition-colors shadow-sm cursor-pointer text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0284C7]"
            >
              {isAuthenticated ? 'Open workspace' : 'Create a free account'}
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <PublicFooter />
    </div>
  )
}
