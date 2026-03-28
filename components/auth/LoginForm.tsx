'use client'

import { useCallback, useEffect, useState } from 'react'
import { useIsClient } from '@/lib/use-is-client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  authDebugLog,
  authDebugPauseBeforeRedirect,
  isAuthDebugManualRedirect,
  isAuthDebugVerbose,
  documentCookieStats,
  listSupabaseCookieNames,
} from '@/lib/auth-debug'
import { AuthDebugUi } from '@/components/auth/AuthDebugUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [debugEtaMs, setDebugEtaMs] = useState<number | null>(null)
  const [debugManualGate, setDebugManualGate] = useState(false)
  const supabase = createClient()
  const isClient = useIsClient()

  const showDebugUi = isClient && isAuthDebugVerbose()

  // Visible on production too (not gated). If you only see red Errors here, DevTools → Console → enable Default level **Info** (console.log is Info, not Error).
  useEffect(() => {
    console.log('[clarispec] /login loaded (client)')
  }, [])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      authDebugLog('mount getSession', {
        hasSession: Boolean(data.session),
        userId: data.session?.user?.id,
        sbCookieNames: listSupabaseCookieNames(),
      })
      // Verbose: never auto-redirect from this effect — `router.refresh()` after sign-in remounts
      // and would call `replace` immediately, bypassing `authDebugPauseBeforeRedirect` in submit.
      if (data.session?.user && !isAuthDebugVerbose()) {
        // Full navigation so middleware receives sb-* cookies (router.replace can skip them on some hosts).
        window.location.replace('/dashboard')
      }
    })
  }, [supabase])

  const completeDebugNavigation = useCallback(() => {
    setDebugManualGate(false)
    authDebugLog('manual: window.location.assign /dashboard')
    window.location.assign('/dashboard')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setDebugManualGate(false)

    authDebugLog('signInWithPassword: start', {
      email: email.trim(),
      pageOrigin: window.location.origin,
      pagePath: window.location.pathname,
      supabaseApiHost: (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host || '(unset)'
        } catch {
          return '(invalid NEXT_PUBLIC_SUPABASE_URL)'
        }
      })(),
      documentCookieStatsBefore: documentCookieStats(),
    })

    let signData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']
    let signError: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error']
    try {
      const out = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      signData = out.data
      signError = out.error
    } catch (err) {
      console.error('[clarispec] login: signInWithPassword threw before/after fetch', err)
      setError(err instanceof Error ? err.message : 'Sign-in failed unexpectedly.')
      setLoading(false)
      return
    }

    authDebugLog('signInWithPassword: result', {
      error: signError?.message ?? null,
      errorCode: signError && 'code' in signError ? String(signError.code) : null,
      errorStatus: signError && 'status' in signError ? (signError as { status?: number }).status : null,
      hasSession: Boolean(signData.session),
      userId: signData.user?.id,
      expiresAt: signData.session?.expires_at ?? null,
      sbCookieNamesAfter: listSupabaseCookieNames(),
      documentCookieStatsAfter: documentCookieStats(),
    })

    if (signError) {
      authDebugLog('signInWithPassword: failed — stays on /login', {
        hint: 'If invalid credentials, Supabase returns an error above. If email not confirmed, sign-in may be blocked until confirmation.',
      })
      setError(signError.message)
      setLoading(false)
      return
    }

    const { data: afterSession } = await supabase.auth.getSession()
    authDebugLog('getSession: after successful sign-in', {
      hasSession: Boolean(afterSession.session),
      sbCookieNames: listSupabaseCookieNames(),
      documentCookieStats: documentCookieStats(),
    })

    const sbNames = listSupabaseCookieNames()
    if (sbNames.length === 0) {
      authDebugLog(
        'WARN: no sb-* cookies in document after sign-in. Server will see Auth session missing. Check Supabase Auth URL config (Site URL + Redirect URLs) matches this origin; ensure cookies are not blocked.'
      )
    }

    // 1) Pause first (verbose only); 2) full page load so Cookie header includes Supabase cookies for proxy.getUser().
    authDebugLog('order: pause → full navigation /dashboard (or manual gate)')
    await authDebugPauseBeforeRedirect((ms) => setDebugEtaMs(ms))
    setDebugEtaMs(null)

    if (isAuthDebugManualRedirect()) {
      authDebugLog('manual redirect gate active — UI Continue required')
      setDebugManualGate(true)
      setLoading(false)
      return
    }

    authDebugLog('navigating: window.location.assign(/dashboard)', {
      sbCookieNames: listSupabaseCookieNames(),
      documentCookieStats: documentCookieStats(),
    })
    window.location.assign('/dashboard')
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-light text-white tracking-tight leading-none opacity-0 animate-auth-heading">
          Sign in
        </h2>
      </div>

      {/* noValidate: otherwise the browser can block submit (invalid email format, etc.) without firing onSubmit — no Supabase request in Network/HAR */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

        <AuthDebugUi
          visible={showDebugUi}
          countdownMs={debugEtaMs}
          manualGate={debugManualGate}
          onManualContinue={() => {
            completeDebugNavigation()
          }}
        />

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
