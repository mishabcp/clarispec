import type { Metadata } from 'next'
import './globals.css'
import { CinematicBackground } from '@/components/ui/cinematic-background'

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
        className="min-h-screen bg-[#050505] antialiased relative selection:bg-white/5"
        suppressHydrationWarning
      >
        <CinematicBackground />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
