import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Calendar, Map as MapIcon, MapPin, X, Droplets } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { SignalBadge } from '../common/SignalBadge'
import { MapView } from './MapView'
import { PublicFooter } from '../common/PublicFooter'
import { WATER_CATEGORIES, filterByCategory, countByCategory } from '../../data/waterCategories'
import type { Observation } from '../../types/observation'

const formatDate = (value?: string) => {
  if (!value) return 'Recent'
  try {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Recent'
  }
}

export const PublicBasinMap: React.FC = () => {
  const { observations } = useApp()
  const [category, setCategory] = useState<string>('all')
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const [showMap, setShowMap] = useState(false)
  const mapSectionRef = useRef<HTMLElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const filteredObservations = useMemo(
    () => filterByCategory(observations, category),
    [category, observations]
  )

  const countFor = (target: string) => countByCategory(observations, target)

  const openMap = (observation: Observation | null) => {
    setSelectedObservation(observation)
    setShowMap(true)
  }

  useEffect(() => {
    if (!showMap) return
    const timer = window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [showMap, selectedObservation?.id])

  return (
    <div className="space-y-12 text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12 shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="water-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,50 Q25,40 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="1000" height="300" fill="url(#water-pattern)" className="text-white"/>
          </svg>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/20 mb-4">
            <MapIcon size={16} className="text-sky-300" />
            <span className="text-xs font-semibold text-white tracking-wide">Public Basin Records</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Explore Freshwater Observations Worldwide
          </h1>
          <p className="mt-3 text-sm sm:text-base text-sky-100 leading-relaxed">
            Browse community-contributed water quality observations from rivers, streams, and lakes. Select a waterbody category — rivers, lakes, urban waters, wetlands — to filter records, then view location and details on the interactive map.
          </p>
        </div>
      </section>

      {/* Category Cards - PrimeBid Style: Small, Horizontal Scrolling, Clear Images */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Filter by Category</h2>
          <p className="text-sm text-slate-600 mt-2">Scroll to explore rivers, lakes, urban waters, and more</p>
        </div>
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar"
        >
          {WATER_CATEGORIES.map((item) => {
            const selected = category === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`relative flex-shrink-0 w-52 h-32 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer snap-start group ${
                  selected
                    ? 'border-[#0284C7] shadow-lg scale-[1.02]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Clear Background Image - NO color overlay */}
                <img
                  src={item.image}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Text Content Overlay - Minimal: just label and count */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-left">
                  <h3 className="text-base font-bold bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 shadow-sm inline-block mb-1.5">{item.label}</h3>
                  <span className="text-xs font-semibold bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 shadow-sm inline-block w-fit">{countFor(item.id)} records</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Observation Browser */}
      <section aria-labelledby="observation-browser-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="observation-browser-title" className="text-2xl font-bold tracking-tight text-slate-900">
              {WATER_CATEGORIES.find((item) => item.id === category)?.label}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {WATER_CATEGORIES.find((item) => item.id === category)?.description} — {filteredObservations.length} record{filteredObservations.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openMap(null)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer focus:ring-2 focus:ring-[#0284C7]/40 focus:ring-offset-2"
          >
            <MapIcon size={17} />
            Open Full Map
          </button>
        </div>

        {filteredObservations.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <Droplets size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-semibold text-slate-600">No observations in this category yet</p>
            <p className="text-xs text-slate-500 mt-2">Check back soon or explore another category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredObservations.map((observation) => (
              <button
                key={observation.id}
                type="button"
                onClick={() => openMap(observation)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm hover:shadow-lg hover:border-[#0284C7] transition-all cursor-pointer focus:ring-2 focus:ring-[#0284C7]/40 focus:ring-offset-2"
                aria-label={`View ${observation.site_name} on the map`}
              >
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={observation.image_url}
                    alt={observation.site_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  
                  {/* Signal Badge */}
                  <div className="absolute left-3 top-3 z-10">
                    <SignalBadge signal={observation.signal} size="md" />
                  </div>
                  
                  {/* Location Tag */}
                  <div className="absolute bottom-3 left-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/70 backdrop-blur-sm text-white text-xs font-medium">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">{observation.location_address || observation.site_name}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-[#0284C7] transition-colors">
                      {observation.site_name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {observation.ai_summary || observation.notes || 'View the observation record and its map location.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Calendar size={12} className="flex-shrink-0" />
                      {formatDate(observation.created_at)}
                    </div>
                    <ArrowRight size={16} className="text-[#0284C7] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Map Section */}
      {showMap && (
        <section ref={mapSectionRef} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="focused-map-title">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">Interactive Map</p>
              <h2 id="focused-map-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {selectedObservation ? `${selectedObservation.site_name} on the Basin Map` : 'Full Public Basin Map'}
              </h2>
            </div>
            <button 
              type="button" 
              onClick={() => setShowMap(false)} 
              className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer focus:ring-2 focus:ring-[#0284C7]/40"
            >
              <X size={14} />
              Back to Records
            </button>
          </div>
          <MapView initialObservation={selectedObservation} />
        </section>
      )}

      <PublicFooter />
    </div>
  )
}
