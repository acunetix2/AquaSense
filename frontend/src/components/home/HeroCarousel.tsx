import React, { useState, useEffect } from 'react'
import { SignalBadge } from '../common/SignalBadge'
import type { SignalType } from '../../types/observation'

interface SlideItem {
  image: string
  title: string
  caption: string
  signal: SignalType
  location: string
}

const SLIDES: SlideItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=80',
    title: 'Rivers build healthier communities',
    caption: 'Clean water supports people, wildlife and local economies.',
    signal: 'normal',
    location: 'Riverside Basin',
  },
  {
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=80',
    title: 'Early detection protects downstream habitats',
    caption: 'AI-assisted indicators detect nutrient anomalies before severe blooms form.',
    signal: 'watch',
    location: 'Maple Creek Valley',
  },
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    title: 'Citizen science connects local voices with policy',
    caption: 'Structured observation data empowers community watershed councils.',
    signal: 'normal',
    location: 'Willow Lake Sanctuary',
  },
]

export const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const slide = SLIDES[current]

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Visual Decorative Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-sky-400/20 to-teal-400/20 blur-xl -z-10" />

      {/* Main Card Container */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100 transition-all duration-300">
        {/* Photo Container */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Signal Badge overlay on top-left of image */}
          <div className="absolute top-4 left-4 drop-shadow-md">
            <SignalBadge signal={slide.signal} size="md" className="bg-white/95 backdrop-blur-sm shadow-sm" />
          </div>

          {/* Location Chip */}
          <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full">
            {slide.location}
          </div>
        </div>

        {/* Content Card Body */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {slide.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {slide.caption}
          </p>

          {/* Carousel Pagination Dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  current === idx ? 'w-6 bg-[#0284C7]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
