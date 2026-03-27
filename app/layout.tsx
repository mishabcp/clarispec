import type { Metadata } from 'next'
import './globals.css'
import { AuthTraceSink } from '@/components/auth/AuthTraceSink'

export const metadata: Metadata = {
  title: 'Clarispec — AI-Powered Requirements Engineering',
  description: 'Intelligent requirements gathering and documentation platform for project managers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="min-h-screen bg-navy antialiased"
        suppressHydrationWarning
      >
        <AuthTraceSink />
        {children}
      </body>
    </html>
  )
}
