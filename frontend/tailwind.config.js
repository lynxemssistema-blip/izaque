/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Terapêutica "Santuário Digital" (Calm Technology & Anti-IA)
        sanctuary: {
          // Fundos areia e creme de seda (Zero branco ofuscante)
          cream: '#FAF8F5',
          parchment: '#F4EFEA',
          sand: '#EDE5DC',
          sandDark: '#DDD1C3',

          // Verde Sálvia & Teal Terapêutico (Transmite cura, estabilidade e clareza)
          sageLight: '#E8F1EC',
          sageMuted: '#C2D9CD',
          sage: '#4A7C64',
          sageDeep: '#2A5241',
          sageNight: '#1E3C2F',

          // Terracota Suave (Acolhimento humano e empatia)
          terracottaLight: '#FBF0EC',
          terracotta: '#C86A50',
          terracottaDeep: '#9E4C35',

          // Tons de Noite Terapêutica (Dark mode suave, sem preto puro #000)
          night: '#121820',
          nightSurface: '#1B242E',
          nightCard: '#24303D',
          nightBorder: '#2E3D4D',

          // Texto com contraste gentil (reduz fadiga ocular)
          ink: '#22292F',
          inkMuted: '#576574',
          inkLight: '#8395A7',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      animation: {
        'breathe': 'breathe 5s ease-in-out infinite',
        'soft-pulse': 'softPulse 3s ease-in-out infinite',
        'fade-in-slow': 'fadeInSlow 0.8s ease-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        softPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeInSlow: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
