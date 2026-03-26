const isProd = process.env.NODE_ENV === 'production'

export function clientLog(...args: unknown[]) {
  if (!isProd) console.log(...args)
}

export function clientWarn(...args: unknown[]) {
  if (!isProd) console.warn(...args)
}

export function clientError(...args: unknown[]) {
  if (!isProd) console.error(...args)
}
