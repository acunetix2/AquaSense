import React from 'react'
import {
  Droplets,
  Home,
  Map as MapIcon,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { isReviewerRole } from '../../types/roles'
import type { ActiveView } from '../../types/observation'

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, observations } = useApp()
  const { user } = useAuth()

  const pendingReviewCount = observations.filter((o) => o.status === 'pending').length

  const menuItems: { id: ActiveView; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'my-observations', label: 'My Observations', icon: ClipboardList },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isReviewerRole(user?.role)
      ? [{ id: 'reviewer-queue' as ActiveView, label: 'Reviewer Queue', icon: ShieldCheck }]
      : []),
  ]

  const handleNav = (view: ActiveView) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F4C81] to-[#1FB8A6] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Droplets size={18} className="stroke-[2.2]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0F4C81]">AquaSense</span>
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button
          onClick={() => handleNav('capture')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F4C81] hover:bg-[#0c3c66] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer active:scale-98"
        >
          <PlusCircle size={16} />
          <span>Assess a Stream</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeView === item.id
          const isReviewer = item.id === 'reviewer-queue'

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-sky-50 text-[#0F4C81] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  className={`transition-colors ${isActive ? 'text-[#0F4C81]' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </div>
              {isReviewer && pendingReviewCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Info Card */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-1">
            <HelpCircle size={14} className="text-[#1FB8A6]" />
            <span>OneAquaHealth Citizen Science</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All observations are verified by regional experts and mapped to digital health standards.
          </p>
        </div>
      </div>
    </aside>
  )
}
