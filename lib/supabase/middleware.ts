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
  const logAuth = path === '/login' || path === '/signup' || path === '/dashboard'
  if (logAuth) {
    void ingestAppLogPayload({
      source: 'edge',
      level: 'debug',
      message: 'proxy:session check',
      context: { pathname: path, hasUser: !!user },
      path,
      user_agent: ua,
      release: edgeRelease(),
      user_id: user?.id ?? null,
    })
  }

  // Include `/` so unauthenticated visitors never hit `app/page.tsx` RSC `redirect()`.
  // In-flight RSC redirects can surface as unhandled "Connection closed." in Flight.
  if (!user && !isAuthPage) {
    void ingestAppLogPayload({
      source: 'edge',
      level: 'warn',
      message: 'proxy:redirect guest → /login',
      context: { from: path },
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
