'use client'

import { useEffect, useLayoutEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  // useLayoutEffect runs in the browser right after DOM updates (still only on /login).
  useLayoutEffect(() => {
    console.warn('[clarispec /login] useLayoutEffect — we are now in login page')
  }, [])

  useEffect(() => {
    // warn is visible when DevTools hides "Verbose/Info" but shows warnings
    console.warn('[clarispec /login] useEffect — we are now in login page')
    console.log('[clarispec /login] useEffect — we are now in login page (log)')
  }, [])

  return <LoginForm />
}
