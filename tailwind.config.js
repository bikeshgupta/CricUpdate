/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // neutral dark grey (no blue tint)
        bg: '#161616',
        surface: '#1F1F1F',
        surface2: '#272727',
        line: {
          DEFAULT: 'rgba(255,255,255,0.08)', // subtle divider
          strong: 'rgba(255,255,255,0.14)', // control border
        },
        // calm corporate teal accent
        accent: {
          DEFAULT: '#16A085',
          hover: '#19B394',
        },
        // muted orange for boundary highlights
        boundary: {
          DEFAULT: '#D9803B',
          hover: '#E5934F',
        },
        success: '#2EA043',
        error: '#F85149',
        fg: {
          DEFAULT: '#F2F2F3', // primary text (neutral)
          muted: '#9B9B9D', // secondary text (neutral grey)
          faint: '#6B6B6D', // tertiary / placeholder
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // consistent compact scale
        caption: ['12px', { lineHeight: '16px' }],
        body: ['14px', { lineHeight: '20px' }],
        item: ['15px', { lineHeight: '20px' }],
        label: ['13px', { lineHeight: '18px' }],
        section: ['16px', { lineHeight: '22px' }],
        title: ['22px', { lineHeight: '28px', fontWeight: '600' }],
        team: ['15px', { lineHeight: '20px', fontWeight: '600' }],
        score: ['32px', { lineHeight: '34px', fontWeight: '700' }],
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
