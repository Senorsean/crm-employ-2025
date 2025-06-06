/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        anthea: {
          blue: '#4F7CAC',
          purple: '#8E4162',
          lime: '#b3d800',
          gradient: {
            start: '#4F7CAC',
            middle: '#7159A6',
            end: '#8E4162'
          }
        }
      },
      backgroundImage: {
        'gradient-anthea': 'linear-gradient(135deg, #4F7CAC 0%, #7159A6 50%, #8E4162 100%)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      }
    },
  },
  plugins: [],
};