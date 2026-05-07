/**
 * @atom EmptyState — Shared genérico
 * Componente para mostrar estados vacíos en listas/bandejas
 */

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // Botón opcional
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}>
      <div className="mb-4 text-gray-400 dark:text-gray-600">
        {icon || <Inbox size={48} />}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
