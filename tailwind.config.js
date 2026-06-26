/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight palette — solid elevated surfaces (was see-through glass)
        base: '#0B0F14',
        base2: '#0E141B',
        accent: '#C7F94B', // electric lime — single accent
        wicket: '#F2555A',
        ink: {
          DEFAULT: '#F2F5F7', // primary text
          muted: '#9AA4AE', // secondary text
          faint: '#5A646E', // tertiary / disabled
        },
        // elevated card surfaces, clearly lighter than the background
        surface: {
          DEFAULT: '#161D27', // card
          raised: '#1C2530', // raised control / hover
          sunken: '#10151C', // inset (inputs)
        },
        glass: {
          fill: '#161D27',
          border: 'rgba(255,255,255,0.09)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 6px 20px -8px rgba(0,0,0,0.6)',
        glow: '0 0 24px rgba(199,249,75,0.25)',
      },
      backgroundImage: {
        'midnight': 'linear-gradient(180deg, #0B0F14 0%, #0E141B 100%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(199,249,75,0.5)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 0 6px rgba(199,249,75,0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
