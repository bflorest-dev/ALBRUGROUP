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
        'surface': {
          'page': '#F8FAFF',
          'accent': '#ECF3FF',
          'card': '#FFFFFF',
          'muted': '#F7FAFF',
          'input': '#F1F5FE',
          'border': '#E2EAF8',
          'border-soft': '#D6E5FF',
        },
        'content': {
          'strong': '#0F2A52',
          'default': '#1E3A60',
          'muted': '#4A688F',
        },
        'status': {
          'success-bg': '#ECFDF3',
          'success-text': '#166534',
          'warning-bg': '#FFF8EB',
          'warning-text': '#8A5A00',
          'danger-bg': '#FFF1F2',
          'danger-text': '#9F1239',
          'activa-bg': '#DBEAFE',
          'activa-text': '#1D4ED8',
          'cerrada-bg': '#F1F5F9',
          'cerrada-text': '#475569',
          'proceso-bg': '#FEF3C7',
          'proceso-text': '#92400E',
          'pausada-bg': '#FEE2E2',
          'pausada-text': '#991B1B',
        },
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
      animation: {
        'fade-slide-up': 'fadeSlideUp 300ms ease both',
        'slide-down': 'slideDown 200ms ease both',
        'slide-up': 'slideUp 300ms ease both',
      },
      keyframes: {
        fadeSlideUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-4px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(16px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
}
