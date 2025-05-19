/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'leading-relaxed',
    'text-base',
    // Add 'antialiased' if you prefer to apply it via CSS rather than HTML body class
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', ...defaultTheme.fontFamily.sans],
        serif: ['Playfair Display', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        'brand-cream': '#F5F5F5',
        'brand-off-white': '#FFFFFF',
        'brand-charcoal': '#2D2D2D',
        'brand-gold': '#B8860B',
        'brand-teal': '#14B8A6',
        'brand-gray-light': '#E5E7EB',
        'brand-gray-medium': '#9CA3AF',
      },
    },
  },
  plugins: [],
}