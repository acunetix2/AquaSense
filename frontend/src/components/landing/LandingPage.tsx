import React, { useState } from 'react'
import {
  ArrowRight,
  MapPin,
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
  },
  {
    number: '02',
    label: 'Check',
    title: 'AI checks visible cues',
    description: 'The system compares the photo and answers, then asks for clearer evidence when it cannot assess responsibly.',
    image: '/images/river_mara.jpg',
    imageAlt: 'Mara River in Kenya and Tanzania',
  },
  {
    number: '03',
    label: 'Locate',
    title: 'Place it on the basin map',
    description: 'A dated record keeps its location, visual evidence, and monitoring signal together for people to explore.',
    image: '/images/lake_victoria.jpg',
    imageAlt: 'Lake Victoria in East Africa',
  },
  {
    number: '04',
    label: 'Review',
    title: 'Add expert accountability',
    description: 'Reviewers can verify or flag a record and explain whether their judgement agrees with the AI assessment.',
    image: '/images/lake_tanganyika.jpg',
    imageAlt: 'Lake Tanganyika in East Africa',
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

  // Derived from the records actually loaded — never invented for the hero.
  const heroFigures = [
    { label: 'Public records', value: observations.length },
    {
      label: 'Sites covered',
      value: new Set(observations.map((o) => o.site_name?.trim()).filter(Boolean)).size,
    },
    { label: 'Reviewer-verified', value: observations.filter((o) => o.status === 'verified').length },
  ]

  return (
    <div className="public-experience space-y-12 sm:space-y-16 py-4 sm:py-6">
      {/* 1. HERO — flat navy colour field, signage label, real figures */}
      <section className="public-hero public-hero-bleed bg-navy-900 text-white border-t-4 border-[#0284C7]">
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Hero left — label, plain headline, CTAs, derived figures */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <p className="as-label text-[#63C5F5]">Community freshwater monitoring</p>

            <h1 className="text-[32px] sm:text-5xl lg:text-[54px] font-bold tracking-[-0.035em] leading-[1.06] text-white max-w-2xl">
              What this river looked like, today.
            </h1>

            <p className="text-base sm:text-lg text-navy-100 max-w-xl leading-relaxed">
              AquaSense turns one phone photo and four plain questions into a dated, located,
              reviewer-checkable record of freshwater conditions — open to anyone in the basin,
              and never a verdict on whether the water is safe.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleStartCapture}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-[15px] font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#63C5F5]"
              >
                <span>Record an observation</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleExploreMap}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-[15px] font-bold text-white border border-navy-600 hover:bg-navy-800 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#63C5F5]"
              >
                <span>Explore the basin map</span>
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px bg-navy-700 border border-navy-700 rounded-md overflow-hidden max-w-xl">
              {heroFigures.map((figure) => (
                <div key={figure.label} className="bg-navy-900 px-4 py-3">
                  <dt className="as-label text-navy-100/70">{figure.label}</dt>
                  <dd className="as-figure text-[28px] sm:text-3xl text-white mt-1.5">{figure.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="space-y-2.5 text-sm text-navy-100 max-w-xl border-t border-navy-700 pt-6">
              {[
                'Photo and field answers, confirmed by the observer before anything is recorded.',
                'A visible-condition signal with an auditable AI decision trail attached.',
                'Certified reviewers verify or flag, and their reasoning stays public.',
              ].map((line) => (
                <li key={line} className="flex gap-2.5 leading-relaxed">
                  <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-[#0284C7]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hero right — the record itself, framed flat */}
          <div className="lg:col-span-5">
            <figure className="bg-navy-800 border border-navy-700 rounded-md overflow-hidden">
              <div className="relative h-56 sm:h-64 bg-navy-950 overflow-hidden">
                <img
                  src={currentHeroSlide.image_url}
                  alt={currentHeroSlide.site_name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  <SignalBadge signal={currentHeroSlide.signal} size="md" />
                </div>
              </div>

              <figcaption className="p-5 space-y-2.5 text-left">
                <p className="as-label text-[#63C5F5]">{currentHeroSlide.site_name}</p>
                <h2 className="text-lg font-bold text-white leading-snug">
                  {currentHeroSlide.headline}
                </h2>
                <p className="text-sm text-navy-100 leading-relaxed">
                  {currentHeroSlide.description}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-navy-100/70">
                  <MapPin size={13} aria-hidden="true" />
                  {currentHeroSlide.location}
                </p>

                <div className="pt-3 border-t border-navy-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    {HERO_RIVER_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setHeroSlideIdx(idx)}
                        className={`h-1.5 transition-all cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#63C5F5] ${
                          heroSlideIdx === idx ? 'w-6 bg-[#0284C7]' : 'w-1.5 bg-navy-600 hover:bg-navy-100/40'
                        }`}
                        aria-label={`Show ${slide.site_name}`}
                        aria-current={heroSlideIdx === idx || undefined}
                      />
                    ))}
                  </div>

                  <span className="text-xs text-navy-100/70 tabular-nums">
                    Basin {heroSlideIdx + 1} of {HERO_RIVER_SLIDES.length}
                  </span>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 2. GLOBAL WATERWAYS EXPLORER (Worldwide Rivers & Lakes Across Continents) */}
      <section id="featured-rivers" className="public-section space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <p className="as-label public-kicker">Freshwater explorer</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Monitored Rivers &amp; Lakes Worldwide
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
              className="public-waterway-card rounded-md overflow-hidden transition-colors text-left group border border-slate-200 bg-paper"
            >
              <div className="relative h-44 overflow-hidden bg-slate-200">
                <WaterwayArt waterway={waterway} className="absolute inset-0 h-full w-full" />
                {waterway.image_url && (
                  <img
                    src={waterway.image_url}
                    alt={`${waterway.name} waterway view`}
                    className="relative h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <span className="absolute left-3 top-3 rounded-sm bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white">
                  {waterway.type === 'river' ? 'River' : 'Lake'} · {waterway.continent}
                </span>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-navy-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <MapPin size={12} aria-hidden="true" />
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
          <p className="as-label public-kicker">Live public basin reports</p>
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
                className={`relative flex-shrink-0 w-52 h-32 rounded-md overflow-hidden border-2 transition-colors cursor-pointer snap-start group text-left ${
                  active ? 'border-[#0284C7]' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 p-3 flex flex-col justify-end text-left">
                  <h3 className="text-base font-bold bg-navy-900 px-2.5 py-1 text-white inline-block mb-1 self-start">
                    {cat.label}
                  </h3>
                  <span className="text-xs font-semibold text-slate-200 self-start">
                    {count} record{count === 1 ? '' : 's'}
                    {active && <span className="ml-2 text-[#63C5F5]">· shown</span>}
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
          <div className="border-y border-slate-300 bg-slate-50 px-6 py-10">
            <p className="text-sm font-semibold text-slate-800">No records in this category yet</p>
            <p className="mt-1.5 text-xs text-slate-600">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-[#0284C7] hover:text-[#0369A1] bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2"
          >
            <span>{isAuthenticated ? 'View Full Community Feed' : 'Explore All on Basin Map'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 5. OBSERVATION FLOW — left-aligned heading, flat numbered panels */}
      <section id="how-it-works" className="public-section space-y-8 scroll-mt-24">
        <div className="max-w-2xl space-y-2 text-left">
          <p className="as-label public-kicker">How a record is built</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            From a local photo to a shared, reviewable record
          </h2>
          <p className="text-sm text-slate-600">
            Each stage preserves context, so a photo becomes more useful without pretending to be a laboratory result.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-md overflow-hidden">
          {OBSERVATION_FLOW.map((step) => {
            return (
              <li key={step.number} className="bg-paper text-left">
                <div className="relative h-40 overflow-hidden bg-slate-200">
                  <img
                    src={step.image}
                    alt={step.imageAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <p className="flex items-baseline gap-2">
                    <span className="as-figure text-2xl text-[#0284C7]">{step.number}</span>
                    <span className="as-label text-slate-500">{step.label}</span>
                  </p>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 6. PUBLIC RECORD EXPECTATIONS */}
      <section className="public-section grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
        <figure className="relative min-h-72 overflow-hidden rounded-md bg-slate-200 border border-slate-200">
          <img
            src="/images/athi_river.jpg"
            alt="Athi River in Kenya"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-navy-900 px-5 py-4 text-left">
            <p className="as-label text-[#63C5F5]">Athi River · Kenya</p>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-white">
              Useful freshwater evidence starts with a real place, a clear view, and enough
              context for someone else to understand it.
            </p>
          </figcaption>
        </figure>

        <div className="space-y-5 text-left">
          <div>
            <p className="as-label public-kicker">Evidence before conclusions</p>
            <h2 className="public-title mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">What a public record carries with it</h2>
          </div>
          <dl className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              ['Place', 'Waterway and location context'],
              ['Evidence', 'Photos and observer notes'],
              ['Review', 'AI and reviewer decision trail'],
            ].map(([title, copy]) => (
              <div key={title} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3">
                <dt className="as-label pt-0.5 text-slate-500">{title}</dt>
                <dd className="text-sm leading-relaxed text-slate-700">{copy}</dd>
              </div>
            ))}
          </dl>
          <p className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            AquaSense documents visible conditions. It does not replace laboratory testing, an official water-quality determination, or an emergency response.
          </p>
        </div>
      </section>

      {/* 7. PARTICIPATION PATHS — flat link rows, not three feature cards */}
      <section className="public-section space-y-6">
        <div className="max-w-2xl space-y-2 text-left">
          <p className="as-label public-kicker">Choose a starting point</p>
          <h2 className="public-title text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Take the next useful step for your watershed</h2>
          <p className="public-copy text-sm text-slate-600">Whether you are exploring, contributing, or reviewing, each path starts with the same clear evidence record.</p>
        </div>
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {[
            {
              title: 'Explore waterways',
              copy: 'Browse rivers and lakes with local photos and basin context.',
              cta: 'Browse waterways',
              onClick: () => document.getElementById('featured-rivers')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              title: 'Explore the basin map',
              copy: 'See public observations by location and monitoring signal.',
              cta: 'Open public map',
              onClick: handleExploreMap,
            },
            {
              title: 'Add an observation',
              copy: 'Bring a current photo, your location, and a few field notes.',
              cta: 'Start an observation',
              onClick: handleStartCapture,
            },
          ].map((path) => (
            <li key={path.title}>
              <button
                type="button"
                onClick={path.onClick}
                className="group flex w-full items-center justify-between gap-6 py-4 text-left cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7]"
              >
                <span className="min-w-0">
                  <span className="block text-base font-bold text-slate-900 group-hover:text-[#0284C7] transition-colors">
                    {path.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">{path.copy}</span>
                </span>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#0284C7] underline decoration-[#0284C7]/40 underline-offset-4 group-hover:decoration-[#0284C7] transition-colors">
                  {path.cta}
                  <ArrowRight size={15} aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. CALL TO ACTION BANNER — solid colour field, no photo, no gradient */}
      <section className="public-cta bg-navy-900 text-white border-t-4 border-[#0284C7] px-6 py-10 sm:px-10 sm:py-12">
        <div className="max-w-2xl space-y-4 text-left">
          <p className="as-label text-[#63C5F5]">Add a record</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-[-0.03em] text-white">
            Help make freshwater change easier to see.
          </h2>
          <p className="text-navy-100 text-sm leading-relaxed">
            Observers and reviewers are building a clearer, evidence-led picture of local
            freshwater conditions — one confirmed record at a time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => (isAuthenticated ? setActiveView('home') : setActiveView('signup'))}
              className="px-6 py-3 rounded-md font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white text-[15px] transition-colors cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#63C5F5]"
            >
              {isAuthenticated ? 'Open workspace' : 'Create a free account'}
            </button>
            <button
              type="button"
              onClick={handleStartCapture}
              className="px-6 py-3 rounded-md font-bold border border-navy-600 text-white hover:bg-navy-800 text-[15px] transition-colors cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#63C5F5]"
            >
              Record an observation
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <PublicFooter />
    </div>
  )
}
