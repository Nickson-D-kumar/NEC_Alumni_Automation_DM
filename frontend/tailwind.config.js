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
        brand: {
          navy: '#003366',       // Deep Navy Blue
          navyhover: '#002244',  // Primary Button Hover Navy
          accent: '#0077B5',     // Medium Interactive / Accent Blue
          lightbg: '#F8FAFC',    // Soft Off-White Background
          card: '#FFFFFF',       // Pure White Card Background
          border: '#CBD5E1',     // Light Gray / Slate Border
          text: '#0F172A',       // Dark Charcoal / Slate Text
          success: '#16A34A',    // Emerald Green Accent
        },
        nec: {
          navy: '#003366',
          navyhover: '#002244',
          accent: '#0077B5',
          royal: '#003366',
          royaldark: '#002244',
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
