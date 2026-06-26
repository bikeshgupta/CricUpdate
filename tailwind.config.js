/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D1117',
        surface: '#161B22',
        surface2: '#1C232C',
        line: {
          DEFAULT: '#21262D', // subtle divider
          strong: '#30363D', // control border
        },
        accent: {
          DEFAULT: '#2F81F7',
          hover: '#388BFD',
        },
        success: '#2EA043',
        error: '#F85149',
        fg: {
          DEFAULT: '#F0F6FC', // primary text
          muted: '#8B949E', // secondary text
          faint: '#6E7681', // tertiary / placeholder
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
