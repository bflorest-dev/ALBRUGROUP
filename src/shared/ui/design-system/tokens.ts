export const dsTokens = {
  color: {
    pageBackground: 'var(--color-surface-page, var(--surface-page))',
    pageAccent: 'var(--color-surface-accent, var(--surface-page))',
    surface: 'var(--color-surface-card, var(--surface-card))',
    surfaceMuted: 'var(--color-surface-muted, var(--surface-input))',
    border: 'var(--color-surface-border, var(--surface-border))',
    borderSoft: 'var(--color-surface-border-soft, var(--color-surface-border, var(--surface-border)))',
    textStrong: 'var(--color-content-strong, var(--content-primary))',
    textDefault: 'var(--color-content-default, var(--content-primary))',
    textMuted: 'var(--color-content-muted, var(--content-secondary))',
    primary: 'var(--color-brand-600, var(--input-border-focus))',
    primaryHover: 'var(--color-brand-700, var(--color-brand-600, var(--input-border-focus)))',
    primarySoft: 'var(--color-brand-50, var(--color-brand-100, var(--surface-input)))',
    successBg: 'var(--color-status-success-bg, var(--status-success-bg))',
    successText: 'var(--color-status-success-text, var(--status-success-fg))',
    warningBg: 'var(--color-status-warning-bg, var(--status-warning-bg))',
    warningText: 'var(--color-status-warning-text, var(--status-warning-fg))',
    dangerBg: 'var(--color-status-danger-bg, var(--status-error-bg))',
    dangerText: 'var(--color-status-danger-text, var(--status-error-fg))',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px',
  },
  shadow: {
    soft: 'var(--shadow-soft, 0 8px 18px rgba(15, 42, 82, 0.06))',
    card: 'var(--shadow-card, 0 14px 32px rgba(30, 64, 175, 0.1))',
    modal: 'var(--shadow-modal, 0 28px 56px rgba(29, 78, 216, 0.22))',
  },
  typography: {
    title: {
      fontSize: '1.9rem',
      fontWeight: 800,
      lineHeight: 1.15,
    },
    subtitle: {
      fontSize: '0.96rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body: {
      fontSize: '0.92rem',
      fontWeight: 500,
      lineHeight: 1.45,
    },
    label: {
      fontSize: '0.76rem',
      fontWeight: 800,
      lineHeight: 1.35,
    },
  },
} as const;

export type DsTokens = typeof dsTokens;
export type DsColorToken = keyof DsTokens['color'];
export type DsSpacingToken = keyof DsTokens['spacing'];
export type DsRadiusToken = keyof DsTokens['radius'];
export type DsShadowToken = keyof DsTokens['shadow'];
