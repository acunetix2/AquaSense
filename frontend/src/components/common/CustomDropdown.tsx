import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: string
  group?: string
}

interface CustomDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  searchable?: boolean
  className?: string
  buttonClassName?: string
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  searchable = false,
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = searchable && searchTerm
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Group options if group is present
  const groups = Array.from(new Set(filteredOptions.map((opt) => opt.group).filter(Boolean))) as string[]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-[#0F4C81] focus:border-[#0F4C81] transition-all cursor-pointer ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`truncate font-normal ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded">
              {selectedOption.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-64 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
          {searchable && (
            <div className="px-2.5 py-1.5 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-400 text-center">
              No options found
            </div>
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <div key={group}>
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 bg-slate-50/50">
                  {group}
                </div>
                {filteredOptions
                  .filter((opt) => opt.group === group)
                  .map((opt) => {
                    const isSelected = opt.value === value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value)
                          setIsOpen(false)
                          setSearchTerm('')
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-[#0F4C81] font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <div className="text-left truncate">
                            <p className="truncate">{opt.label}</p>
                            {opt.subtitle && (
                              <p className="text-[10px] text-slate-400 truncate">{opt.subtitle}</p>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-[#0F4C81] shrink-0 ml-2" />}
                      </button>
                    )
                  })}
              </div>
            ))
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 text-[#0F4C81] font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="text-left truncate">
                      <p className="truncate">{opt.label}</p>
                      {opt.subtitle && (
                        <p className="text-[10px] text-slate-400 truncate">{opt.subtitle}</p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-[#0F4C81] shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
