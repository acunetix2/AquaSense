import React, { useEffect, useState } from 'react'
import { Droplets } from 'lucide-react'

interface AppLoaderProps {
  fullScreen?: boolean
  context?: LoaderContext
}

export type LoaderContext =
  | 'boot'
  | 'signin'
  | 'signup'
  | 'oauth'
  | 'signout'
  | 'reset'
  | 'password'
  | 'data'

const LABELS: Record<LoaderContext, [string, string]> = {
  boot: ['Checking session', 'Loading workspace'],
  signin: ['Signing you in', 'Loading your workspace'],
  signup: ['Creating your account', 'Preparing your workspace'],
  oauth: ['Opening Google sign-in', 'Waiting for redirect'],
  signout: ['Signing you out', 'Closing your session'],
  reset: ['Sending reset link', 'Check your inbox'],
  password: ['Updating password', 'Securing your account'],
  data: ['Loading observations', 'Syncing live data'],
}

export const AppLoader: React.FC<AppLoaderProps> = ({ fullScreen = true, context = 'boot' }) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setStep(1), 450)
    return () => clearTimeout(t)
  }, [context])

  const steps = LABELS[context] ?? LABELS.boot

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto select-none">
      {/* Concentric animated water ripples */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full bg-[#0F4C81]/10 animate-ping opacity-75" />
        <div className="absolute -inset-3 rounded-full bg-teal-500/10 animate-pulse duration-1000" />
        <div className="absolute -inset-6 rounded-full border border-sky-400/20 animate-spin" style={{ animationDuration: '6s' }} />

        {/* Central glowing droplet orb */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F4C81] via-teal-600 to-sky-400 p-0.5 shadow-xl shadow-sky-900/20 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white">
            <Droplets className="w-8 h-8 text-sky-200 animate-bounce" style={{ animationDuration: '1.8s' }} />
          </div>
        </div>
      </div>

      {/* Brand title */}
      <span className="text-xl font-black tracking-tight text-slate-900 mb-3">
        Aqua<span className="text-[#0F4C81]">Sense</span>
      </span>

      {/* Single status line — context-aware */}
      <p className="text-xs font-semibold text-slate-500 tracking-wide" aria-live="polite">
        {steps[step]}
        <span className="inline-flex gap-0.5 ml-1.5 align-middle">
          {[0, 120, 240].map((delay) => (
            <span
              key={delay}
              className="w-1 h-1 rounded-full bg-[#0F4C81] animate-bounce"
              style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
            />
          ))}
        </span>
      </p>

      {/* Indeterminate shimmer bar */}
      <div className="w-44 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden relative">
        <div
          className="h-full w-1/3 bg-gradient-to-r from-[#0F4C81] via-teal-500 to-sky-400 rounded-full"
          style={{ animation: 'loader-slide 1.1s ease-in-out infinite' }}
        />
      </div>
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
