import React from 'react';
import { dsTokens } from '../tokens';
import { cn } from './cn';
import styles from './dsPrimitives.module.css';

export interface DsTabItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface DsTabsProps<T extends string> {
  value: T;
  items: Array<DsTabItem<T>>;
  onChange: (value: T) => void;
  className?: string;
}

export const DsTabs = <T extends string>({
  value,
  items,
  onChange,
  className,
}: DsTabsProps<T>): React.ReactElement => {
  const c = dsTokens.color;
  const s = dsTokens.shadow;
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--ds-tabs-border': c.border,
    '--ds-tabs-bg': c.surface,
    '--ds-tabs-shadow': s.soft,
    '--ds-tabs-active-border': c.borderSoft,
    '--ds-tabs-active-bg': c.primarySoft,
    '--ds-tabs-active-fg': c.primary,
    '--ds-tabs-inactive-fg': c.textMuted,
    '--ds-tabs-inactive-hover-bg': c.primarySoft,
    '--ds-tabs-inactive-hover-fg': c.primary,
  };

  return (
    <nav
      aria-label='Tabs del design system'
      className={cn(
        'flex flex-wrap gap-2 rounded-2xl p-3',
        styles.tabsContainer,
        className
      )}
      style={cssVars}
    >
      {items.map((item) => {
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            type='button'
            data-active={isActive ? 'true' : 'false'}
            data-tab-value={item.value}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150',
              styles.tabButtonBase,
              isActive
                ? styles.tabButtonActive
                : styles.tabButtonInactive,
              item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
