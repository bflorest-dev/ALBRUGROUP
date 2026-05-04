/**
 * VacioOfertasActivas — Vista cuando no hay ofertas activas
 * Muestra ícono ilustrativo, título, descripción y CTA
 */

import type { ReactElement } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '@shared/ui';

interface VacioOfertasActivasProps {
  onCrear?: () => void;
}

export function VacioOfertasActivas({ onCrear }: VacioOfertasActivasProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <Briefcase
        size={56}
        className="text-brand-200 mb-2"
        aria-hidden="true"
      />
      
      <h3 className="text-lg font-display font-semibold text-brand-900">
        No hay ofertas activas
      </h3>
      
      <p className="text-sm text-gray-400 max-w-xs mx-auto">
        Comienza creando una nueva oferta laboral para tu equipo
      </p>
      
      <div className="flex gap-3 mt-2">
        <Button variant="primary" size="md" onClick={onCrear}>
          Crear primera oferta
        </Button>
        
        {onCrear && (
          <Button variant="secondary" size="md" onClick={onCrear}>
            Actualizar
          </Button>
        )}
      </div>
    </div>
  );
}
