/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- Font Families (Roar Africa Inspired) ---
      fontFamily: {
        sans: ['Lato', ...defaultTheme.fontFamily.sans], // Default font
        serif: ['Playfair Display', ...defaultTheme.fontFamily.serif], // Heading/accent font
      },
      // --- Color Palette (Refined) ---
      colors: {
        'brand-cream': '#F5F5F5',
        'brand-off-white': '#FFFFFF',
        'brand-charcoal': '#2D2D2D',
        'brand-gold': '#B8860B',
        'brand-teal': '#14B8A6', // Can adjust/remove later if needed
        'brand-gray-light': '#E5E7EB',
        'brand-gray-medium': '#9CA3AF',
      },
    },
  },
  plugins: [],
}
