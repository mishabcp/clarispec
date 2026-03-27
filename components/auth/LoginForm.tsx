'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginBreadcrumb } from '@/lib/sentry-auth-breadcrumbs'
import { appLogClient, appLogClientAwait } from '@/lib/app-log-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

function now() {
  return new Date().toISOString()
}

/** Safe for logs: no password, no full email. */
function emailMeta(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed.includes('@')) {
    return { length: trimmed.length, domain: null as string | null }
  }
  const [, domain = ''] = trimmed.split('@')
  return { length: trimmed.length, domain: domain || null }
}

/** Cookie names only (no values) — see if Supabase wrote storage after sign-in. */
function supabaseCookieNamesInDocument(): string[] {
  if (typeof document === 'undefined') return []
  return document.cookie
    .split(';')
    .map((s) => s.split('=')[0]?.trim())
    .filter((n): n is string => !!n && n.startsWith('sb-'))
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const conn = typeof navigator !== 'undefined' && 'connection' in navigator
      ? (navigator as Navigator & { connection?: { effectiveType?: string } })
          .connection
      : undefined

    void (async () => {
      await appLogClientAwait('info', 'login:mount', {
        time: now(),
        href: window.location.href,
        visibilityState: document.visibilityState,
        sb_cookie_names: supabaseCookieNamesInDocument(),
      })
      loginBreadcrumb('mount', {
        path: window.location.pathname,
        visibilityState: document.visibilityState,
        onLine: navigator.onLine,
        effectiveType: conn?.effectiveType,
      })

      const { data, error: sessionError } = await supabase.auth.getSession()
      await appLogClientAwait('info', 'login:getSession resolved', {
        time: now(),
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? null,
        expiresAt: data.session?.expires_at ?? null,
        error: sessionError?.message ?? null,
        sb_cookie_names: supabaseCookieNamesInDocument(),
      })
      loginBreadcrumb('getSession resolved', {
        hasSession: !!data.session,
        expiresAt: data.session?.expires_at ?? null,
        sessionError: sessionError?.message ?? null,
      })
      if (data.session?.user) {
        await appLogClientAwait(
          'info',
          'login:session present → full navigation /dashboard',
          { time: now(), sb_cookie_names: supabaseCookieNamesInDocument() }
        )
        loginBreadcrumb('session present → full navigation /dashboard')
        window.location.assign('/dashboard')
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      appLogClient('info', 'login:onAuthStateChange', {
        time: now(),
        event,
        hasSession: !!session,
        userId: session?.user?.id ?? null,
      })
      loginBreadcrumb('onAuthStateChange', {
        event,
        hasSession: !!session,
      })
    })

    const onVis = () => {
      appLogClient('debug', 'login:visibilitychange', {
        time: now(),
        visibilityState: document.visibilityState,
      })
      loginBreadcrumb('visibilitychange', {
        visibilityState: document.visibilityState,
      })
    }
    document.addEventListener('visibilitychange', onVis)

    const onOffline = () => {
      loginBreadcrumb('offline')
    }
    window.addEventListener('offline', onOffline)

    const onPageHide = (e: PageTransitionEvent) => {
      loginBreadcrumb('pagehide', { persisted: e.persisted })
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('pagehide', onPageHide)
      subscription.unsubscribe()
      appLogClient('debug', 'login:unmount', { time: now() })
      loginBreadcrumb('unmount')
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    await appLogClientAwait('info', 'login:signInWithPassword start', {
      time: now(),
      email: emailMeta(email),
    })
    loginBreadcrumb('signInWithPassword start', { email: emailMeta(email) })

    const started = performance.now()
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    const elapsedMs = Math.round(performance.now() - started)

    if (signError) {
      await appLogClientAwait('warn', 'login:signInWithPassword error', {
        time: now(),
        elapsedMs,
        message: signError.message,
        name: signError.name,
        sb_cookie_names: supabaseCookieNamesInDocument(),
      })
      loginBreadcrumb('signInWithPassword error', {
        elapsedMs,
        name: signError.name,
      })
      setError(signError.message)
      setLoading(false)
      return
    }

    const { data: afterSignIn } = await supabase.auth.getSession()
    await appLogClientAwait('info', 'login:post-signIn getSession', {
      time: now(),
      elapsedMs,
      hasSession: !!afterSignIn.session,
      userId: afterSignIn.session?.user?.id ?? null,
      sb_cookie_names: supabaseCookieNamesInDocument(),
    })

    await appLogClientAwait('info', 'login:signInWithPassword ok', {
      time: now(),
      elapsedMs,
    })
    loginBreadcrumb('signInWithPassword ok', { elapsedMs })

    // Full document load so auth cookies are always sent to middleware on /dashboard
    await appLogClientAwait('info', 'login:assign /dashboard (full navigation)', {
      time: now(),
      sb_cookie_names: supabaseCookieNamesInDocument(),
    })
    loginBreadcrumb('window.location.assign /dashboard')
    window.location.assign('/dashboard')
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-light text-white tracking-tight leading-none opacity-0 animate-auth-heading">
          Sign in
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            role="alert"
            className="border-l-[1.5px] border-red-500 bg-red-500/[0.05] px-4 py-3 text-[11px] text-red-400 tracking-wide font-medium rounded-sm mb-4 animate-fade-in"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1 group relative">
            <Label htmlFor="email" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
              Email address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>

          <div className="space-y-1 group relative">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[9px] font-bold text-white/40 uppercase tracking-widest transition-colors duration-300 group-focus-within:text-white/90">
                Password
              </Label>
              <Link href="#" className="text-[8px] font-bold text-white/30 hover:text-white/60 uppercase tracking-tight transition-all duration-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10 border-0 border-b border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] focus:bg-white/[0.04] ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 rounded-none text-white text-[15px] font-light pl-3 placeholder:text-white/10 shadow-none outline-none"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/40 transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="group relative w-full h-11 bg-white text-black hover:bg-white/95 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_4px_24px_rgba(255,255,255,0.08)] active:scale-[0.985] overflow-hidden"
            disabled={loading}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </span>
          </Button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] tracking-normal text-white/40 uppercase">
            No access?{' '}
            <Link prefetch={false} href="/signup" className="text-white/60 hover:text-white transition-all duration-300 ml-2 font-bold border-b border-white/10 hover:border-white/30 pb-0.5">
              Create account
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}




