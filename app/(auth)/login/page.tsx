'use client'

import { useEffect, useLayoutEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

declare global {
  interface Window {
    __CLARISPEC_LOGIN_CLIENT_LOADED_AT?: number
  }
}

export default function LoginPage() {
  useLayoutEffect(() => {
    window.__CLARISPEC_LOGIN_CLIENT_LOADED_AT = Date.now()
    console.warn('[clarispec /login] useLayoutEffect — we are now in login page')
  }, [])

  useEffect(() => {
    console.warn('[clarispec /login] useEffect — we are now in login page')
    console.log('[clarispec /login] useEffect — we are now in login page (log)')
  }, [])

  return (
    <>
      {/* Does not rely on DevTools: if you see this, the /login client bundle ran. Remove when done debugging. */}
      <div
        className="pointer-events-none fixed bottom-3 right-3 z-[9999] max-w-[min(100vw-1.5rem,280px)] rounded border border-amber-400/60 bg-amber-950/95 px-2 py-1.5 font-mono text-[10px] leading-snug text-amber-100 shadow-lg"
        aria-hidden
      >
        <span className="font-bold text-amber-300">/login</span> client JS loaded — if missing, this page is not
        hydrating (or you are not on <span className="text-white">/login</span>).
      </div>
      <LoginForm />
    </>
  )
}
