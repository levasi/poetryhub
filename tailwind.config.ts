import type { Config } from 'tailwindcss'

/**
 * PoetryHub design system — semantic tokens (surface, content, edge, brand, danger, success).
 * Prefer: bg-surface-page, text-content-muted, border-edge, bg-brand, etc.
 */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './components/**/*.stories.@(js|jsx|ts|tsx)',
    './.storybook/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        typewriter: ['"Courier Prime"', 'Courier', 'monospace'],
      },
      fontSize: {
        /** UI chrome — editorial labels + body */
        'ui-xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        'ui-sm': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'ui-base': ['0.9375rem', { lineHeight: '1.5rem' }],
        /** Display — hero / marketing */
        'display-sm': ['clamp(1.5rem,4vw,1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      maxWidth: {
        /** Comfortable reading measure for prose blocks */
        reading: '42rem',
        content: '72rem',
      },
      spacing: {
        /** Section rhythm */
        section: '5rem',
      },
      boxShadow: {
        /** Theme-aware — see assets/css/color-schemes.css */
        'ds-nav': 'var(--shadow-ds-nav)',
        'ds-card': 'var(--shadow-ds-card)',
        'ds-card-hover': 'var(--shadow-ds-card-hover)',
        'ds-popover': 'var(--shadow-ds-popover)',
      },
      borderRadius: {
        'ds-sm': '0.5rem',
        'ds-md': '0.75rem',
        'ds-lg': '1rem',
        'ds-xl': '1.25rem',
      },
      colors: {
        // ── Semantic tokens — driven by assets/css/color-schemes.css (data-color-scheme on <html>) ──
        surface: {
          page: 'rgb(var(--color-surface-page) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--color-surface-overlay) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--color-content) / <alpha-value>)',
          secondary: 'rgb(var(--color-content-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-content-muted) / <alpha-value>)',
          soft: 'rgb(var(--color-content-soft) / <alpha-value>)',
          hint: 'rgb(var(--color-content-hint) / <alpha-value>)',
        },
        edge: {
          DEFAULT: 'rgb(var(--color-edge) / <alpha-value>)',
          subtle: 'rgb(var(--color-edge-subtle) / <alpha-value>)',
          strong: 'rgb(var(--color-edge-strong) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
          soft: 'rgb(var(--color-brand-soft) / <alpha-value>)',
          foreground: 'rgb(var(--color-brand-foreground) / <alpha-value>)',
          tint: 'rgb(var(--color-brand-tint) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-danger-muted) / <alpha-value>)',
        },
        poem: {
          text: 'rgb(var(--color-poem-text) / <alpha-value>)',
        },
      },
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
