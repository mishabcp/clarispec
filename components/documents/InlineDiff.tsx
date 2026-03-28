'use client'

import { useState, useEffect, useCallback } from 'react'
import { diffLines, type Change } from 'diff'
import { Button } from '@/components/ui/button'
import { Check, Undo2, CheckCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type HunkStatus = 'pending' | 'accepted' | 'rejected'

interface Hunk {
  id: number
  oldLines: string[]
  newLines: string[]
  status: HunkStatus
}

interface DiffBlock {
  type: 'unchanged' | 'hunk'
  lines?: string[]
  hunkId?: number
}

interface InlineDiffProps {
  oldContent: string
  newContent: string
  onResolve: (finalContent: string) => void
  onAcceptAll: (newContent: string) => void
  onRejectAll: () => void
}

function computeHunksAndBlocks(oldContent: string, newContent: string) {
  const changes: Change[] = diffLines(oldContent, newContent)

  const hunks: Hunk[] = []
  const blocks: DiffBlock[] = []
  let hunkId = 0

  let i = 0
  while (i < changes.length) {
    const change = changes[i]

    if (!change.added && !change.removed) {
      const lines = (change.value.endsWith('\n') ? change.value.slice(0, -1) : change.value).split('\n')
      blocks.push({ type: 'unchanged', lines })
      i++
      continue
    }

    let removedLines: string[] = []
    let addedLines: string[] = []

    while (i < changes.length && (changes[i].added || changes[i].removed)) {
      const c = changes[i]
      const lines = (c.value.endsWith('\n') ? c.value.slice(0, -1) : c.value).split('\n')
      if (c.removed) {
        removedLines = removedLines.concat(lines)
      } else if (c.added) {
        addedLines = addedLines.concat(lines)
      }
      i++
    }

    const id = hunkId++
    hunks.push({ id, oldLines: removedLines, newLines: addedLines, status: 'pending' })
    blocks.push({ type: 'hunk', hunkId: id })
  }

  return { hunks, blocks }
}

export function InlineDiff({ oldContent, newContent, onResolve, onAcceptAll, onRejectAll }: InlineDiffProps) {
  const [data] = useState(() => computeHunksAndBlocks(oldContent, newContent))
  const [hunkStates, setHunkStates] = useState<Map<number, HunkStatus>>(() => {
    const map = new Map<number, HunkStatus>()
    data.hunks.forEach(h => map.set(h.id, 'pending'))
    return map
  })

  const pendingCount = Array.from(hunkStates.values()).filter(s => s === 'pending').length
  const totalHunks = data.hunks.length

  const assembleContent = useCallback((states: Map<number, HunkStatus>) => {
    const parts: string[] = []
    for (const block of data.blocks) {
      if (block.type === 'unchanged') {
        parts.push(block.lines!.join('\n'))
      } else {
        const hunk = data.hunks.find(h => h.id === block.hunkId)!
        const status = states.get(hunk.id)
        if (status === 'accepted') {
          parts.push(hunk.newLines.join('\n'))
        } else {
          parts.push(hunk.oldLines.join('\n'))
        }
      }
    }
    return parts.join('\n')
  }, [data])

  useEffect(() => {
    if (pendingCount === 0 && totalHunks > 0) {
      onResolve(assembleContent(hunkStates))
    }
  }, [pendingCount, totalHunks, hunkStates, assembleContent, onResolve])

  function setHunk(id: number, status: HunkStatus) {
    setHunkStates(prev => {
      const next = new Map(prev)
      next.set(id, status)
      return next
    })
  }

  function handleAcceptAll() {
    onAcceptAll(newContent)
  }

  function handleRejectAll() {
    onRejectAll()
  }

  if (totalHunks === 0) {
    onRejectAll()
    return null
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 flex items-center justify-between border border-white/[0.08] bg-[#0a0a0b]/80 backdrop-blur-[32px] px-6 py-4 rounded-none shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 truncate">AI Reformulation Preview</span>
          <span className="text-xs text-white/60 font-light mt-0.5">
            <span className="text-white font-bold">{pendingCount}</span>
            {' '}of{' '}
            <span className="text-white font-bold">{totalHunks}</span>
            {' '}change{totalHunks !== 1 ? 's' : ''} pending
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-none border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6 gap-2"
            onClick={handleRejectAll}
          >
            <XCircle className="h-3 w-3" />
            Reject All
          </Button>
          <Button
            className="h-10 rounded-none bg-white text-black hover:bg-white/90 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] px-6 gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            onClick={handleAcceptAll}
          >
            <CheckCheck className="h-3 w-3" />
            Accept All
          </Button>
        </div>
      </div>

      <div className="rounded-none border border-white/[0.08] bg-black/40 font-mono text-[13px] leading-relaxed overflow-x-auto selection:bg-white selection:text-black">
        {data.blocks.map((block, blockIdx) => {
          if (block.type === 'unchanged') {
            return (
              <div key={`u-${blockIdx}`} className="py-2">
                {block.lines!.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-6 py-0.5 text-white/30 font-light whitespace-pre">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          }

          const hunk = data.hunks.find(h => h.id === block.hunkId)!
          const status = hunkStates.get(hunk.id)!

          if (status === 'accepted') {
            return (
              <div key={`h-${hunk.id}`} className="py-2">
                {hunk.newLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-6 py-0.5 text-white/60 font-light whitespace-pre">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          }

          if (status === 'rejected') {
            return (
              <div key={`h-${hunk.id}`} className="py-2">
                {hunk.oldLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-6 py-0.5 text-white/60 font-light whitespace-pre">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div key={`h-${hunk.id}`} className="relative group py-4 bg-white/[0.02] border-y border-white/[0.05]">
              <div className="absolute right-6 top-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <button
                  onClick={() => setHunk(hunk.id, 'rejected')}
                  className="flex items-center gap-2 h-7 px-3 text-[9px] font-bold uppercase tracking-widest text-red-200/50 hover:text-red-200 border border-red-500/20 bg-red-500/[0.05] hover:bg-red-500/10 transition-all duration-300 rounded-none"
                  title="Undo this change"
                >
                  <Undo2 className="h-3 w-3" />
                  Discard
                </button>
                <button
                  onClick={() => setHunk(hunk.id, 'accepted')}
                  className="flex items-center gap-2 h-7 px-3 text-[9px] font-bold uppercase tracking-widest text-green-200/50 hover:text-green-200 border border-green-500/20 bg-green-500/[0.05] hover:bg-green-500/10 transition-all duration-300 rounded-none"
                  title="Keep this change"
                >
                  <Check className="h-3 w-3" />
                  Keep
                </button>
              </div>

              {hunk.oldLines.length > 0 && (
                <div className="space-y-0 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40" />
                  {hunk.oldLines.map((line, lineIdx) => (
                    <div
                      key={`old-${lineIdx}`}
                      className="bg-red-500/[0.03] px-6 py-1 text-red-200/40 line-through decoration-red-500/40 font-light whitespace-pre"
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}

              {hunk.newLines.length > 0 && (
                <div className="space-y-0 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/40" />
                  {hunk.newLines.map((line, lineIdx) => (
                    <div
                      key={`new-${lineIdx}`}
                      className="bg-green-500/[0.03] px-6 py-1 text-green-200/80 font-normal whitespace-pre"
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
