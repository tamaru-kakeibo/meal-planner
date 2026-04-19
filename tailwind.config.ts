import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto)', 'sans-serif'],
      },
      colors: {
        blush: {
          50:  '#EFF5F8',
          100: '#DAE8F1',
          200: '#B5CDE3',
          300: '#8FB2D4',
          400: '#6A97C2',
          500: '#5C8AA8',
          600: '#487390',
          700: '#345870',
        },
        sage: {
          50:  '#F4F7F4',
          100: '#E8F0E8',
          200: '#C8DCC8',
          300: '#A8C8A8',
          400: '#8BAF8B',
          500: '#6E966E',
          600: '#567A56',
        },
        cream: {
          50:  '#FDFAF7',
          100: '#F9F5F2',
          200: '#F5EDE6',
          300: '#EDE5DD',
          400: '#E3D5C8',
        },
        warm: {
          50:  '#FBF7F4',
          700: '#9C8578',
          800: '#6B5A4E',
          900: '#3D2B1F',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
