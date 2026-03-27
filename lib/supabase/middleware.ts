import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Set DEBUG_AUTH_MIDDLEWARE=true (Vercel env) → Runtime / Edge logs; no secrets logged. */
function debugAuth(
  request: NextRequest,
  payload: Record<string, unknown>
): void {
  if (process.env.DEBUG_AUTH_MIDDLEWARE !== 'true') return
  const sbCookieCount = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith('sb-')).length
  console.info(
    '[clarispec/proxy-auth]',
    JSON.stringify({
      ...payload,
      path: request.nextUrl.pathname,
      sbCookieCount,
    })
  )
}

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

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  const isRootPage = request.nextUrl.pathname === '/'

  debugAuth(request, {
    phase: 'after_getUser',
    hasUser: !!user,
    isAuthPage,
    isRootPage,
  })

  // Include `/` so unauthenticated visitors never hit `app/page.tsx` RSC `redirect()`.
  // In-flight RSC redirects can surface as unhandled "Connection closed." in Flight.
  if (!user && !isAuthPage) {
    debugAuth(request, {
      phase: 'redirect_to_login',
      reason: 'no_session_middleware',
    })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Only redirect `/` for signed-in users. Do NOT redirect `/login` or `/signup` here:
  // a middleware 307 on those routes races with the RSC Flight fetch in production and
  // surfaces as unhandled `Error: Connection closed.` — auth pages redirect client-side.
  if (user && isRootPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
