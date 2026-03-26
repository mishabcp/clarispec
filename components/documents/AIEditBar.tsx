'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, X, Sparkles, Type, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  { id: 'detailed', label: 'More detailed', instruction: 'Make this section more detailed with specific examples and explanations', group: 'tone' },
  { id: 'simplify', label: 'Simplify', instruction: 'Simplify the language to make it easier to understand for non-technical readers', group: 'tone' },
  { id: 'examples', label: 'Add examples', instruction: 'Add concrete, practical examples where appropriate', group: 'enhance' },
  { id: 'formatting', label: 'Fix formatting', instruction: 'Fix any markdown formatting issues and improve the document structure', group: 'enhance' },
]

const CONFLICTING_GROUP = 'tone'

interface AIEditBarProps {
  selectedText: string
  processing: boolean
  onApply: (instruction: string) => void
  onClearSelection: () => void
  onClose: () => void
}

export function AIEditBar({
  selectedText,
  processing,
  onApply,
  onClearSelection,
  onClose,
}: AIEditBarProps) {
  const [instruction, setInstruction] = useState('')
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function toggleChip(id: string) {
    if (processing) return
    setSelectedChips(prev => {
      const next = new Set(prev)
      const action = QUICK_ACTIONS.find(a => a.id === id)!

      if (next.has(id)) {
        next.delete(id)
      } else {
        if (action.group === CONFLICTING_GROUP) {
          QUICK_ACTIONS
            .filter(a => a.group === CONFLICTING_GROUP && a.id !== id)
            .forEach(a => next.delete(a.id))
        }
        next.add(id)
      }
      return next
    })
  }

  function buildInstruction(): string {
    const parts: string[] = []

    const chipInstructions = QUICK_ACTIONS
      .filter(a => selectedChips.has(a.id))
      .map(a => a.instruction)
    parts.push(...chipInstructions)

    const trimmed = instruction.trim()
    if (trimmed) parts.push(trimmed)

    return parts.join('. ')
  }

  function handleSubmit() {
    const combined = buildInstruction()
    if (!combined || processing) return
    onApply(combined)
  }

  const canSubmit = selectedChips.size > 0 || instruction.trim().length > 0

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 border-t border-primary/20 bg-surface/98 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
      {selectedText && (
        <div className="flex items-center gap-2 px-6 pt-3 pb-1">
          <Type className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-xs text-text-muted">Editing selection:</span>
          <span className="max-w-[400px] truncate rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
            &ldquo;{selectedText.length > 60 ? selectedText.slice(0, 60) + '...' : selectedText}&rdquo;
          </span>
          <button
            onClick={onClearSelection}
            className="rounded p-0.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-6 py-2 overflow-x-auto scrollbar-none">
        {QUICK_ACTIONS.map((action) => {
          const isSelected = selectedChips.has(action.id)
          return (
            <button
              key={action.id}
              onClick={() => toggleChip(action.id)}
              disabled={processing}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1',
                isSelected
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40 hover:text-primary hover:bg-primary/5',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {action.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 px-6 pb-4">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50" />
          <Input
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
              if (e.key === 'Escape') {
                onClose()
              }
            }}
            placeholder={
              selectedChips.size > 0
                ? 'Add more instructions (optional)...'
                : selectedText
                  ? 'Describe how to edit the selected text...'
                  : 'Describe what to change in this document...'
            }
            disabled={processing}
            className="pl-9"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!canSubmit || processing}
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={processing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
