/**
 * Componente Header - Barra superior
 */

import { useState } from 'react';
import { BiBell, BiLogOut } from 'react-icons/bi';
import { useNotification } from '../../../contexts/useNotification';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface BreakItem {
  id: string;
  type: string;
  timestamp: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  const [selectedBreak, setSelectedBreak] = useState('');
  const [breakList, setBreakList] = useState<BreakItem[]>([]);
  const { showSuccess } = useNotification();

  const breakTypes = [
    'INICIO DE BAÑO',
    'FIN DE BAÑO',
    'INICIO DE BREAK',
    'FIN DE BREAK',
  ];

  const handleBreakSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      const now = new Date();
      const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      
      const newBreak: BreakItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: value,
        timestamp: time,
      };
      
      setBreakList([...breakList, newBreak]);
      setSelectedBreak('');
    }
  };

  const handleRemoveBreak = (id: string) => {
    setBreakList(breakList.filter(item => item.id !== id));
  };

  const handleConfirm = () => {
    console.log('Registros de descanso:', breakList);
    
    // Determinar el tipo de evento
    const hasInicio = breakList.some(item => item.type.includes('INICIO'));
    const hasFin = breakList.some(item => item.type.includes('FIN'));
    
    let mensaje = '';
    if (hasInicio && !hasFin) {
      mensaje = 'Eventualidad iniciada correctamente';
    } else if (hasFin && !hasInicio) {
      mensaje = 'Eventualidad finalizada correctamente';
    } else {
      mensaje = `${breakList.length} registros guardados correctamente`;
    }
    
    showSuccess(mensaje);
    setBreakList([]);
  };

  const getButtonText = () => {
    if (breakList.length === 0) return 'Confirmar';
    const hasInicio = breakList.some(item => item.type.includes('INICIO'));
    const hasFin = breakList.some(item => item.type.includes('FIN'));
    if (hasInicio) return 'Iniciar';
    if (hasFin) return 'Finalizar';
    return 'Confirmar';
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        <div className="header-right">
          <div className="break-section">
            <select
              value={selectedBreak}
              onChange={handleBreakSelect}
              className="break-select"
              disabled={breakList.length > 0}
            >
              <option value="">Seleccionar tipo...</option>
              {breakTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {breakList.length > 0 && (
              <button className="confirm-btn" onClick={handleConfirm}>
                {getButtonText()}
              </button>
            )}
          </div>

          <div className="header-actions">
            <button className="icon-btn notification-btn" title="Notificaciones">
              <BiBell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <button className="icon-btn logout-btn" title="Cerrar sesión">
              <BiLogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {breakList.length > 0 && (
        <div className="break-list-container">
          <ul className="break-list">
            {breakList.map((item) => (
              <li key={item.id} className="break-item">
                <span className="break-type">{item.type}</span>
                <span className="break-time">{item.timestamp}</span>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveBreak(item.id)}
                  title="Eliminar"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};
