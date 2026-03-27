'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { authShellBreadcrumb } from '@/lib/sentry-auth-breadcrumbs'

export function AuthShellBreadcrumbs() {
  const pathname = usePathname()

  useEffect(() => {
    const conn =
      typeof navigator !== 'undefined' && 'connection' in navigator
        ? (navigator as Navigator & { connection?: { effectiveType?: string } })
            .connection
        : undefined

    authShellBreadcrumb('auth shell mount', {
      path: pathname ?? window.location.pathname,
      visibilityState: document.visibilityState,
      onLine: navigator.onLine,
      effectiveType: conn?.effectiveType,
    })

    const onVis = () => {
      authShellBreadcrumb('auth shell visibilitychange', {
        visibilityState: document.visibilityState,
      })
    }
    const onOffline = () => {
      authShellBreadcrumb('auth shell offline')
    }
    const onPageHide = (e: PageTransitionEvent) => {
      authShellBreadcrumb('auth shell pagehide', { persisted: e.persisted })
    }

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('offline', onOffline)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('pagehide', onPageHide)
      authShellBreadcrumb('auth shell unmount')
    }
  }, [pathname])

  return null
}
