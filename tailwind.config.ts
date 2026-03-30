import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Dark ink palette
        ink: {
          50:  '#f5f5f0',
          100: '#e8e8df',
          200: '#d0d0c4',
          300: '#b0b0a0',
          400: '#888878',
          500: '#666658',
          600: '#4a4a3e',
          700: '#323228',
          800: '#1e1e16',
          900: '#0f0f0a',
          950: '#070705',
        },
        // Gold accent
        gold: {
          300: '#fcd47c',
          400: '#f8c44a',
          500: '#e8a800',
          600: '#c48c00',
        },
        // Muted rose for love/emotion tags
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      typography: (theme: (arg: string) => string) => ({
        poem: {
          css: {
            color: theme('colors.ink.800'),
            fontFamily: theme('fontFamily.serif').join(', '),
            fontSize: '1.1875rem',
            lineHeight: '1.9',
            letterSpacing: '0.02em',
          },
        },
      }),
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
