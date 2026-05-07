import React from 'react';

interface FormGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const columnsClassMap: Record<NonNullable<FormGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
};

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  className,
  columns = 2,
}) => {
  const classes = [`grid`, `gap-4`, columnsClassMap[columns], className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};
