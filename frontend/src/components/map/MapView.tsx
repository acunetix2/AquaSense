import React, { useState, useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  Globe,
} from 'lucide-react'

import { useApp } from '../../context/AppContext'
import { SignalBadge } from '../common/SignalBadge'
import { EmptyState } from '../common/EmptyState'
import type { Observation, SignalType } from '../../types/observation'

export const MapView: React.FC = () => {
  const {
    observations,
    openObservationDetail,
    filterDateRange,
    setFilterDateRange,
    filterLocation,
    setFilterLocation,
    filterSignal,
    setFilterSignal,
  } = useApp()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets')
  const [activeObservation, setActiveObservation] = useState<Observation | null>(
    observations[0] || null
  )

  // Filter observations based on filter bar
  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      if (filterSignal !== 'all' && obs.signal !== filterSignal) {
        return false
      }
      if (
        filterLocation !== 'all' &&
        !obs.site_name.toLowerCase().includes(filterLocation.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [observations, filterSignal, filterLocation])

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(observations.map((o) => o.site_name)))
  }, [observations])

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const initialLat = observations[0]?.latitude || 40.7306
      const initialLng = observations[0]?.longitude || -73.9352

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
      })

      const layerGroup = L.layerGroup().addTo(map)
      markersLayerRef.current = layerGroup
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Swap TileLayer when mapLayer mode changes (Streets vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove existing tile layer if present
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
      tileLayerRef.current = null
    }

    let newTileLayer: L.TileLayer
    if (mapLayer === 'satellite') {
      // Esri World Imagery (High-resolution global satellite tiles)
      newTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
        }
      )
    } else {
      // Standard OpenStreetMap tiles
      newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      })
    }

    newTileLayer.addTo(map)
    newTileLayer.bringToBack()
    tileLayerRef.current = newTileLayer
  }, [mapLayer])

  // Create compact Google Maps-style location pin icons (small, flat, no shadow)
  const createSignalIcon = (signal: SignalType, isSelected: boolean) => {
    // Authentic Google Maps pin size
    const width = isSelected ? 24 : 20
    const height = isSelected ? 30 : 25

    let pinColor = '#10B981' // emerald (normal)
    let innerGlyph = `<circle cx="12" cy="10" r="3.5" fill="white" />`

    if (signal === 'investigate') {
      pinColor = '#EA4335' // Google Maps Red (investigate)
      innerGlyph = `
        <circle cx="12" cy="10" r="4.2" fill="white" />
        <circle cx="12" cy="10" r="2.2" fill="#EA4335" />
      `
    } else if (signal === 'watch') {
      pinColor = '#F59E0B' // Amber (watch)
      innerGlyph = `
        <circle cx="12" cy="10" r="4.2" fill="white" />
        <circle cx="12" cy="10" r="2.2" fill="#F59E0B" />
      `
    }

    const svgMarkup = `
      <svg width="${width}" height="${height}" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Google Maps Pin Path -->
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z"
              fill="${pinColor}"
        />
        <!-- Inner Center Dot -->
        ${innerGlyph}
      </svg>
    `

    return L.divIcon({
      className: 'google-maps-pin',
      html: `
        <div style="width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 0;">
          ${svgMarkup}
        </div>
      `,
      iconSize: [width, height],
      iconAnchor: [width / 2, height], // Accurate bottom tip anchor
      popupAnchor: [0, -height],
    })
  }

  // Update Leaflet Markers when observations or active observation changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = markersLayerRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()

    const bounds: L.LatLngExpression[] = []

    filtered.forEach((obs) => {
      if (typeof obs.latitude !== 'number' || typeof obs.longitude !== 'number') return

      const isSelected = activeObservation?.id === obs.id
      const marker = L.marker([obs.latitude, obs.longitude], {
        icon: createSignalIcon(obs.signal, isSelected),
        title: obs.site_name,
        zIndexOffset: isSelected ? 1000 : 100,
      })

      const observerName = obs.observer_name || 'Community Observer'
      const observerAvatar =
        obs.observer_avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(observerName)}`
      const formattedDate = new Date(obs.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      // Rich popup showing uploader profile, name, date, location, signal
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px; padding: 2px;">
          <!-- River Image -->
          <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; position: relative;">
            <img src="${obs.image_url}" alt="${obs.site_name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="
              position: absolute;
              top: 6px;
              left: 6px;
              padding: 2px 7px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              background: ${obs.signal === 'investigate' ? '#EF4444' : obs.signal === 'watch' ? '#F59E0B' : '#10B981'};
              color: white;
              letter-spacing: 0.5px;
            ">
              ${obs.signal}
            </span>
          </div>

          <!-- Site Info -->
          <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
            ${obs.site_name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
            <span>📍 ${obs.location_address || 'Regional Watershed'}</span>
          </div>

          <!-- AI Summary -->
          <div style="font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 8px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
            "${obs.ai_summary.slice(0, 110)}..."
          </div>

          <!-- Uploader Attribution in Popup -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="${observerAvatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;" />
              <span style="font-weight: 600; color: #1e293b;">${observerName}</span>
            </div>
            <span style="color: #94a3b8; font-size: 10px;">${formattedDate}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, { maxWidth: 280 })

      marker.on('click', () => {
        setActiveObservation(obs)
      })

      marker.addTo(layerGroup)
      bounds.push([obs.latitude, obs.longitude])
    })

    if (bounds.length > 0 && map && !activeObservation) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 14 })
      } catch {
        // bounds safeguard
      }
    }
  }, [filtered, activeObservation?.id])

  const handleSelectObservation = (obs: Observation) => {
    setActiveObservation(obs)
    if (mapInstanceRef.current && typeof obs.latitude === 'number' && typeof obs.longitude === 'number') {
      mapInstanceRef.current.flyTo([obs.latitude, obs.longitude], 14, {
        duration: 0.8,
      })
    }
  }

  const handleFitAll = () => {
    if (mapInstanceRef.current && filtered.length > 0) {
      const bounds = filtered.map((o) => [o.latitude, o.longitude] as [number, number])
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [50, 50],
        maxZoom: 14,
      })
    }
  }

  const formatObserverDate = (isoString?: string) => {
    if (!isoString) return 'Recent'
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Recent'
    }
  }

  const formatObserverTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-4 text-left">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Regional Watershed Map</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0F4C81] capitalize transition-colors">
              {mapLayer === 'satellite' ? 'Satellite View' : 'Live Street Map'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            High-contrast signal markers showing water conditions, uploader attribution, and evidence
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Signal Filter */}
          <div className="relative">
            <select
              value={filterSignal}
              onChange={(e) => setFilterSignal(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81] cursor-pointer"
            >
              <option value="all">All Signals ({observations.length})</option>
              <option value="investigate">🔴 Investigate Only</option>
              <option value="watch">🟡 Watch Only</option>
              <option value="normal">🟢 Normal Only</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81] cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Calendar
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81] cursor-pointer max-w-[170px] truncate"
            >
              <option value="all">All Basins</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <MapPin
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <button
            onClick={handleFitAll}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            title="Reset map view to encompass all markers"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Main Grid: Leaflet Map (Left) + Selected River Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative h-[520px] sm:h-[580px]">
          {/* Leaflet DOM container */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Layer Switcher (Streets vs Satellite) */}
          <div className="absolute top-4 right-4 z-10 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-slate-200/90 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMapLayer('streets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mapLayer === 'streets'
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Switch to OpenStreetMap vector tiles"
            >
              <Layers size={14} />
              <span>Street Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mapLayer === 'satellite'
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Switch to Esri high-resolution satellite imagery"
            >
              <Globe size={14} />
              <span>Satellite</span>
            </button>
          </div>

          {/* Map Legend Floating Tag */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/90 text-xs space-y-1.5 pointer-events-auto">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Signal Analysis Legend
            </p>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                Watch
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                Investigate
              </span>
            </div>
          </div>
        </div>

        {/* Selected River Sidebar Card */}
        <div className="lg:col-span-4 flex flex-col">
          {activeObservation ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                {/* Photo Header */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={activeObservation.image_url}
                    alt={activeObservation.site_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <SignalBadge signal={activeObservation.signal} size="md" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="text-teal-300 shrink-0" />
                    <span className="truncate">{activeObservation.location_address || activeObservation.site_name}</span>
                  </div>
                </div>

                {/* River Title & AI Diagnosis */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {activeObservation.site_name}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>Signal: <strong className="capitalize">{activeObservation.signal}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong>{Math.round(activeObservation.confidence * 100)}%</strong></span>
                  </div>
                </div>

                {/* AI Summary Quote */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{activeObservation.ai_summary}"
                  </p>
                </div>

                {/* UPLOADER & ANALYST PROFILE SECTION */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/80 to-teal-50/30 border border-sky-100/80 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Uploaded By
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            activeObservation.observer_avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                              activeObservation.observer_name || 'Observer'
                            )}`
                          }
                          alt={activeObservation.observer_name || 'Observer'}
                          className="w-9 h-9 rounded-full object-cover border border-white shadow-xs"
                        />
                        {activeObservation.status === 'verified' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                            <ShieldCheck size={8} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {activeObservation.observer_name || 'Civic Observer'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <Sparkles size={10} className="text-[#1FB8A6] shrink-0" />
                          <span>{activeObservation.observer_role || 'Citizen Scientist'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 justify-end">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{formatObserverDate(activeObservation.created_at)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatObserverTime(activeObservation.created_at)}
                      </p>
                    </div>
                  </div>

                  {activeObservation.observer_location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-sky-100/60">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="truncate">{activeObservation.observer_location}</span>
                    </div>
                  )}
                </div>

                {/* Key Evidence Points */}
                {activeObservation.key_evidence && activeObservation.key_evidence.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500">
                      Detected Evidence
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {activeObservation.key_evidence.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#0F4C81] font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => openObservationDetail(activeObservation)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#0F4C81] hover:bg-[#0c3c66] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  <span>Inspect Full River Record</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Layers size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No River Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Click on any marker on the OpenStreetMap to inspect water quality signals and contributor details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stream List / Quick Switcher */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">
          Mapped River Segments ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon={MapPin}
            title="No river sites match current filters"
            description="No mapped river locations match your active filter settings. Clear or adjust your filters to view all monitored river basins."
            actionLabel="Reset Map Filters"
            onAction={() => {
              setFilterSignal('all')
              setFilterLocation('all')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((obs) => {
              const isSelected = activeObservation?.id === obs.id
              const obsName = obs.observer_name || 'Observer'
              return (
                <button
                  key={obs.id}
                  onClick={() => handleSelectObservation(obs)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F4C81] bg-sky-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={obs.image_url}
                    alt={obs.site_name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{obs.site_name}</p>
                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <User size={10} className="text-slate-400" />
                      <span>{obsName}</span>
                    </p>
                    <div className="mt-1">
                      <SignalBadge signal={obs.signal} size="sm" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
