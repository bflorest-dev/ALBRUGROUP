import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaginaNoAutorizado: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">403</h1>
        <p className="text-xl mb-6">No tienes permiso para acceder a esta página</p>
        <button
          onClick={() => navigate('/panel')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Volver al Panel
        </button>
      </div>
    </div>
  );
};

export default PaginaNoAutorizado;
