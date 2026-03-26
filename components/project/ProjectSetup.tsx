'use client'

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">Depth Level</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {depthLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={cn(
              'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
              value === level.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/30'
            )}
          >
            <div className="flex items-center gap-2">
              <level.icon className={cn(
                'h-5 w-5',
                value === level.value ? 'text-primary' : 'text-text-muted'
              )} />
              <span className="font-semibold font-heading text-sm">{level.label}</span>
            </div>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">{level.description}</p>
            <Badge variant="outline" className="mt-3 text-[10px]">
              Min. {level.threshold} completeness
            </Badge>
          </button>
        ))}
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Documents to Generate</h3>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-primary hover:underline"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENT_TYPES.map((doc) => (
          <div
            key={doc.type}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-all',
              selected.includes(doc.type)
                ? 'border-primary/30 bg-primary/5'
                : 'border-border'
            )}
          >
            <Switch
              checked={selected.includes(doc.type)}
              onCheckedChange={() => toggleDoc(doc.type)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{doc.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{doc.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
