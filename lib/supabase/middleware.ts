import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const proxyAuthDebug = process.env.AUTH_DEBUG_PROXY === '1'

function logProxyAuth(pathname: string, detail: Record<string, unknown>) {
  if (!proxyAuthDebug) return
  console.log('[clarispec:proxy]', new Date().toISOString(), pathname, detail)
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const sbCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((n) => n.startsWith('sb-'))

  logProxyAuth(request.nextUrl.pathname, {
    hasUser: Boolean(user),
    getUserError: userError?.message ?? null,
    sbCookieNames,
    cookieHeaderLen: request.headers.get('cookie')?.length ?? 0,
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  const isRootPage = request.nextUrl.pathname === '/'

  // Guests never hit `app/page.tsx` RSC (middleware sends them to /login).
  if (!user && !isAuthPage) {
    logProxyAuth(request.nextUrl.pathname, {
      action: 'redirect_guest_to_login',
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
