/**
 * Componente Header - Barra superior
 */

import { useState } from 'react';
import { BiBell, BiLogOut, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { useNotification } from '../../../contexts/useNotification';
import { useSidebar } from '../../../contexts/SidebarContext';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}


export const Header = ({ title, subtitle }: HeaderProps) => {
  const [selectedBreak, setSelectedBreak] = useState('');
  // only track last start timestamp
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startedBanho, setStartedBanho] = useState(false);
  const [startedBreak, setStartedBreak] = useState(false);
  const { showSuccess } = useNotification();
  const { collapsed, toggle } = useSidebar();

  const breakTypes = [
    'INICIO DE BAÑO',
    'FIN DE BAÑO',
    'INICIO DE BREAK',
    'FIN DE BREAK',
  ];

  const handleBreakSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const now = new Date();
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const nowDate = new Date();
    if (value.includes('INICIO')) {
      setStartTime(nowDate);
      showSuccess(`Inicio baño ${time}`);
      if (value.includes('BAÑO')) {
        setStartedBanho(true);
      } else if (value.includes('BREAK')) {
        setStartedBreak(true);
      }
    } else if (value.includes('FIN')) {
      if (startTime) {
        const diffMs = nowDate.getTime() - startTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        showSuccess(`Duración ${hours}h ${mins}m`);
      } else {
        showSuccess(`Fin baño ${time}`);
      }
      setStartTime(null);
      if (value.includes('BAÑO')) {
        setStartedBanho(false);
      } else if (value.includes('BREAK')) {
        setStartedBreak(false);
      }
    }

    setSelectedBreak('');
  };


  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <button
            className="icon-btn sidebar-toggle-btn"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            onClick={toggle}
          >
            {collapsed ? <BiChevronRight size={20} /> : <BiChevronLeft size={20} />}
          </button>

          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        <div className="header-right">
          <div className="break-section">
            <select
              value={selectedBreak}
              onChange={handleBreakSelect}
              className="break-select"
            >
              <option value="">Seleccionar tipo...</option>
              {breakTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                  disabled={
                    (type.includes('FIN DE BAÑO') && !startedBanho) ||
                    (type.includes('FIN DE BREAK') && !startedBreak)
                  }
                >
                  {type}
                </option>
              ))}
            </select>

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

    </header>
  );
};
