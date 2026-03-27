import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logProxyDebug } from '@/lib/proxy-debug'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
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
    return NextResponse.redirect(url)
  }

  // Signed-in users at `/` go to dashboard; `/login` and `/signup` redirect client-side only.
  if (user && isRootPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
