/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // neutral grey base
        bg: '#131517',
        surface: '#1B1E21',
        surface2: '#23272B',
        line: {
          DEFAULT: '#2A2F34', // subtle divider
          strong: '#373D43', // control border
        },
        // green primary accent
        accent: {
          DEFAULT: '#3FB950',
          hover: '#46C75A',
        },
        // orange for boundary highlights
        boundary: {
          DEFAULT: '#F0883E',
          hover: '#F59B57',
        },
        success: '#3FB950',
        error: '#F85149',
        fg: {
          DEFAULT: '#F0F3F5', // primary text
          muted: '#9BA3AB', // secondary text
          faint: '#6B7178', // tertiary / placeholder
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // compact scale
        caption: ['12px', { lineHeight: '16px' }],
        body: ['14px', { lineHeight: '20px' }],
        label: ['13px', { lineHeight: '18px' }],
        team: ['18px', { lineHeight: '22px', fontWeight: '600' }],
        score: ['30px', { lineHeight: '32px', fontWeight: '700' }],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
      },
      transitionDuration: {
        150: '150ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 150ms ease-out',
      },
    },
  },
  plugins: [],
};
