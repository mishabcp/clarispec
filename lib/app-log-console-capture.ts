/**
 * Browser-only console → /api/logs (import from instrumentation-client only).
 * No 'use client' — avoids pulling client boundaries into the instrumentation bundle incorrectly.
 */

export function installConsoleForwardToAppLogs(): void {
  if (typeof window === 'undefined') return
  if (process.env.NEXT_PUBLIC_APP_LOG_CAPTURE_CONSOLE !== 'true') return

  const forward = (
    level: 'debug' | 'info' | 'warn' | 'error',
    name: string,
    args: unknown[]
  ) => {
    const first = args[0]
    const msg =
      typeof first === 'string' ? first.slice(0, 500) : '[non-string]'
    if (msg.includes('[app-log]')) return
    void fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'client',
        level,
        message: `[console.${name}] ${msg}`,
        context: { argCount: args.length, path: window.location.pathname },
        path: window.location.pathname,
        release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      }),
      keepalive: true,
    }).catch(() => {})
  }

  for (const name of ['log', 'info', 'warn', 'error'] as const) {
    const orig = console[name].bind(console)
    const level: 'debug' | 'info' | 'warn' | 'error' =
      name === 'log' ? 'debug' : name
    console[name] = (...args: unknown[]) => {
      orig(...args)
      forward(level, name, args)
    }
  }
}
