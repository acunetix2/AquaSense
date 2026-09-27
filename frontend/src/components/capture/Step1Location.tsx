import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, MapPin, Crosshair, ArrowRight, Loader2, X, Check } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const bluePin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [26, 42],
  iconAnchor: [13, 42],
  popupAnchor: [0, -42],
  shadowSize: [42, 42],
})

interface LocationData {
  site_name: string
  address: string
  latitude: number
  longitude: number
  accuracy: number
}

interface Step1LocationProps {
  location: LocationData
  onChange: (loc: LocationData) => void
  onNext: () => void
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapFlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 })
    }
  }, [lat, lng, zoom, map])
  return null
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  name?: string
}

async function searchPlaces(query: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

const EMPTY_LOCATION: LocationData = {
  site_name: '',
  address: '',
  latitude: 0,
  longitude: 0,
  accuracy: 0,
}

// Default center: Lake Victoria / East African Rift (equatorial global midpoint)
const DEFAULT_CENTER: [number, number] = [-0.3476, 32.5825]
const DEFAULT_ZOOM = 5

export const Step1Location: React.FC<Step1LocationProps> = ({ location, onChange, onNext }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasPin = location.latitude !== 0 && location.longitude !== 0

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchPlaces(q)
        setSearchResults(results)
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }

  const selectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const name = result.name || result.display_name.split(',')[0]
    onChange({
      site_name: name,
      address: result.display_name,
      latitude: lat,
      longitude: lng,
      accuracy: 15,
    })
    setSearchQuery(name)
    setShowResults(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setIsReverting(true)
      const address = await reverseGeocode(lat, lng)
      const name = address.split(',')[0] || `Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      onChange({
        site_name: name,
        address,
        latitude: lat,
        longitude: lng,
        accuracy: 12,
      })
      setIsReverting(false)
    },
    [onChange]
  )

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        setIsReverting(true)
        const address = await reverseGeocode(lat, lng)
        const name = address.split(',')[0] || 'Current Location'
        onChange({
          site_name: name,
          address,
          latitude: lat,
          longitude: lng,
          accuracy: Math.round(accuracy) || 10,
        })
        setIsReverting(false)
        setIsGeolocating(false)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setIsGeolocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const canProceed = hasPin && location.site_name.trim().length > 0

  const mapCenter: [number, number] = hasPin ? [location.latitude, location.longitude] : DEFAULT_CENTER

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Where did you observe this waterway?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Search for a location, use your current position, or click on the map
        </p>
      </div>

      {/* Search bar + geolocate */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search for a place or waterway..."
              className="w-full pl-10 pr-9 py-3 bg-white rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] transition-all"
            />
            {isSearching && (
              <Loader2
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0284C7] animate-spin"
              />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 z-50">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50/60 transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <MapPin size={15} className="text-[#0284C7] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">
                      {r.name || r.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{r.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          disabled={isGeolocating}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-sm transition disabled:opacity-50 cursor-pointer sm:w-auto"
        >
          {isGeolocating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Getting location...</span>
            </>
          ) : (
            <>
              <Crosshair size={18} />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Map + selected location */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <div
            className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100"
            style={{ height: 420 }}
          >
            <MapContainer
              center={mapCenter}
              zoom={hasPin ? 13 : DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {hasPin && (
                <>
                  <MapFlyTo lat={location.latitude} lng={location.longitude} zoom={13} />
                  <Marker position={[location.latitude, location.longitude]} icon={bluePin} />
                </>
              )}
            </MapContainer>

            {/* Accuracy pill */}
            <div className="absolute bottom-3 left-3 z-[400]">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Location accuracy: ~{location.accuracy > 0 ? location.accuracy : 12}m</span>
              </div>
            </div>

            {/* Reverse geocoding loading state */}
            {isReverting && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400]">
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium text-slate-700">
                  <Loader2 size={16} className="animate-spin text-[#0284C7]" />
                  Resolving waterway address...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected location card */}
        <div className="lg:col-span-4">
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Selected Location</span>
              {hasPin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check size={11} /> Pin set
                </span>
              )}
            </div>

            {hasPin ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-mono">
                  <Crosshair size={16} className="text-[#0284C7] shrink-0" />
                  <span>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700 leading-snug">
                  {location.site_name || 'Observation Point'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {location.address || 'Address not resolved yet'}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    disabled={isGeolocating}
                    className="w-full text-left text-xs font-medium text-[#0284C7] hover:text-[#0369A1] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Crosshair size={12} />
                    <span>Update to current GPS location</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(EMPTY_LOCATION)
                      clearSearch()
                    }}
                    className="text-left text-xs text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear selected pin
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center mx-auto">
                  <MapPin size={18} />
                </div>
                <p className="text-xs font-medium text-slate-600">No location selected yet</p>
                <p className="text-[11px] text-slate-400">
                  Search for a place, use the current-location button, or click on the map.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          {!canProceed && (
            <p className="text-xs text-slate-400">
              {!hasPin ? 'Drop a pin on the map to continue.' : 'Enter a valid site name to proceed.'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer ${
            canProceed
              ? 'bg-[#0284C7] hover:bg-[#0369A1] shadow-sm hover:shadow active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Next</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
