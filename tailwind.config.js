/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      colors: { 
        primary: '#e50914', 
        dark: '#0f0f0f', 
        card: '#1a1a1a' 
      },
      fontFamily: { 
        sans: ['Inter', 'system-ui', 'sans-serif'] 
      },
      animation: { 
        'fade-in': 'fadeIn 0.5s ease-in-out', 
        'slide-up': 'slideUp 0.3s ease-out', 
        'scale': 'scale 0.2s ease-out' 
      },
      keyframes: { 
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } }, 
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }, 
        scale: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } } 
      }
    },
  },
  plugins: [],
};