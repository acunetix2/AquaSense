import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const THEME_EVENT = 'aquasense-theme-change'

/**
 * Light / Uber-dark theme toggle. The `dark` class lives on <html> and is
 * applied pre-paint by an inline script in index.html (no flash). Instances
 * stay in sync through a window event, since more than one can be mounted.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains('dark'))
    window.addEventListener(THEME_EVENT, sync)
    return () => window.removeEventListener(THEME_EVENT, sync)
  }, [])

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('aquasense_theme', next ? 'dark' : 'light')
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#1b212c] transition-colors cursor-pointer ${className}`}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
