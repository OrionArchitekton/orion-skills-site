/** @type {import('tailwindcss').Config} */
// Bundled Tailwind config (mirrors the danmercede-info template). Vite emits a
// compiled stylesheet at build time — no render-blocking CDN JIT compiler. The
// build-time body-bake (vite-plugin-bodybake.ts) is in the content globs so the
// skip-link / landmark classes it emits into the baked, pre-hydration markup are
// not purged. `extend` merges with (does not replace) the default palette, so
// emerald/red used in the demo terminal remain available.
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './constants.ts',
    './vite-plugin-bodybake.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
};
