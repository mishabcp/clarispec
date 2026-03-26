'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Check, ChevronDown, ChevronRight, PenLine, Send, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REQUIREMENT_AREA_LABELS } from '@/types'
import type { RequirementAreas } from '@/types'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface QuestionCardProps {
  acknowledgment: string
  question: string
  category: keyof RequirementAreas
  suggestions: string[]
  suggestionDetails?: string[]
  onSuggestionClick: (suggestion: string) => void
  onMultiSelectConfirm?: (selectedOptions: string[]) => void
  onOtherSubmit?: (customAnswer: string) => void
}

export function QuestionCard({
  acknowledgment,
  question,
  category,
  suggestions,
  suggestionDetails,
  onSuggestionClick,
  onMultiSelectConfirm,
  onOtherSubmit,
}: QuestionCardProps) {
  const [additionalText, setAdditionalText] = useState('')
  const [showAdditionalInput, setShowAdditionalInput] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [expandedDetailIndex, setExpandedDetailIndex] = useState<number | null>(null)
  const categoryLabel = REQUIREMENT_AREA_LABELS[category]?.label || category

  function toggleDetail(idx: number) {
    setExpandedDetailIndex((prev) => (prev === idx ? null : idx))
  }

  function toggleOption(idx: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function buildCombinedAnswer(): string {
    const selectedOptions = Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map((i) => options[i])

    const trimmedExtra = additionalText.trim()
    const parts: string[] = []

    if (selectedOptions.length > 0) {
      parts.push(
        selectedOptions.length === 1
          ? selectedOptions[0]
          : selectedOptions.join(', ').replace(/, ([^,]*)$/, ' and $1')
      )
    }

    if (trimmedExtra) {
      if (parts.length > 0) {
        parts.push(`. Also: ${trimmedExtra}`)
      } else {
        parts.push(trimmedExtra)
      }
    }

    return parts.join('')
  }

  function handleConfirm() {
    const combined = buildCombinedAnswer()
    if (!combined) return

    if (onMultiSelectConfirm && selectedIndices.size > 0) {
      onMultiSelectConfirm([combined])
    } else if (onOtherSubmit) {
      onOtherSubmit(combined)
    }
  }

  function handleOnlyTextSubmit() {
    const trimmed = additionalText.trim()
    if (!trimmed || selectedIndices.size > 0) return
    if (onOtherSubmit) {
      onOtherSubmit(trimmed)
      setAdditionalText('')
    }
  }

  const hasSelection = selectedIndices.size > 0
  const hasText = additionalText.trim().length > 0
  const canSubmit = hasSelection || hasText

  const options = suggestions.slice(0, 4)
  const details = suggestionDetails?.slice(0, 4)

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
        <Bot className="h-4 w-4 text-accent" />
      </div>
      <div className="max-w-[85%] flex-1 space-y-3">
        {acknowledgment && (
          <div className="rounded-2xl rounded-tl-sm bg-surface border border-border px-4 py-3 text-sm text-text-secondary">
            {acknowledgment}
          </div>
        )}
        <div className="rounded-2xl bg-surface border border-primary/20 px-4 py-4">
          <Badge variant="outline" className="mb-2 text-[10px]">
            {categoryLabel}
          </Badge>
          <p className="text-sm font-medium text-text-primary leading-relaxed mb-4">
            {question}
          </p>

          <div className="space-y-2">
            {options.map((suggestion, idx) => {
              const selected = selectedIndices.has(idx)
              const detail = details?.[idx]
              const isDetailExpanded = expandedDetailIndex === idx
              return (
                <div key={suggestion} className="space-y-0">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => toggleOption(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleOption(idx)
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-text-primary transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-text-primary'
                        : 'border-border bg-surface-hover/50 hover:border-primary/40 hover:bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        selected
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-surface text-text-secondary'
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : OPTION_LABELS[idx]}
                    </span>
                    <span className="flex-1 min-w-0">{suggestion}</span>
                    {detail && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDetail(idx)
                        }}
                        className={cn(
                          'shrink-0 rounded px-2 py-1 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1',
                          isDetailExpanded && 'text-primary bg-primary/10'
                        )}
                        aria-expanded={isDetailExpanded}
                      >
                        {isDetailExpanded ? (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3.5 w-3.5" />
                            What does this mean?
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {detail && isDetailExpanded && (
                    <div className="mt-1.5 ml-10 rounded-md bg-surface-hover/80 border border-border px-3 py-2.5 text-sm text-text-secondary leading-relaxed">
                      {detail}
                    </div>
                  )}
                </div>
              )
            })}

            {showAdditionalInput ? (
              <div className="flex gap-2 pt-1">
                <Input
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (hasSelection) {
                        handleConfirm()
                      } else {
                        handleOnlyTextSubmit()
                      }
                    }
                  }}
                  placeholder={hasSelection ? 'Add anything else...' : 'Type your own answer...'}
                  className="flex-1"
                  autoFocus
                />
                {!hasSelection && (
                  <Button size="icon" onClick={handleOnlyTextSubmit} disabled={!hasText}>
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdditionalInput(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-left text-sm text-text-muted hover:border-primary/30 hover:text-primary transition-colors"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-xs">
                  <PenLine className="h-3.5 w-3.5" />
                </span>
                <span>{hasSelection ? 'Add something else' : 'Other — type my own answer'}</span>
              </button>
            )}

            {(hasSelection || (hasText && hasSelection)) && (
              <Button
                type="button"
                className="mt-2 w-full"
                onClick={handleConfirm}
              >
                {hasText && hasSelection
                  ? 'Confirm selection + additional input'
                  : 'Confirm selection'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
