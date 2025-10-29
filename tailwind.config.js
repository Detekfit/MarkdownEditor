/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#14120b',
        'main-text': '#c9c9c9',
        'accent': '#d97706', // amber-500
        'subtle-border': 'rgb(39 39 42 / 0.5)', // zinc-800 with opacity
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.main-text'),
            '--tw-prose-headings': theme('colors.main-text'),
            '--tw-prose-lead': theme('colors.zinc[500]'),
            '--tw-prose-links': theme('colors.accent'),
            '--tw-prose-bold': theme('colors.main-text'),
            '--tw-prose-counters': theme('colors.zinc[500]'),
            '--tw-prose-bullets': theme('colors.zinc[600]'),
            '--tw-prose-hr': theme('colors.zinc[800]'),
            '--tw-prose-quotes': theme('colors.zinc[400]'),
            '--tw-prose-quote-borders': theme('colors.zinc[700]'),
            '--tw-prose-captions': theme('colors.zinc[500]'),
            '--tw-prose-code': theme('colors.accent'),
            '--tw-prose-pre-code': theme('colors.zinc[300]'),
            '--tw-prose-pre-bg': 'rgb(20 18 11 / 80%)',
            '--tw-prose-th-borders': theme('colors.zinc[700]'),
            '--tw-prose-td-borders': theme('colors.zinc[800]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
