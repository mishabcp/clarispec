import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logProxyDebug } from '@/lib/proxy-debug'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'

function nextWithRequestHeaders(request: NextRequest, correlationId?: string) {
  const headers = new Headers(request.headers)
  if (correlationId) {
    headers.set('x-correlation-id', correlationId)
  }
  return NextResponse.next({
    request: {
      headers,
    },
  })
}

export async function updateSession(request: NextRequest, correlationId?: string) {
  let response = nextWithRequestHeaders(request, correlationId)

  // getAll/setAll is required for chunked sb-* cookies; deprecated get/set can miss chunks
  // and only works on localhost when the session fits fewer cookie parts.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
          response = nextWithRequestHeaders(request, correlationId)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const sbCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((n) => n.startsWith('sb-'))

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isRootPage = pathname === '/'

  const sessionDetail: Record<string, unknown> = {
    phase: 'updateSession',
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    getUserError: userError?.message ?? null,
    isAuthPage,
    isRootPage,
  }

  if (isAuthPage && !user) {
    sessionDetail.note =
      'OK for guests on /login|/signup: no session cookie yet. After successful sign-in you should see phase updateSession on /dashboard with sbCookieNames non-empty.'
  }

  if (pathname === '/dashboard' && !user) {
    sessionDetail.diagnosticHints = [
      'If you just signed in: browser did not send sb-* cookies. Check Application → Cookies for this origin; Supabase Auth Site URL must match window location origin (www vs apex).',
      'Confirm Vercel env NEXT_PUBLIC_SUPABASE_URL / ANON_KEY match your Supabase project (Dashboard → Settings → API).',
      'Try another browser or disable extensions blocking cookies.',
    ]
  }

  logProxyDebug(`path:${pathname}`, request, sessionDetail)

  // Guests never hit `app/page.tsx` RSC (middleware sends them to /login).
  if (!user && !isAuthPage) {
    logProxyDebug('action:redirect_guest_to_login', request, {
      fromPath: pathname,
      reason: 'getUser returned no user on a protected route',
      sbCookieNames,
    })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirect = NextResponse.redirect(url)
    if (correlationId) redirect.headers.set('x-correlation-id', correlationId)
    return redirect
  }

  // Signed-in users at `/` go to dashboard; `/login` and `/signup` redirect client-side only.
  if (user && isRootPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirect = NextResponse.redirect(url)
    if (correlationId) redirect.headers.set('x-correlation-id', correlationId)
    return redirect
  }

  if (correlationId) {
    response.headers.set('x-correlation-id', correlationId)
  }
  return response
}
