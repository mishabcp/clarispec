'use client'

/* This panel reads ?debug_auth=1 / sessionStorage only in the browser after mount; effects are intentional. */
/* eslint-disable react-hooks/set-state-in-effect -- client-only bootstrap for auth debug */

import { useEffect, useState } from 'react'
import {
  AUTH_DEBUG_REDIRECT_DELAY_MS,
  isAuthDebugVerbose,
  subscribeAuthDebugLogs,
  syncAuthDebugFromUrl,
} from '@/lib/auth-debug'

const MAX_LINES = 40
const LINES_KEY = 'clarispec_auth_debug_lines'

function readStoredLines(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(LINES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.slice(-MAX_LINES) : []
  } catch {
    return []
  }
}

/**
 * When auth debug is enabled, shows a banner and a scrollable log (copied to sessionStorage
 * so it can survive quick navigations within the same tab better than the console alone).
 */
export function AuthDebugPanel() {
  const [mounted, setMounted] = useState(false)
  const [verbose, setVerbose] = useState(false)
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    syncAuthDebugFromUrl()
    const v = isAuthDebugVerbose()
    setVerbose(v)
    if (v) setLines(readStoredLines())
  }, [mounted])

  useEffect(() => {
    if (!mounted || !verbose) return
    return subscribeAuthDebugLogs((line) => {
      setLines((prev) => {
        const next = [...prev, line].slice(-MAX_LINES)
        try {
          sessionStorage.setItem(LINES_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    })
  }, [mounted, verbose])

  if (!mounted || !verbose) return null

  return (
    <div className="mb-6 space-y-2 rounded border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-left">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
        Auth debug on
      </p>
      <p className="text-[10px] leading-snug text-amber-100/80">
        Sign-in will pause {AUTH_DEBUG_REDIRECT_DELAY_MS}ms before leaving this page. Logs below
        are copied to sessionStorage for this tab. For the browser console, enable{' '}
        <span className="font-semibold text-amber-50">Preserve log</span>.
      </p>
      <p className="text-[9px] text-amber-200/70">
        Tip: open{' '}
        <code className="rounded bg-black/40 px-1 py-0.5 text-amber-50/90">/login?debug_auth=1</code>{' '}
        (works on production without redeploying).
      </p>
      <pre
        className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded bg-black/50 p-2 font-mono text-[9px] text-amber-50/90"
        aria-live="polite"
      >
        {lines.length === 0 ? '…waiting for auth events…' : lines.join('\n')}
      </pre>
    </div>
  )
}
