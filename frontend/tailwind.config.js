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
        primary: {
          DEFAULT: '#7C3AED',   // Violet/Purple Base (#7C3AED)
          hover: '#5B21B6',     // Dark Violet Hover (#5B21B6)
          light: '#EDE9FE',     // Soft Purple Accent / Glow (#EDE9FE)
          dark: '#6D28D9',      // Rich Violet Accent
        },
        brand: {
          navy: '#7C3AED',       // Remapped to Primary Violet
          navyhover: '#5B21B6',  // Primary Button Hover Violet
          accent: '#8B5CF6',     // Medium Interactive / Accent Purple
          lightbg: '#F8FAFC',    // Soft Off-White Background
          card: '#FFFFFF',       // Pure White Card Background
          border: '#CBD5E1',     // Light Gray / Slate Border
          text: '#0F172A',       // Dark Charcoal / Slate Text
          success: '#16A34A',    // Emerald Green Accent
        },
        nec: {
          purple: '#7C3AED',
          navy: '#7C3AED',
          navyhover: '#5B21B6',
          accent: '#8B5CF6',
          royal: '#7C3AED',
          royaldark: '#5B21B6',
          lightbg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#CBD5E1',
          text: '#0F172A',
          badge: '#E11D48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
