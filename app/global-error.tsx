'use client'

import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy antialiased text-white">
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
