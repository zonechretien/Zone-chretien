/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          50:  '#E8EDF5',
          100: '#C5D0E2',
          200: '#9AADC8',
          300: '#6F8AAE',
          400: '#4D6E96',
          500: '#2B527E',
          600: '#1E3F66',
          700: '#152D4D',
          800: '#0F2040',
          900: '#0A1628',
          950: '#060E1A',
          light: '#132238',
          mid: '#1A3055',
        },
        gold: {
          DEFAULT: '#E8A020',
          50:  '#FDF5E6',
          100: '#FAE6BF',
          200: '#F5C842',
          300: '#F0B030',
          400: '#EBA820',
          500: '#E8A020',
          600: '#D4911C',
          700: '#B87A18',
          light: '#F5C842',
        },
        blue: {
          brand: '#1E5FA8',
          bright: '#2D7DD2',
          600: '#1E5FA8',
        },
        brand: {
          red: '#D94F3B',
        },
      },
      fontFamily: {
        display:  ['var(--font-playfair)', 'Georgia', 'serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:     ['var(--font-dm-sans)', 'sans-serif'],
        bebas:    ['var(--font-bebas)', 'sans-serif'],
        accent:   ['var(--font-bebas)', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'bounce':     'bounce 1s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,160,32,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(232,160,32,0)' } },
      },
    },
  },
  plugins: [],
};
