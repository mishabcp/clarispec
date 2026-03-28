'use client'

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import type { DepthLevel, DocumentType } from '@/types'
import { DOCUMENT_TYPES } from '@/types'
import { Zap, Target, Search } from 'lucide-react'

const depthLevels = [
  {
    value: 'quick' as DepthLevel,
    label: 'Quick Scan',
    description: 'High-level overview, basic documents. Core features, users, platform only.',
    icon: Zap,
    threshold: '50%',
  },
  {
    value: 'standard' as DepthLevel,
    label: 'Standard',
    description: 'Full requirement gathering covering all main areas.',
    icon: Target,
    threshold: '70%',
  },
  {
    value: 'deep' as DepthLevel,
    label: 'Deep Dive',
    description: 'Exhaustive analysis including edge cases and detailed specs.',
    icon: Search,
    threshold: '85%',
  },
]

interface DepthSelectorProps {
  value: DepthLevel
  onChange: (value: DepthLevel) => void
}

export function DepthSelector({ value, onChange }: DepthSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 border-b border-white/[0.08] pb-3">
        Analysis Depth
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {depthLevels.map((level) => {
          const isActive = value === level.value
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={cn(
                'group relative flex flex-col items-start rounded-[1px] border p-6 text-left transition-all duration-500 overflow-hidden',
                isActive
                  ? 'border-white/[0.3] bg-white/[0.05] shadow-[0_0_32px_rgba(255,255,255,0.05)]'
                  : 'border-white/[0.08] bg-[#0a0a0b]/40 hover:border-white/[0.2] hover:bg-white/[0.02]'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              {isActive && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                </div>
              )}
              <div className="relative z-10 flex items-center gap-3">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-none border transition-colors duration-500',
                  isActive ? 'border-white/[0.2] bg-white/[0.05]' : 'border-white/[0.08] bg-transparent group-hover:border-white/[0.15]'
                )}>
                  <level.icon className={cn(
                    'h-4 w-4 transition-colors duration-500',
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                  )} />
                </div>
                <div>
                  <span className="font-light text-lg text-white tracking-tight block">{level.label}</span>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">Min. {level.threshold} Base</span>
                </div>
              </div>
              <p className="relative z-10 mt-4 text-[12px] font-light text-white/50 leading-relaxed tracking-wide">{level.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DocumentSelectorProps {
  selected: DocumentType[]
  onChange: (selected: DocumentType[]) => void
}

export function DocumentSelector({ selected, onChange }: DocumentSelectorProps) {
  const allSelected = selected.length === DOCUMENT_TYPES.length
  
  function toggleAll() {
    onChange(allSelected ? [] : DOCUMENT_TYPES.map(d => d.type))
  }

  function toggleDoc(type: DocumentType) {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">
          Documents to Generate
        </h3>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[9px] uppercase tracking-widest font-bold text-white/50 hover:text-white transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENT_TYPES.map((doc) => {
          const isActive = selected.includes(doc.type)
          return (
            <button
              type="button"
              key={doc.type}
              onClick={() => toggleDoc(doc.type)}
              className={cn(
                'group relative flex items-center gap-4 rounded-[1px] border p-4 transition-all duration-300 overflow-hidden text-left',
                isActive
                  ? 'border-white/[0.2] bg-white/[0.05]'
                  : 'border-white/[0.08] bg-[#0a0a0b]/40 hover:border-white/[0.15]'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className={cn(
                "relative z-10 flex flex-shrink-0 items-center justify-center w-5 h-5 rounded-[1px] border transition-all duration-300",
                isActive ? "bg-white border-white" : "bg-transparent border-white/20 group-hover:border-white/40"
              )}>
                {isActive && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              <div className="relative z-10 flex-1 min-w-0">
                <p className={cn(
                  "font-light text-sm tracking-wide truncate transition-colors duration-300",
                  isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                )}>
                  {doc.title}
                </p>
                <p className="text-[10px] text-white/30 truncate mt-0.5">{doc.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
