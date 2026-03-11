/**
 * TipificationPanel - Organism
 * 
 * Panel derecho que muestra:
 * - Detalles del lead seleccionado
 * - Bloques de tipificación con sus opciones
 * - Botones de acción (Guardar, Siguiente)
 */

import React, { useMemo } from 'react';
import type { LeadDTO } from '@shared/types';
import type { TipificationOptionId } from '@shared/types/tipification.types';
import { TIPIFICATION_BLOCKS } from '@utils/tipificationConstants';
import { LeadDetailCard } from '@molecules/LeadDetailCard';
import { TipificationBlockPanel } from '@molecules/TipificationBlockPanel';
import { Button } from '@atoms/Button';
import { Spinner } from '@atoms/Spinner';
import './TipificationPanel.css';

interface BackofficeLead extends LeadDTO {
  tipificationStatus?: 'pending' | 'tipified';
  tipificationLabel?: string;
}

interface TipificationPanelProps {
  selectedLead: BackofficeLead | null;
  selectedBlockId: string | null;
  selectedOptionId: TipificationOptionId | null;
  isSubmitting?: boolean;
  error?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onSelectOption?: (optionId: TipificationOptionId) => void;
  onFilterByBlock?: (blockId: string) => void;
  onSaveAndNext?: () => void;
  onCancel?: () => void;
}

export const TipificationPanel: React.FC<TipificationPanelProps> = ({
  selectedLead,
  selectedBlockId,
  selectedOptionId,
  isSubmitting = false,
  error,
  onSelectBlock,
  onSelectOption,
  onFilterByBlock,
  onSaveAndNext,
  onCancel
}) => {
  // Obtener el bloque actual seleccionado
  const currentBlock = useMemo(
    () => selectedBlockId ? TIPIFICATION_BLOCKS.find((b) => b.id === selectedBlockId) : null,
    [selectedBlockId]
  );

  if (!selectedLead) {
    return (
      <div className="tipification-panel empty">
        <div className="empty-message">
          <p>Selecciona un lead para ver detalles y tipificar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tipification-panel">
      {/* Detalle del lead */}
      <LeadDetailCard lead={selectedLead} />

      {/* Sección de tipificación */}
      <div className="tipification-section">
        <h2 className="section-heading">🎙️ RESULTADO DE LLAMADA</h2>
        
        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Bloques de tipificación */}
        <div className="blocks-container">
          {TIPIFICATION_BLOCKS.map((block) => (
            <TipificationBlockPanel
              key={block.id}
              block={block}
              selectedOptionId={selectedBlockId === block.id && selectedOptionId ? selectedOptionId : undefined}
              onSelectOption={(optionId) => {
                if (onSelectBlock) onSelectBlock(block.id);
                if (onSelectOption) onSelectOption(optionId);
              }}
              onFilterByBlock={() => {
                if (onFilterByBlock) onFilterByBlock(block.id);
              }}
              showFilter={true}
            />
          ))}
        </div>

        {/* Información de selección actual */}
        {selectedBlockId && selectedOptionId && (
          <div className="selection-info">
            <p className="info-label">Seleccionada:</p>
            <div className="selection-badge">
              <span className="block-icon">{currentBlock?.icon}</span>
              <span className="selection-text">{selectedOptionId}</span>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="action-buttons">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            CANCELAR
          </Button>
          <Button
            variant="primary"
            onClick={onSaveAndNext}
            disabled={isSubmitting || !selectedOptionId}
          >
            {isSubmitting ? (
              <>
                <Spinner size={16} />
                GUARDANDO...
              </>
            ) : (
              'GUARDAR Y SIGUIENTE →'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TipificationPanel;
