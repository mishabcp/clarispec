'use client'

import { useEffect } from 'react'

const BUFFER_KEY = 'clarispec_console_buffer_v1'
const MAX_LINES = 200
const MAX_ARG_LEN = 4000

function serializeUnknown(reason: unknown): Record<string, unknown> {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
      cause: reason.cause !== undefined ? String(reason.cause) : undefined,
    }
  }
  if (reason && typeof reason === 'object') {
    try {
      return JSON.parse(JSON.stringify(reason)) as Record<string, unknown>
    } catch {
      return { fallback: String(reason) }
    }
  }
  return { value: String(reason) }
}

function argToString(arg: unknown): string {
  if (arg === undefined) return 'undefined'
  if (arg === null) return 'null'
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'symbol') {
    return String(arg)
  }
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`
  }
  try {
    const s = JSON.stringify(arg, null, 0)
    return s.length > MAX_ARG_LEN ? `${s.slice(0, MAX_ARG_LEN)}…` : s
  } catch {
    return String(arg)
  }
}

type BufferLine = { ts: string; level: string; text: string }

function readBuffer(): BufferLine[] {
  try {
    const raw = sessionStorage.getItem(BUFFER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BufferLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeBuffer(lines: BufferLine[]) {
  try {
    sessionStorage.setItem(BUFFER_KEY, JSON.stringify(lines))
  } catch {
    /* quota */
  }
}

function pushBuffer(level: string, args: unknown[]) {
  const text = args.map(argToString).join(' ')
  const lines = readBuffer()
  lines.push({ ts: new Date().toISOString(), level, text })
  while (lines.length > MAX_LINES) lines.shift()
  writeBuffer(lines)
}

/**
 * Buffers console output to sessionStorage so it survives SPA navigation (e.g. login → dashboard).
 * After redirect, previous logs are replayed once and copied to window for __CLARISPEC_EXPORT_LOGS__().
 *
 * Also: Chrome DevTools → Console → ☑ "Preserve log" keeps the console across navigations without code.
 */
export function ClientErrorLogger() {
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_CLIENT_ERROR_LOGS === 'true'

    if (!enabled) return

    const tag = '[Clarispec client errors]'
    const replayTag = '[Clarispec replay — from previous page]'

    const orig = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    }

    const pending = readBuffer()
    if (pending.length > 0) {
      ;(window as Window & { __CLARISPEC_SNAPSHOT__?: BufferLine[] }).__CLARISPEC_SNAPSHOT__ = pending
      orig.log(
        replayTag,
        `${pending.length} line(s) captured before navigation. Copy from below, or run __CLARISPEC_EXPORT_LOGS__() to copy text to clipboard.`
      )
      pending.forEach((line) => {
        orig.log(`  [${line.ts}] ${line.level}`, line.text)
      })
      orig.log(replayTag, '— end —')
      writeBuffer([])
    }

    function installConsoleTap() {
      const wrap =
        (level: 'log' | 'info' | 'warn' | 'error', fn: typeof console.log) =>
        (...args: unknown[]) => {
          fn(...args)
          try {
            pushBuffer(level, args)
          } catch {
            /* ignore */
          }
        }

      console.log = wrap('log', orig.log)
      console.info = wrap('info', orig.info)
      console.warn = wrap('warn', orig.warn)
      console.error = wrap('error', orig.error)

      return () => {
        console.log = orig.log
        console.info = orig.info
        console.warn = orig.warn
        console.error = orig.error
      }
    }

    const untap = installConsoleTap()

    function onWindowError(event: ErrorEvent) {
      const payload = {
        type: 'window.error' as const,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error:
          event.error instanceof Error
            ? {
                name: event.error.name,
                message: event.error.message,
                stack: event.error.stack,
              }
            : event.error !== undefined
              ? serializeUnknown(event.error)
              : undefined,
        time: new Date().toISOString(),
        href: typeof window !== 'undefined' ? window.location.href : '',
      }
      orig.error(tag, payload)
      try {
        pushBuffer('error', [tag, JSON.stringify(payload)])
      } catch {
        /* ignore */
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const payload = {
        type: 'unhandledrejection' as const,
        reason: serializeUnknown(event.reason),
        time: new Date().toISOString(),
        href: typeof window !== 'undefined' ? window.location.href : '',
      }
      orig.error(tag, payload)
      try {
        pushBuffer('error', [tag, JSON.stringify(payload)])
      } catch {
        /* ignore */
      }
    }

    orig.info(
      tag,
      'Console tap on; output is buffered for the next navigation. Tip: DevTools → ☑ Preserve log'
    )

    type Win = Window & {
      __CLARISPEC_EXPORT_LOGS__?: () => string
      __CLARISPEC_CLEAR_LOG_BUFFER__?: () => void
      __CLARISPEC_SNAPSHOT__?: BufferLine[]
    }
    const w = window as Win

    w.__CLARISPEC_EXPORT_LOGS__ = () => {
      const snap = w.__CLARISPEC_SNAPSHOT__
      const fromStorage = readBuffer()
      const lines = snap?.length ? snap : fromStorage
      const text = lines.map((l) => `[${l.ts}] ${l.level}: ${l.text}`).join('\n')
      if (text.length === 0) {
        orig.info('[Clarispec]', 'No buffered logs.')
        return ''
      }
      void navigator.clipboard?.writeText(text).then(
        () => orig.info('[Clarispec]', 'Copied', lines.length, 'lines to clipboard'),
        () => {
          orig.info('[Clarispec]', 'Clipboard unavailable; printed below:')
          orig.log(text)
        }
      )
      return text
    }

    w.__CLARISPEC_CLEAR_LOG_BUFFER__ = () => {
      sessionStorage.removeItem(BUFFER_KEY)
      delete w.__CLARISPEC_SNAPSHOT__
      orig.info('[Clarispec]', 'Console buffer + snapshot cleared')
    }

    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      untap()
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      delete w.__CLARISPEC_EXPORT_LOGS__
      delete w.__CLARISPEC_CLEAR_LOG_BUFFER__
      delete w.__CLARISPEC_SNAPSHOT__
    }
  }, [])

  return null
}
