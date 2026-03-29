import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: 'transparent',
        surface: {
          DEFAULT: '#0a0a0b',
          hover: 'rgba(255, 255, 255, 0.05)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        primary: {
          DEFAULT: '#ffffff',
          hover: '#f1f1f1',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite',
        /** Auth layout — shorter than before so LCP/FCP are not delayed by entrance-only motion */
        'auth-shell': 'authShell 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.04s forwards',
        'auth-title': 'authTitle 0.75s cubic-bezier(0.16, 1, 0.36, 1) 0.04s forwards',
        'auth-heading': 'authHeading 0.42s ease-out 0.18s forwards',
        /** Sidebar nav sliding highlight — slow, low-contrast drift */
        'sidebar-nav-sheen': 'sidebarNavSheen 14s ease-in-out infinite',
      },
      keyframes: {
        sidebarNavSheen: {
          '0%, 100%': { transform: 'translateX(-8%)' },
          '50%': { transform: 'translateX(8%)' },
        },
        authShell: {
          '0%': { opacity: '0', transform: 'translateY(15px) scale(0.995)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        authTitle: {
          '0%': { opacity: '0', letterSpacing: '0.1em', filter: 'blur(6px)' },
          '100%': { opacity: '1', letterSpacing: '0.28em', filter: 'blur(0px)' },
        },
        authHeading: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
