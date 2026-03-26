'use client'

import { useState, useEffect, useCallback } from 'react'
import { diffLines, type Change } from 'diff'
import { Button } from '@/components/ui/button'
import { Check, Undo2, CheckCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="space-y-0">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-border bg-surface/95 backdrop-blur-sm px-4 py-2.5 mb-4">
        <span className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{pendingCount}</span>
          {' '}of{' '}
          <span className="font-semibold text-text-primary">{totalHunks}</span>
          {' '}change{totalHunks !== 1 ? 's' : ''} remaining
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            onClick={handleRejectAll}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject All
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleAcceptAll}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Accept All
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-[#0d1117] font-mono text-sm leading-relaxed overflow-x-auto">
        {data.blocks.map((block, blockIdx) => {
          if (block.type === 'unchanged') {
            return (
              <div key={`u-${blockIdx}`}>
                {block.lines!.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-4 py-0.5 text-text-secondary">
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
              <div key={`h-${hunk.id}`}>
                {hunk.newLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-4 py-0.5 text-text-secondary">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          }

          if (status === 'rejected') {
            return (
              <div key={`h-${hunk.id}`}>
                {hunk.oldLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="px-4 py-0.5 text-text-secondary">
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div key={`h-${hunk.id}`} className="relative group">
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setHunk(hunk.id, 'rejected')}
                  className="flex items-center gap-1 rounded-md border border-red-500/30 bg-[#1a1a2e] px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-colors"
                  title="Undo this change"
                >
                  <Undo2 className="h-3 w-3" />
                  Undo
                </button>
                <button
                  onClick={() => setHunk(hunk.id, 'accepted')}
                  className="flex items-center gap-1 rounded-md border border-green-500/30 bg-[#1a1a2e] px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/15 transition-colors"
                  title="Keep this change"
                >
                  <Check className="h-3 w-3" />
                  Keep
                </button>
              </div>

              {hunk.oldLines.length > 0 && (
                <div>
                  {hunk.oldLines.map((line, lineIdx) => (
                    <div
                      key={`old-${lineIdx}`}
                      className="border-l-2 border-red-500 bg-red-500/10 px-4 py-0.5 text-red-300/80 line-through decoration-red-500/40"
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}

              {hunk.newLines.length > 0 && (
                <div>
                  {hunk.newLines.map((line, lineIdx) => (
                    <div
                      key={`new-${lineIdx}`}
                      className="border-l-2 border-green-500 bg-green-500/10 px-4 py-0.5 text-green-300/90"
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
