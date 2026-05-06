/**
 * TipificationPanel - Widget
 * 
 * Panel derecho que muestra:
 * - Detalles del lead seleccionado
 * - Bloques de tipificaciÃ³n con sus opciones
 * - Botones de acciÃ³n (Guardar, Siguiente)
 */

import React from 'react';
import { BiMicrophone } from 'react-icons/bi';
import { MdError } from 'react-icons/md';
import type { LeadDTO } from '@shared/types';
import type { TipificationOptionId } from '@shared/types';
import { TIPIFICATION_BLOCKS } from '@shared/lib';
import { LeadDetailCard, TipificationBlockPanel, Girador } from '@shared/ui';
import { Button } from '@shared/ui';
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
      {/* Contenedor principal split */}
      <div className="panel-content">
        {/* SecciÃ³n izquierda - Detalles del lead */}
        <div className="lead-section">
          <LeadDetailCard lead={selectedLead} />
        </div>

        {/* SecciÃ³n derecha - TipificaciÃ³n */}
        <div className="tipification-section">
          <h2 className="section-heading"><BiMicrophone size={20} className="icon-inline" />TIPIFICACIÓN</h2>
          
          {error && (
            <div className="error-alert">
              <MdError size={18} className="icon-inline icon-error" />
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Bloques de tipificaciÃ³n */}
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

          {/* Barra de acciones - Fondo */}
          <div className="tipification-action-buttons">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          CANCELAR
        </Button>
        <Button
          variant="default"
          onClick={onSaveAndNext}
          disabled={isSubmitting || !selectedOptionId}
        >
          {isSubmitting ? (
            <>
              <Girador size="small" />
              GUARDANDO...
            </>
          ) : (
            'GUARDAR Y SIGUIENTE â†’'
          )}
        </Button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TipificationPanel;

