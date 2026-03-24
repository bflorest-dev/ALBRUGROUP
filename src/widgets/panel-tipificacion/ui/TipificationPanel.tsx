/**
 * TipificationPanel - Widget
 * 
 * Panel derecho que muestra:
 * - Detalles del lead seleccionado
 * - Bloques de tipificación con sus opciones
 * - Botones de acción (Guardar, Siguiente)
 */

import React from 'react';
import { BiMicrophone } from 'react-icons/bi';
import { MdError } from 'react-icons/md';
import type { LeadDTO } from '@compartido/tipos';
import type { TipificationOptionId } from '@compartido/tipos';
import { TIPIFICATION_BLOCKS } from '@compartido/lib';
import { LeadDetailCard, TipificationBlockPanel, Boton, Girador } from '@compartido/ui/base';
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
        {/* Sección izquierda - Detalles del lead */}
        <div className="lead-section">
          <LeadDetailCard lead={selectedLead} />
        </div>

        {/* Sección derecha - Tipificación */}
        <div className="tipification-section">
          <h2 className="section-heading"><BiMicrophone size={20} style={{display: 'inline', marginRight: '8px'}} />TIPIFICACIÓN</h2>
          
          {error && (
            <div className="error-alert">
              <MdError size={18} style={{display: 'inline', marginRight: '6px'}} />
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

          {/* Barra de acciones - Fondo */}
          <div className="tipification-action-buttons">
        <Boton
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          CANCELAR
        </Boton>
        <Boton
          variant="primary"
          onClick={onSaveAndNext}
          disabled={isSubmitting || !selectedOptionId}
        >
          {isSubmitting ? (
            <>
              <Girador size="small" />
              GUARDANDO...
            </>
          ) : (
            'GUARDAR Y SIGUIENTE →'
          )}
        </Boton>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TipificationPanel;
