import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface ObservationMapProps {
  latitude: number
  longitude: number
  siteName: string
  address?: string
  className?: string
}

// Compact Google-Maps-style pin built with a divIcon (avoids Leaflet's
// broken default marker image URLs under bundlers).
const createPinIcon = (): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#0F4C81;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  })

export const ObservationMap: React.FC<ObservationMapProps> = ({
  latitude,
  longitude,
  siteName,
  address,
  className = 'h-64',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Built at open time so Uber-dark colors stay in sync with the theme
    const buildPopupHtml = () => {
      const dark = document.documentElement.classList.contains('dark')
      const titleColor = dark ? '#f1f5f9' : '#0f172a'
      const subColor = dark ? '#94a0b4' : '#64748b'
      return `<div style="font-family:inherit"><p style="font-weight:700;color:${titleColor};margin:0 0 2px">${siteName.replace(/</g, '&lt;')}</p>${
        address ? `<p style="color:${subColor};font-size:11px;margin:0">${address.replace(/</g, '&lt;')}</p>` : ''
      }</div>`
    }

    try {
      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: false,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map)
        mapRef.current = map
        markerRef.current = L.marker([latitude, longitude], { icon: createPinIcon() })
          .addTo(map)
          .bindPopup(buildPopupHtml)
      } else {
        mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude])
          markerRef.current.setPopupContent(buildPopupHtml())
        }
      }
      // Leaflet sizes itself on init; ensure tiles render inside the tab layout
      setTimeout(() => mapRef.current?.invalidateSize(), 100)
    } catch {
      // Leaflet can throw if the container is hidden mid-mount — safe to skip
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [latitude, longitude, siteName, address])

  return (
    <div className={`${className} rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100`}>
      <div ref={containerRef} className="absolute inset-0" aria-label={`Map location of ${siteName}`} />
    </div>
  )
}

export default ObservationMap
