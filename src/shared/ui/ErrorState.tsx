/**
 * @atom ErrorState — Shared genérico
 * Componente para mostrar estados de error con opción de reintentar
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}>
      <div className="mb-4 text-red-500 dark:text-red-400">
        <AlertTriangle size={48} />
      </div>

      <p className="text-gray-900 dark:text-gray-100 font-medium">
        {message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          size="sm"
          className="mt-4"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
};
