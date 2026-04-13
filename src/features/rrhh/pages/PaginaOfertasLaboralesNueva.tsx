/**
 * PaginaOfertasLaboralesNueva
 * Página para crear nuevas ofertas laborales
 * Ruta: /rrhh/ofertas-laborales/nueva
 * Roles permitidos: ADMINISTRADOR, RRHH
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OfertaLaboralForm } from '@features/rrhh/ofertas-laborales';

export function PaginaOfertasLaboralesNueva() {
  const navigate = useNavigate();

  /**
   * Manejar éxito - navegar de vuelta a lista de ofertas (cuando exista)
   */
  const handleSuccess = (id: number) => {
    console.log('Oferta creada exitosamente:', id);
    // TODO: Navegar a lista de ofertas cuando esté implementada
    // navigate('/rrhh/ofertas-laborales', { state: { newId: id } });
    navigate('/rrhh', { state: { tab: 'ofertas', newId: id } });
  };

  /**
   * Manejar cancelación - navegar de vuelta a RRHH
   */
  const handleCancel = () => {
    navigate('/rrhh');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 underline mb-4 flex items-center gap-2"
          >
            ← Volver a RRHH
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Crear Nueva Oferta Laboral
          </h1>
          <p className="text-gray-600 mt-2">
            Completa el formulario para registrar una nueva oferta de empleo en el sistema
          </p>
        </div>

        {/* Formulario */}
        <OfertaLaboralForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          className="mb-8"
        />
      </div>
    </div>
  );
}

export default PaginaOfertasLaboralesNueva;
