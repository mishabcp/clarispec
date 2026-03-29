import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { CinematicBackground } from '@/components/ui/cinematic-background'
import { ClientPerfRoot } from '@/components/perf/ClientPerfRoot'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

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
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="min-h-screen bg-[#050505] antialiased relative selection:bg-white/5"
        suppressHydrationWarning
      >
        <CinematicBackground />
        <div className="relative z-10 w-full h-full">
          <Suspense fallback={null}>
            <ClientPerfRoot />
          </Suspense>
          {children}
        </div>
      </body>
    </html>
  )
}
