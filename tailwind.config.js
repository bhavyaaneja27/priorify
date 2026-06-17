/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0a0a0f',
          900: '#12121a',
          850: '#1a1a24',
          800: '#1e1e2e',
          700: '#252535',
          600: '#2d2d42',
          500: '#3a3a55',
          400: '#5a5a7a',
          300: '#8a8aa3',
          200: '#b0b0c8',
          100: '#d0d0e0',
          50: '#e8e8f0',
        },
        accent: {
          blue: '#5b8def',
          teal: '#4ecdc4',
          coral: '#ff6b6b',
          amber: '#f4a261',
          green: '#2ecc71',
          purple: '#9b59b6',
          pink: '#e84393',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
