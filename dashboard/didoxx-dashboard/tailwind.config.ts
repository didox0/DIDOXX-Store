import type { Config } from 'tailwindcss';

export default <Config>{
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f2ff',
          100: '#b3e0ff',
          200: '#80cfff',
          300: '#4dbfff',
          400: '#1aafff',
          500: '#0096e6', // neon blue
          600: '#007bb3',
          700: '#006080',
          800: '#00464d',
          900: '#002b33',
        },
        cyan: {
          500: '#00e6e6',
        },
        purple: {
          500: '#c58dff',
        },
        green: {
          500: '#33ff99',
        },
        gradientStart: '#0a0f33', // dark navy
        gradientEnd: '#0a0f33',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      },
      borderRadius: {
        xl: '1rem', // 16px
        '2xl': '1.25rem', // 20px
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
