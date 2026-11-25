/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './ProductDemo.tsx',
    './constants.ts',
    './vite-plugin-bodybake.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        slateNavy: {
          950: '#040D24',
          900: '#091638',
          800: '#102252',
        },
        copper: {
          light: '#FFC08B',
          soft: '#F0975A',
          DEFAULT: '#E68249',
          dark: '#B95122',
          deep: '#993F17',
        },
      },
    },
  },
  plugins: [],
};
