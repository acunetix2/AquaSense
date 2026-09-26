import React, { useEffect, useState } from 'react'
import { Droplets, Check } from 'lucide-react'

interface AppLoaderProps {
  fullScreen?: boolean
}

const STEPS = [
  {
    title: 'Checking your session',
    subtitle: 'Restoring your sign-in so you can pick up where you left off.',
  },
  {
    title: 'Loading recent observations',
    subtitle: 'Fetching the latest community water records.',
  },
  {
    title: 'Preparing your workspace',
    subtitle: 'Setting up the map, feed, and alerts.',
  },
]

export const AppLoader: React.FC<AppLoaderProps> = ({ fullScreen = true }) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 850)
    const t2 = setTimeout(() => setStep(2), 1750)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const current = STEPS[step]
  const progress = `${Math.round(((step + 1) / STEPS.length) * 100)}%`

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto select-none">
      {/* Concentric animated water ripples */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full bg-[#0F4C81]/10 animate-ping opacity-75" />
        <div className="absolute -inset-3 rounded-full bg-teal-500/10 animate-pulse duration-1000" />
        <div className="absolute -inset-6 rounded-full border border-sky-400/20 rounded-full animate-spin duration-3000" style={{ animationDuration: '6s' }} />

        {/* Central glowing droplet orb */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F4C81] via-teal-600 to-sky-400 p-0.5 shadow-xl shadow-sky-900/20 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white">
            <Droplets className="w-8 h-8 text-sky-200 animate-bounce" style={{ animationDuration: '1.8s' }} />
          </div>
        </div>
      </div>

      {/* Brand title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl font-black tracking-tight text-slate-900">
          Aqua<span className="text-[#0F4C81]">Sense</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0F4C81] font-mono text-[10px] font-bold uppercase tracking-wider">
          v3.2
        </span>
      </div>

      {/* Progressive step checklist — plain-language, user-focused */}
      <ul className="w-full max-w-xs space-y-2.5 text-left mb-5">
        {STEPS.map((s, idx) => {
          const done = idx < step
          const active = idx === step
          return (
            <li
              key={s.title}
              className={`flex items-start gap-2.5 transition-opacity duration-300 ${
                active ? 'opacity-100' : done ? 'opacity-80' : 'opacity-40'
              }`}
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'border-2 border-[#0F4C81] border-t-transparent animate-spin'
                    : 'border-2 border-slate-300'
                }`}
              >
                {done && <Check size={10} className="stroke-[3]" />}
              </span>
              <span>
                <span className={`block text-xs font-bold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                  {s.title}
                </span>
                <span className="block text-[11px] text-slate-400 leading-snug">{s.subtitle}</span>
              </span>
            </li>
          )
        })}
      </ul>

      {/* Current step message */}
      <p className="text-sm font-semibold text-slate-800 tracking-tight">{current.title}…</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">{current.subtitle}</p>

      {/* Fluid progress bar shimmer */}
      <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-5 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-[#0F4C81] via-teal-500 to-sky-400 rounded-full transition-[width] duration-500 ease-out"
          style={{ width: progress }}
        />
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-1.5">{progress}</p>
    </div>
  )

  if (!fullScreen) {
    return content
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-[#0a0d13]/95 backdrop-blur-md animate-in fade-in duration-300">
      {content}
    </div>
  )
}
