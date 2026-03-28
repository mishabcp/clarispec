'use client'

import { useLayoutEffect } from 'react'

declare global {
  interface Window {
    /** Set when `/login` client bundle runs `useLayoutEffect` (inspect in Console). */
    __CLARISPEC_LOGIN_CLIENT_AT__?: number
  }
}

/**
 * Runs before sibling `LoginForm` layout effects. No Supabase import — isolates “did any client JS run?”
 * from “did LoginForm effects run?”. Check `<html data-clarispec-login-client>` in Elements if Console is filtered.
 */
export function LoginClientProbe() {
  useLayoutEffect(() => {
    window.__CLARISPEC_LOGIN_CLIENT_AT__ = Date.now()
    document.documentElement.setAttribute('data-clarispec-login-client', '1')
    console.warn('[clarispec] /login probe: client bundle ran (warn — check Default levels → Warnings)')
    console.log('[clarispec] /login probe: client bundle ran (log — check Default levels → Info)')
  }, [])
  return null
}
