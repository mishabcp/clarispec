'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, X, Sparkles, Type, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const QUICK_ACTIONS = [
  { id: 'detailed', label: 'Elaborate', instruction: 'Make this section more detailed with specific examples and explanations', group: 'tone' },
  { id: 'simplify', label: 'Streamline', instruction: 'Simplify the language to make it easier to understand for non-technical readers', group: 'tone' },
  { id: 'examples', label: 'Illustrate', instruction: 'Add concrete, practical examples where appropriate', group: 'enhance' },
  { id: 'formatting', label: 'Structure', instruction: 'Fix any markdown formatting issues and improve the document structure', group: 'enhance' },
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
            .filter(a => action.group && a.group === CONFLICTING_GROUP && a.id !== id)
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
    <div className="relative w-full rounded-[1px] border border-white/[0.1] bg-[#0a0a0b]/80 backdrop-blur-[64px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.9),0_0_64px_rgba(255,255,255,0.02)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
      
      {/* Selected Text Context */}
      <AnimatePresence>
        {selectedText && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-8 pt-5 pb-3 border-b border-white/[0.08]"
          >
            <Type className="h-3 w-3 shrink-0 text-white/40" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 whitespace-nowrap">Target Scope:</span>
            <span className="max-w-2xl truncate text-[11px] font-mono text-white/60 italic leading-none">
              &ldquo;{selectedText}&rdquo;
            </span>
            <button
              onClick={onClearSelection}
              className="ml-auto rounded-none p-1.5 text-white/10 hover:text-white transition-all duration-300 hover:bg-white/[0.05]"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
          {QUICK_ACTIONS.map((action) => {
            const isSelected = selectedChips.has(action.id)
            return (
              <button
                key={action.id}
                onClick={() => toggleChip(action.id)}
                disabled={processing}
                className={cn(
                  'shrink-0 h-9 px-5 text-[10px] uppercase font-bold tracking-[0.2em] transition-all duration-500 flex items-center gap-2 rounded-none border',
                  isSelected
                    ? 'border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/30 hover:border-white/20 hover:text-white hover:bg-white/[0.06]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {action.label}
              </button>
            )
          })}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Sparkles className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/10 transition-colors group-focus-within:text-white/40" />
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
                  ? 'Add specific directives...'
                  : selectedText
                    ? 'What should we refine in this scope?'
                    : 'Define document modifications...'
              }
              disabled={processing}
              className="h-14 pl-14 pr-4 bg-white/[0.02] border-white/[0.1] focus:border-white/30 focus:bg-white/[0.05] rounded-none text-white font-light tracking-wide text-base placeholder:text-white/10 transition-all duration-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              className="h-14 px-8 bg-white text-black hover:bg-white/90 rounded-none transition-all duration-700 disabled:opacity-50 font-bold text-[10px] uppercase tracking-[0.2em]"
              onClick={handleSubmit}
              disabled={!canSubmit || processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  Commit
                  <Send className="h-3 w-3 rotate-45 -translate-y-0.5" />
                </div>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-white/10 hover:text-white hover:bg-white/[0.05] rounded-none transition-all duration-300"
              onClick={onClose}
              disabled={processing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
