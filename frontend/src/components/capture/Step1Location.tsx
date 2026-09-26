import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Search,
  MapPin,
  Crosshair,
  ArrowRight,
  Loader2,
  X,
  Globe,
  Check,
  Camera,
  ExternalLink,
  Image as ImageIcon,
  Eye,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { CustomDropdown } from '../common/CustomDropdown'
import { GLOBAL_WATERWAYS, CONTINENTS } from '../../data/globalWaterways'

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom pin icon matching inspiration design
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

// Sub-component: handles map click events
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Sub-component: fly to coordinates when they change
function MapFlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 })
    }
  }, [lat, lng, zoom, map])
  return null
}

// Nominatim reverse geocode
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

// Nominatim forward search
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
  const [selectedContinent, setSelectedContinent] = useState<string>('All Continents')
  const [selectedWaterwayId, setSelectedWaterwayId] = useState<string>('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Web location images state
  const [recentImages, setRecentImages] = useState<
    { id: string; title: string; thumbUrl: string; fullUrl: string; date?: string; source: string; pageUrl?: string }[]
  >([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [previewImage, setPreviewImage] = useState<{
    id: string
    title: string
    thumbUrl: string
    fullUrl: string
    date?: string
    source: string
    pageUrl?: string
  } | null>(null)

  const hasPin = location.latitude !== 0 && location.longitude !== 0

  // Pull recent images from the web (Wikimedia Commons GeoSearch API)
  const fetchRecentImages = useCallback(async (lat: number, lng: number, siteName?: string) => {
    if (!lat || !lng) return
    setLoadingImages(true)
    try {
      // 1. Try Wikimedia Commons GeoSearch within 20km radius
      const geoUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=20000&ggslimit=8&prop=imageinfo&iiprop=url|timestamp&iiurlwidth=400&format=json&origin=*`
      const res = await fetch(geoUrl)
      const data = await res.json()

      const items: {
        id: string
        title: string
        thumbUrl: string
        fullUrl: string
        date?: string
        source: string
        pageUrl?: string
      }[] = []

      if (data?.query?.pages) {
        Object.values(data.query.pages).forEach((page: any) => {
          const info = page.imageinfo?.[0]
          if (info && info.thumburl) {
            items.push({
              id: String(page.pageid),
              title: page.title.replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
              thumbUrl: info.thumburl,
              fullUrl: info.url,
              date: info.timestamp ? new Date(info.timestamp).toLocaleDateString() : undefined,
              source: 'Wikimedia Commons (Geo-tagged)',
              pageUrl: info.descriptionurl,
            })
          }
        })
      }

      if (items.length > 0) {
        setRecentImages(items)
      } else {
        // Fallback: search by site name or river name
        const searchTerms = siteName ? encodeURIComponent(siteName.split(',')[0]) : 'river'
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchTerms}+waterway&gsrlimit=6&prop=imageinfo&iiprop=url|timestamp&iiurlwidth=400&format=json&origin=*`
        const sRes = await fetch(searchUrl)
        const sData = await sRes.json()
        const fallbackItems: typeof items = []
        if (sData?.query?.pages) {
          Object.values(sData.query.pages).forEach((page: any) => {
            const info = page.imageinfo?.[0]
            if (info && info.thumburl) {
              fallbackItems.push({
                id: String(page.pageid),
                title: page.title.replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                thumbUrl: info.thumburl,
                fullUrl: info.url,
                date: info.timestamp ? new Date(info.timestamp).toLocaleDateString() : undefined,
                source: 'Public Waterway Registry',
                pageUrl: info.descriptionurl,
              })
            }
          })
        }
        setRecentImages(fallbackItems)
      }
    } catch (err) {
      console.warn('Error fetching recent web images:', err)
      setRecentImages([])
    } finally {
      setLoadingImages(false)
    }
  }, [])

  // Auto-fetch when pin changes
  useEffect(() => {
    if (hasPin) {
      fetchRecentImages(location.latitude, location.longitude, location.site_name)
    } else {
      setRecentImages([])
    }
  }, [hasPin, location.latitude, location.longitude, fetchRecentImages])

  // Filter global waterways based on chosen continent
  const filteredWaterways = GLOBAL_WATERWAYS.filter(
    (w) => selectedContinent === 'All Continents' || w.continent === selectedContinent
  )

  const waterwayOptions = filteredWaterways.map((w) => ({
    value: w.id,
    label: w.name,
    subtitle: `${w.country} (${w.continent})`,
    badge: w.type === 'river' ? 'River' : 'Lake',
  }))

  const continentOptions = CONTINENTS.map((c) => ({
    value: c,
    label: c,
  }))

  // Handle waterway selection from global database
  const handleWaterwaySelect = (waterwayId: string) => {
    setSelectedWaterwayId(waterwayId)
    const item = GLOBAL_WATERWAYS.find((w) => w.id === waterwayId)
    if (item) {
      onChange({
        site_name: item.name,
        address: `${item.name}, ${item.country}`,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: 25,
      })
      setSearchQuery(item.name)
    }
  }

  // Debounced forward geocoding search
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

  const selectResult = async (result: NominatimResult) => {
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

  const mapCenter: [number, number] = hasPin
    ? [location.latitude, location.longitude]
    : DEFAULT_CENTER

  return (
    <div className="space-y-6">
      {/* Title & Subtitle matching inspiration.png */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Where did you observe this stream?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select a location on the map or search for a place.
        </p>
      </div>

      {/* Main 2-column layout from inspiration.png Screen 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search Bar & Interactive Real Map (Span 8) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Location Search Bar with real-time autocompletion */}
          <div className="relative z-30">
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
                placeholder="Search location..."
                className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] shadow-2xs transition-all"
              />
              {isSearching && (
                <Loader2
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0F4C81] animate-spin"
                />
              )}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setShowResults(false)
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Nominatim Search Dropdown Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 z-50">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectResult(r)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50/60 transition-colors cursor-pointer flex items-start gap-2.5"
                  >
                    <MapPin size={15} className="text-[#0F4C81] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 truncate">
                        {r.name || r.display_name.split(',')[0]}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {r.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real Leaflet Map Container */}
          <div
            className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100"
            style={{ height: 420 }}
          >
            {/* Real Interactive Leaflet Map */}
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

            {/* Quick Map Action: Pin Current Location Floating Button */}
            <div className="absolute top-3 right-3 z-[400]">
              <button
                type="button"
                onClick={handleGeolocate}
                disabled={isGeolocating}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-xs font-medium text-slate-700 hover:text-[#0F4C81] hover:border-[#0F4C81] transition-all cursor-pointer disabled:opacity-60"
                title="Pin my current GPS location"
              >
                {isGeolocating ? (
                  <Loader2 size={14} className="animate-spin text-[#0F4C81]" />
                ) : (
                  <Crosshair size={14} className="text-[#0F4C81]" />
                )}
                <span>Pin my location</span>
              </button>
            </div>

            {/* Map Bottom Accuracy Pill matching inspiration.png */}
            <div className="absolute bottom-3 left-3 z-[400]">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Location accuracy: ~{location.accuracy > 0 ? location.accuracy : 12}m
                </span>
              </div>
            </div>

            {/* Reverse geocoding loading state */}
            {isReverting && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400]">
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium text-slate-700">
                  <Loader2 size={16} className="animate-spin text-[#0F4C81]" />
                  Resolving waterway address...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Location & Worldwide Freshwater Selector (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Location Card matching inspiration.png */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Selected Location
              </span>
              {hasPin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check size={11} /> Pin set
                </span>
              )}
            </div>

            {hasPin ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-mono">
                  <Crosshair size={16} className="text-[#0F4C81] shrink-0" />
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
                    className="w-full text-left text-xs font-medium text-[#0F4C81] hover:text-[#0b3b64] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Crosshair size={12} />
                    <span>Update to current GPS location</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        site_name: '',
                        address: '',
                        latitude: 0,
                        longitude: 0,
                        accuracy: 0,
                      })
                      setSearchQuery('')
                    }}
                    className="text-left text-xs text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear selected pin
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0F4C81] flex items-center justify-center mx-auto">
                  <MapPin size={18} />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  No location selected yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Click on the map or use the button below to pin your current location.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    disabled={isGeolocating}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F4C81] bg-white border border-[#0F4C81]/30 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                  >
                    {isGeolocating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Crosshair size={13} />
                    )}
                    <span>Pin my current location</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Images from Web / Google Maps of Selected Location */}
          {hasPin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Camera size={15} className="text-[#0F4C81]" />
                <span>Recent Location Photos from Web</span>
              </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Live ground photos and watershed imagery pulled from public registries and geo-referenced records to assist your observation assessment.
              </p>

              {loadingImages ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Loader2 size={18} className="animate-spin text-[#0F4C81]" />
                  <span>Scanning web and geo registries for photos...</span>
                </div>
              ) : recentImages.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    {recentImages.slice(0, 6).map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setPreviewImage(img)}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs hover:border-[#0F4C81] transition-all"
                      >
                        <img
                          src={img.thumbUrl}
                          alt={img.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={16} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Showing {Math.min(6, recentImages.length)} geo-tagged images near this location. Click to expand.
                  </p>
                </div>
              ) : (
                <div className="py-4 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-1 text-xs text-slate-500">
                  <ImageIcon size={20} className="mx-auto text-slate-400" />
                  <p className="text-[11px] font-medium text-slate-600">No public geo-tagged photos found right at these exact coordinates.</p>
                  <p className="text-[10px] text-slate-400">Use the Google Maps & Earth links below to inspect satellite and street-level views.</p>
                </div>
              )}

              {/* Direct External Web Search & Google Maps links */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0F4C81] border border-slate-200 hover:border-sky-200 transition-all text-[11px] font-medium group"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-500" />
                    <span>View on Google Maps & Street View</span>
                  </span>
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-[#0F4C81]" />
                </a>

                <a
                  href={`https://earth.google.com/web/@${location.latitude},${location.longitude},1000a,35d,35y,0h,0t,0r`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-200 transition-all text-[11px] font-medium group"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} className="text-teal-600" />
                    <span>View in Google Earth 3D Satellite</span>
                  </span>
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-teal-600" />
                </a>
              </div>
            </div>
          )}

          {/* Global Waterways Quick Picker (Continents & Rivers) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Globe size={15} className="text-[#0F4C81]" />
              <span>Or choose from global waterways</span>
            </div>

            <p className="text-xs text-slate-500">
              Browse major monitored rivers and lakes across different continents:
            </p>

            {/* Continent Custom Dropdown */}
            <CustomDropdown
              label="Select Continent"
              options={continentOptions}
              value={selectedContinent}
              onChange={(val) => {
                setSelectedContinent(val)
                setSelectedWaterwayId('')
              }}
            />

            {/* Waterway Custom Dropdown */}
            <CustomDropdown
              label="Select River or Lake"
              options={waterwayOptions}
              value={selectedWaterwayId}
              onChange={handleWaterwaySelect}
              placeholder="Search or pick a waterway..."
              searchable
            />
          </div>
        </div>
      </div>

      {/* Bottom Step Actions matching inspiration.png */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          {!canProceed && (
            <p className="text-xs text-slate-400">
              {!hasPin
                ? 'Drop a pin on the map or select a waterway to continue.'
                : 'Enter a valid site name to proceed.'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer ${
            canProceed
              ? 'bg-[#0F4C81] hover:bg-[#0b3b64] shadow-sm hover:shadow active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Next</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Web Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[60vh] bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.fullUrl}
                alt={previewImage.title}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
              <button
                onClick={() => setPreviewImage(null)}
                aria-label="Close image preview"
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-left">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{previewImage.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Source: {previewImage.source}</span>
                  {previewImage.date && <span>• Date: {previewImage.date}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Geo-referenced field photo</span>
                <div className="flex items-center gap-2">
                  {previewImage.pageUrl && (
                    <a
                      href={previewImage.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1.5"
                    >
                      <span>Original Web Record</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="px-4 py-1.5 rounded-xl bg-[#0F4C81] text-white font-semibold cursor-pointer hover:bg-[#0c3c66]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
