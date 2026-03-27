/**
 * `/` is handled in middleware: guests → /login, signed-in → /dashboard.
 * Avoid `redirect()` here — RSC redirects during Flight decode are a known source of
 * unhandled `Error: Connection closed.` in production bundles.
 */
export default function Home() {
  return null
}
