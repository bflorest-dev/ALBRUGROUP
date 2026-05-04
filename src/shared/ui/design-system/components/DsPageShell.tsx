import React from 'react';
import { dsTokens } from '../tokens';
import { cn } from './cn';
import styles from './dsPrimitives.module.css';
import { SessionLogoutButton } from '../../SessionLogoutButton';

interface DsPageShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const DsPageShell: React.FC<DsPageShellProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}) => {
  const c = dsTokens.color;
  const s = dsTokens.shadow;
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-shell-bg': `radial-gradient(circle at top right, ${c.pageAccent} 0%, ${c.pageBackground} 42%, ${c.surface} 100%)`,
    '--ds-shell-header-border': c.border,
    '--ds-shell-header-bg': c.surface,
    '--ds-shell-header-shadow': s.soft,
    '--ds-shell-eyebrow-color': c.textMuted,
    '--ds-shell-title-color': c.textStrong,
    '--ds-shell-subtitle-color': c.textMuted,
  };

  return (
    <div
      className={cn(
        'min-h-screen px-3 py-4 md:px-6 md:py-6',
        styles.pageShellRoot,
        className
      )}
      style={cssVars}
    >
      <div className='mx-auto w-full max-w-[1320px]'>
        <header
          className={cn(
            'rounded-2xl px-5 py-5 md:px-6 md:py-6',
            styles.pageShellHeader,
            headerClassName
          )}
        >
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              {eyebrow ? (
                <p className={cn('mb-1 text-xs font-extrabold uppercase tracking-[0.12em]', styles.pageShellEyebrow)}>
                  {eyebrow}
                </p>
              ) : null}
              <h1 className={cn('text-[1.68rem] font-extrabold leading-tight md:text-[1.9rem]', styles.pageShellTitle)}>{title}</h1>
              {subtitle ? <p className={cn('mt-2 max-w-3xl text-sm leading-relaxed', styles.pageShellSubtitle)}>{subtitle}</p> : null}
            </div>
            <div className='flex shrink-0 flex-wrap items-center gap-2'>
              {actions}
              <SessionLogoutButton />
            </div>
          </div>
        </header>

        <main className={cn('mt-4 space-y-4', contentClassName)}>{children}</main>
      </div>
    </div>
  );
};
