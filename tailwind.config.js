/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0A1628',
          900: '#0F2447',
          800: '#1A3A6B',
          700: '#1E4D9A',
          600: '#2563EB',
          500: '#3B82F6',
          400: '#60A5FA',
          300: '#93C5FD',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
        'surface-page': '#F8FAFF',
        'surface-card': '#FFFFFF',
        'surface-input': '#F1F5FE',
        'surface-border': '#E2EAF8',
        'status-activa-bg': '#DBEAFE',
        'status-activa-text': '#1D4ED8',
        'status-cerrada-bg': '#F1F5F9',
        'status-cerrada-text': '#475569',
        'status-proceso-bg': '#FEF3C7',
        'status-proceso-text': '#92400E',
        'status-pausada-bg': '#FEE2E2',
        'status-pausada-text': '#991B1B',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(37,99,235,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 4px 16px rgba(37,99,235,0.13), 0 2px 6px rgba(0,0,0,0.06)',
        focus: '0 0 0 3px rgba(59,130,246,0.35)',
        modal: '0 8px 40px rgba(37,99,235,0.18)',
      },
      borderRadius: {
        input: '8px',
        card: '14px',
        badge: '9999px',
        modal: '20px',
      },
    },
  },
}
 satisfies Config;
