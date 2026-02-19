/**
 * ComingSoonPage (moved copy into features/RRHH/pages)
 */

import './ComingSoonPage.css';

interface ComingSoonPageProps {
  title: string;
  icon?: React.ReactNode;
}

export const ComingSoonPage = ({ title, icon }: ComingSoonPageProps) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-container">
        {icon && <div className="coming-soon-icon">{icon}</div>}
        <h1 className="coming-soon-title">{title}</h1>
        <p className="coming-soon-message">Proximamente Habilitado</p>
        <div className="coming-soon-decorative-line"></div>
      </div>
    </div>
  );
};