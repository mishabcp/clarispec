'use client'

import NextError from 'next/error'

export default function GlobalError({
  error: _error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy antialiased text-white">
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
