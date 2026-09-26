import React from 'react'
import { Droplets } from 'lucide-react'

interface AppLoaderProps {
  message?: string
  subtitle?: string
  fullScreen?: boolean
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  message = 'Initializing AquaSense',
  subtitle = 'Synchronizing Regional Watershed Intelligence…',
  fullScreen = true,
}) => {
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
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-black tracking-tight text-slate-900">
          Aqua<span className="text-[#0F4C81]">Sense</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0F4C81] font-mono text-[10px] font-bold uppercase tracking-wider">
          v3.2
        </span>
      </div>

      {/* Dynamic animated progress dots */}
      <p className="text-sm font-semibold text-slate-800 tracking-tight">
        {message}
      </p>

      {/* Subtitle */}
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        {subtitle}
      </p>

      {/* Fluid progress bar shimmer */}
      <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-[#0F4C81] via-teal-500 to-sky-400 rounded-full animate-[shimmer_1.5s_infinite] w-2/3" />
      </div>
    </div>
  )

  if (!fullScreen) {
    return content
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
      {content}
    </div>
  )
}
