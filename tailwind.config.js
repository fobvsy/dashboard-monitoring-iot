/** @type {import('tailwindcss').Config} */
// Colors resolve to CSS variables so the dark/light theme swap needs no
// per-component classes. Triplets keep Tailwind's /opacity modifiers working.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: token('industrial-950'),
          900: token('industrial-900'),
          850: token('industrial-850'),
          800: token('industrial-800'),
          700: token('industrial-700'),
          600: token('industrial-600'),
        },
        slate: {
          100: token('slate-100'),
          200: token('slate-200'),
          300: token('slate-300'),
          400: token('slate-400'),
        },
        cyber: {
          green: token('cyber-green'),
          cyan: token('cyber-cyan'),
          amber: token('cyber-amber'),
          rose: token('cyber-rose'),
          indigo: token('cyber-indigo')
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
