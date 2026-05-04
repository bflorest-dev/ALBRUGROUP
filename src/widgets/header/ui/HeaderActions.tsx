/* eslint-disable no-restricted-syntax */
// TODO: Migrar acciones del header a componentes del design-system con cva + cn.

import React from 'react';

interface HeaderActionsProps {
  onPrimaryClick?: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ onPrimaryClick }) => {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrimaryClick} className="px-3 py-2 rounded bg-blue-600 text-white">
        Acción
      </button>
    </div>
  );
};

export default HeaderActions;
