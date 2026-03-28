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
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite',
        /** Auth layout — CSS only (avoids Framer pointer-capture quirks on login/signup) */
        'auth-shell': 'authShell 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards',
        'auth-title': 'authTitle 2.2s cubic-bezier(0.16, 1, 0.36, 1) 0.1s forwards',
        'auth-heading': 'authHeading 1s ease-out 0.5s forwards',
      },
      keyframes: {
        authShell: {
          '0%': { opacity: '0', transform: 'translateY(15px) scale(0.995)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        authTitle: {
          '0%': { opacity: '0', letterSpacing: '0.1em', filter: 'blur(12px)' },
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
