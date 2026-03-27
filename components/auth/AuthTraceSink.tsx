'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { dumpAuthTraceToConsole, initAuthDebugFromUrl } from '@/lib/auth-debug'

/**
 * Picks up `?authTrace=1` / `?authDebug=1` from the URL on every navigation and prints any
 * new sessionStorage auth trace after route changes (so logs survive client redirects).
 */
export function AuthTraceSink() {
  const pathname = usePathname()

  useEffect(() => {
    initAuthDebugFromUrl()
    dumpAuthTraceToConsole(`after navigation → ${pathname}`)
  }, [pathname])

  return null
}
