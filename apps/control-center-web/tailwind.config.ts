import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#080a0f',
          900: '#0e121a',
          850: '#151a24',
          800: '#1d2430',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SFMono-Regular', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config;
