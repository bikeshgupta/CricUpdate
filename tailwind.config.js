/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // matte graphite
        bg: '#1E1E20',
        surface: '#2A2A2D',
        surface2: '#343438', // elevated surface
        line: {
          DEFAULT: 'rgba(255,255,255,0.06)', // soft grey divider
          strong: 'rgba(255,255,255,0.12)', // control border
        },
        // warm champagne gold accent
        accent: {
          DEFAULT: '#C8A95A',
          hover: '#D9BA6A',
          pressed: '#B8933E',
        },
        // boundaries share the gold accent (no second colour)
        boundary: {
          DEFAULT: '#C8A95A',
          hover: '#D9BA6A',
        },
        success: '#46B97A',
        error: '#D9534F',
        fg: {
          DEFAULT: '#F6F6F6', // primary text
          muted: '#A3A3A8', // secondary text
          faint: '#6E6E73', // tertiary / placeholder
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
        score: ['40px', { lineHeight: '42px', fontWeight: '600' }],
      },
      borderRadius: {
        lg: '10px',
        md: '6px',
      },
      transitionDuration: {
        100: '100ms',
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
