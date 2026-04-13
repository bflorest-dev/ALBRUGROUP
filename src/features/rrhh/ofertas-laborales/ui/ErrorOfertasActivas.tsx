/**
 * ErrorOfertasActivas — Vista cuando la carga de ofertas falla
 * Muestra ícono de error, descripción y botón de reintentos
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/Button';

interface ErrorOfertasActivasProps {
  error?: string;
  onReintentar: () => void;
}

export function ErrorOfertasActivas({ 
  error = 'No pudimos cargar las ofertas', 
  onReintentar 
}: ErrorOfertasActivasProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <div 
        className="bg-red-50 border border-red-200 rounded-card p-4 flex gap-3 items-start"
        role="alert"
      >
        <AlertCircle 
          size={20} 
          className="text-red-300 mt-0.5 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Error al cargar ofertas
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {error}
          </p>
        </div>
      </div>

      {/* Empty State with CTA */}
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <AlertCircle
          size={48}
          className="text-red-300"
          aria-hidden="true"
        />
        
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Ocurrió un problema
        </h2>
        
        <p className="text-sm text-gray-400 max-w-xs">
          No pudimos cargar tus ofertas. Por favor, intenta nuevamente.
        </p>
        
        <Button 
          variant="secondary"
          size="md"
          onClick={onReintentar}
          className="mt-2"
        >
          <RefreshCw size={14} className="inline mr-1" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
