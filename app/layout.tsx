import type { Metadata } from 'next'
import './globals.css'

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
      <body className="min-h-screen bg-navy antialiased">
        {children}
      </body>
    </html>
  )
}
