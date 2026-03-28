'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Check, ChevronDown, ChevronRight, PenLine, Send, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REQUIREMENT_AREA_LABELS } from '@/types'
import type { RequirementAreas } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

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
    const selectedOptionsArr = Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map((i) => suggestions[i])

    const trimmedExtra = additionalText.trim()
    const parts: string[] = []

    if (selectedOptionsArr.length > 0) {
      parts.push(
        selectedOptionsArr.length === 1
          ? selectedOptionsArr[0]
          : selectedOptionsArr.join(', ').replace(/, ([^,]*)$/, ' and $1')
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
    <div className="flex gap-4 animate-fade-in group w-full">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white/[0.03] border border-white/[0.08] shadow-inner">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[85%] flex-1 space-y-4">
        {acknowledgment && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1px] bg-white/[0.03] border border-white/[0.08] px-6 py-4 text-xs font-light text-white/40 uppercase tracking-[0.2em] leading-relaxed italic"
          >
            {acknowledgment}
          </motion.div>
        )}
        <div className="rounded-[1px] bg-[#0a0a0b]/60 backdrop-blur-[64px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-6 py-6">
          <Badge variant="outline" className="mb-4 h-5 px-3 text-[8px] uppercase font-bold tracking-[0.2em] bg-white/[0.03] border-white/[0.1] rounded-none">
            {categoryLabel}
          </Badge>
          <h2 className="text-[16px] font-extralight text-white leading-relaxed mb-6 tracking-tight">
            {question}
          </h2>

          <div className="space-y-2">
            {options.map((suggestion, idx) => {
              const selected = selectedIndices.has(idx)
              const detail = details?.[idx]
              const isDetailExpanded = expandedDetailIndex === idx
              return (
                <div key={suggestion} className="space-y-0 relative">
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
                      'flex w-full items-center gap-4 rounded-[1px] border px-4 py-3 text-left transition-all duration-500 overflow-hidden relative group/item',
                      selected
                        ? 'border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    {!selected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent -translate-x-full group-hover/item:translate-x-0 transition-transform duration-1000" />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-none border text-[9px] font-bold uppercase tracking-widest transition-all duration-300',
                        selected
                          ? 'border-black/10 bg-black/5 text-black'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/40 group-hover/item:text-white group-hover/item:border-white/20'
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : OPTION_LABELS[idx]}
                    </span>
                    <span className="flex-1 text-[13px] font-light tracking-wide relative z-10">{suggestion}</span>
                    {detail && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDetail(idx)
                        }}
                        className={cn(
                          'shrink-0 h-7 px-3 text-[8px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center gap-2 relative z-20 border',
                          selected
                           ? 'text-black/40 hover:text-black border-black/10'
                           : 'text-white/20 hover:text-white border-white/[0.08] hover:bg-white/[0.05]',
                          isDetailExpanded && (selected ? 'bg-black/5 border-black/20' : 'bg-white/10 border-white/20 text-white')
                        )}
                        aria-expanded={isDetailExpanded}
                      >
                        {isDetailExpanded ? (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3 w-3" />
                            Definition
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {detail && isDetailExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-12 rounded-[1px] bg-white/[0.03] border border-white/[0.08] px-5 py-4 text-[12px] text-white/60 font-light leading-relaxed">
                           <div className="flex gap-3">
                             <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 shrink-0" />
                             {detail}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            <AnimatePresence>
              {showAdditionalInput ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex gap-2 pt-2"
                >
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
                    placeholder={hasSelection ? 'Elaborate or add specifics...' : 'Describe your perspective...'}
                    className="h-11 bg-white/[0.02] border-white/[0.08] focus:border-white/20 rounded-none text-white font-light tracking-wide text-xs placeholder:text-white/10 px-4 transition-all duration-500"
                    autoFocus
                  />
                  {!hasSelection && (
                    <Button 
                      className="h-11 w-11 bg-white text-black hover:bg-white/90 rounded-none transition-all duration-300 shrink-0 shadow-[0_4px_24px_rgba(255,255,255,0.08)]"
                      onClick={handleOnlyTextSubmit} 
                      disabled={!hasText}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdditionalInput(true)}
                  className="mt-4 flex w-full items-center gap-4 rounded-[1px] border border-dashed border-white/[0.08] px-4 py-3 text-left text-white/20 hover:border-white/30 hover:text-white/80 transition-all duration-500 group/other"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-dashed border-white/[0.08] group-hover/other:border-white/20 transition-colors">
                    <PenLine className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{hasSelection ? 'Specify further' : 'Custom Input'}</span>
                </button>
              )}
            </AnimatePresence>

            {(hasSelection || (hasText && hasSelection)) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  type="button"
                  className="mt-6 h-12 w-full bg-white text-black hover:bg-white/90 rounded-none transition-all duration-700 font-bold text-[9px] uppercase tracking-[0.2em] shadow-[0_4px_32px_rgba(255,255,255,0.1)] active:scale-[0.995]"
                  onClick={handleConfirm}
                >
                  {hasText && hasSelection
                    ? 'Submit composite selection'
                    : 'Confirm and Continue'}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
