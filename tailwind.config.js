/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: 'var(--bg-primary)',
          900: 'var(--bg-secondary)',
          850: 'var(--bg-card)',
          800: 'var(--bg-card-hover)',
          700: 'var(--bg-card-hover)',
          600: 'var(--border-color)',
          500: 'var(--border-color)',
          400: 'var(--text-muted)',
          300: 'var(--text-secondary)',
          200: 'var(--text-secondary)',
          100: 'var(--text-primary)',
          50: 'var(--text-primary)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          teal: 'var(--accent-teal)',
          coral: 'var(--accent-coral)',
          amber: 'var(--accent-amber)',
          green: 'var(--accent-green)',
          purple: 'var(--accent-purple)',
          pink: 'var(--accent-pink)',
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
