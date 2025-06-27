
// const colors = require('tailwindcss/colors');

// Colours permitted are shades of the following: black/white, goldenrod, blue, and red.
// I have considered adding some green, so long as it doesn't appear near any red.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './local/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        silver: {
          DEFAULT: '#9E9E9E',
          50: '#FAFAFA',
          100: '#F0F0F0',
          200: '#DBDBDB',
          300: '#C7C7C7',
          400: '#B2B2B2',
          500: '#9E9E9E',
          600: '#828282',
          700: '#666666',
          800: '#4A4A4A',
          900: '#2E2E2E',
          950: '#202020'
        },
        goldenrod: {
          DEFAULT: '#DAA520',
          50: '#FAF3E0',
          100: '#F8ECCE',
          200: '#F3DEAB',
          300: '#EDD087',
          400: '#E8C263',
          500: '#E3B440',
          600: '#DAA520',
          700: '#A98019',
          800: '#785B12',
          900: '#47360A',
          950: '#2F2307',
        },
        site: {
          'head-bg': '#DAA520',
          'body-bg': '#F3DEAB',
          'body-not-front-bg': '#F8ECCE',
          'button-bg': '#E8C263',
          'menu-bg': '#E3B440',
          'nav-focus-bg': '#B0D8E6', // lightblue
          'cc-head-bg': '#666666',
          'cc-head-fg': '#F0F0F0',
          'cc-foot-bg': '#828282',
          'cc-foot-fg': '#F0F0F0',
          'cc-body-bg': '#C7C7C7',
          'cc-body-fg': '#2E2E2E',
        }
      }
    },
  },
  plugins: [],
}

