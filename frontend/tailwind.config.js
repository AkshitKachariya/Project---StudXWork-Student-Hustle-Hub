/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F5F0E8',
          primary: '#FF4A5A',
          secondary: '#3B5BDB',
          accent: '#FFD43B',
          dark: '#1A1A2E',
          success: '#2DC653',
          warning: '#FF922B',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neo':    '4px 4px 0 0 #1A1A2E',
        'neo-md': '6px 6px 0 0 #1A1A2E',
        'neo-lg': '8px 8px 0 0 #1A1A2E',
        'neo-r':  '4px 4px 0 0 #FF4A5A',
        'neo-b':  '4px 4px 0 0 #3B5BDB',
      },
      borderWidth: { '3': '3px', '5': '5px' },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'marquee': 'marquee 20s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        marquee: { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },
      }
    },
  },
  plugins: [],
}
