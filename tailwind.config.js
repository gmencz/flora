const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: ['./pages/**/*.tsx', './components/**/*.tsx'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        sidebar: '72px',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: colors.cyan,
      },
      transitionTimingFunction: {
        'server-tooltip': 'cubic-bezier(0,.68,.52,.6)',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['group-hover'],
      pointerEvents: ['group-hover'],
      translate: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
