import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ingestAppLogPayload } from '@/lib/app-log-ingest'

function edgeRelease(): string | null {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? null
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

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/login') ||
    path.startsWith('/signup')
  const isRootPage = path === '/'

  const ua = request.headers.get('user-agent')
  const supabaseCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((n) => n.startsWith('sb-') || n.includes('supabase'))

  const logAuth =
    path === '/login' ||
    path === '/signup' ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/')

  if (logAuth) {
    void ingestAppLogPayload({
      source: 'edge',
      level: 'debug',
      message: 'proxy:session check',
      context: {
        pathname: path,
        hasUser: !!user,
        supabase_cookie_names: supabaseCookieNames.length
          ? supabaseCookieNames
          : ['(none)'],
      },
      path,
      user_agent: ua,
      release: edgeRelease(),
      user_id: user?.id ?? null,
    })
  }

  // Include `/` so unauthenticated visitors never hit `app/page.tsx` RSC `redirect()`.
  // In-flight RSC redirects can surface as unhandled "Connection closed." in Flight.
  if (!user && !isAuthPage) {
    const protectedApp =
      path.startsWith('/dashboard') ||
      path.startsWith('/projects') ||
      path.startsWith('/settings')
    void ingestAppLogPayload({
      source: 'edge',
      level: 'warn',
      message: protectedApp
        ? 'proxy:login_diag blocked — no session for protected route'
        : 'proxy:redirect guest → /login',
      context: {
        from: path,
        why: protectedApp
          ? 'getUser() found no user; middleware sends you to /login. Typical causes: session cookie not set yet, wrong Site / domain, expired JWT, or third-party cookies blocked.'
          : 'Unauthenticated request to non-auth page.',
        supabase_cookie_names: supabaseCookieNames.length
          ? supabaseCookieNames
          : ['(none)'],
      },
      path,
      user_agent: ua,
      release: edgeRelease(),
      user_id: null,
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
