/**
 * ApplicantsDashboard (moved copy into features/RRHH/pages)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BiPlus, BiSearch, BiDownload } from 'react-icons/bi';
import { ApplicantsTable } from '../components/organisms/Tables';
import { Modal } from '@molecules/Modal';
import { NewApplicantForm, EditApplicantForm, HireApplicantForm } from '../components/organisms/Forms';
import { StatCard } from '@molecules/StatCard';
import { IconButton } from '@atoms/IconButton';
import { Pagination } from '@molecules/Pagination';
import { Header } from '@organisms/Layout/Header';
import { useNotification } from '@contexts/useNotification';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { loadApplicantsFromStorage, saveApplicantsToStorage } from '@utils/localStorage';
import type { Applicant, NewApplicantFormData, EditApplicantFormData, HireApplicantFormData, Statistic } from '@types';
import './ApplicantsDashboard.css';

const ITEMS_PER_PAGE = 10;

export const ApplicantsDashboard = () => {
  // Estado para postulantes
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [_statistics, _setStatistics] = useState<Statistic[]>([]);

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Hooks
  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // load candidates only from local storage; start empty if none
      const stored = loadApplicantsFromStorage();
      const applicantsData: Applicant[] = stored && Array.isArray(stored) ? (stored as Applicant[]) : [];

      // Calcular estadísticas locales por ahora
      const total = applicantsData.length;
      const processingCount = Math.ceil(total * 0.75);
      const blacklistCount = total - processingCount;

      const stats: Statistic[] = [
        { label: 'TOTAL POSTULANTES', value: total },
        { label: 'EN PROCESO', value: processingCount },
        { label: 'LISTA NEGRA', value: blacklistCount },
      ];

      setApplicants(applicantsData);
      _setStatistics(stats);

      // persist initial data
      saveApplicantsToStorage(applicantsData);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Error cargando postulantes'), {
        componentStack: 'ApplicantsDashboard.loadInitialData'
      });
      showError('Error al cargar los postulantes');
    } finally {
      setLoading(false);
    }
  }, [handleError, showError]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    const listener = () => loadInitialData();
    window.addEventListener('applicantsUpdated', listener);
    return () => window.removeEventListener('applicantsUpdated', listener);
  }, [loadInitialData]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = applicants.length;
    const processingCount = Math.ceil(total * 0.75); // 75% en proceso
    const blacklistCount = total - processingCount; // 25% en lista negra

    return [
      { label: 'TOTAL POSTULANTES', value: total },
      { label: 'EN PROCESO', value: processingCount },
      { label: 'LISTA NEGRA', value: blacklistCount },
    ];
  }, [applicants]);

  // Filtrar postulantes por búsqueda
  const filteredApplicants = useMemo(() => {
    let filtered = applicants;
    if (searchTerm) {
      filtered = filtered.filter((app) =>
        app.fullName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        app.documentNumber?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        app.phoneMobile?.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [searchTerm, applicants]);

  // Paginar postulantes filtrados
  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredApplicants.slice(startIndex, endIndex);
  }, [filteredApplicants, currentPage]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedApplicant(null);
  };


  const handleCloseHireModal = () => {
    setIsHireModalOpen(false);
    setSelectedApplicant(null);
  };

  const handleSubmitForm = (formData: NewApplicantFormData) => {
    // purely local creation: generate id and adapt fields
    const newApplicant: Applicant = {
      id: `${Date.now()}`,
      fullName: `${formData.nombres} ${formData.apellidos}`,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      phoneMobile: formData.phoneMobile,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      positionOfInterest: formData.positionOfInterest,
      modality: '',
      campaign: formData.campaign,
      company: formData.company,
      status: 'POSTULANTE',
    };

    setApplicants(prev => {
      const updated = [...prev, newApplicant];
      saveApplicantsToStorage(updated);
      return updated;
    });

    setIsModalOpen(false);
    showSuccess(`Postulante ${newApplicant.fullName} registrado`);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    handleOpenEditModal(applicant);
  };

  const handleEditSubmit = async (formData: EditApplicantFormData) => {
    if (!selectedApplicant) return;

    setApplicants(prev => {
      const updated = prev.map(app =>
        app.id === selectedApplicant.id
          ? { ...app, ...formData, fullName: `${formData.nombres} ${formData.apellidos}` }
          : app
      );
      saveApplicantsToStorage(updated);
      return updated;
    });

    setIsEditModalOpen(false);
    setSelectedApplicant(null);
    showSuccess(`Postulante ${formData.nombres} ${formData.apellidos} actualizado`);
  };


  const handleHireSubmit = async (_formData: HireApplicantFormData) => {
    if (!selectedApplicant) return;

    try {
      // Crear empleado desde el postulante
      // const _employeeData = {
      //   fullName: selectedApplicant.fullName,
      //   documentType: selectedApplicant.documentType,
      //   documentNumber: selectedApplicant.documentNumber,
      //   phoneMobile: selectedApplicant.phoneMobile,
      //   personalEmail: selectedApplicant.personalEmail,
      //   role: formData.role,
      //   startDate: formData.startDate,
      //   modality: formData.modality,
      //   scheduleType: formData.scheduleType,
      //   googleEmail: formData.googleEmail,
      //   baseSalary: formData.baseSalary,
      //   // Campos requeridos adicionales con valores por defecto
      //   nationality: 'Peruana',
      //   birthDate: '',
      //   civilStatus: 'Soltero',
      //   hasChildren: false,
      //   district: '',
      //   address: '',
      //   phoneFixed: '',
      //   phoneWork: '',
      //   bank: '',
      //   accountNumber: '',
      //   interbankNumber: '',
      // };

      // Nota: El backend no tiene endpoint para contratar postulantes
      // Por ahora, solo removemos el postulante localmente
      // TODO: Implementar en backend cuando esté disponible

      // Actualizar estado local
      setApplicants((prev) => prev.filter((app) => app.id !== selectedApplicant.id));

      // Actualizar estadísticas
      const total = applicants.length - 1;
      const processingCount = Math.ceil(total * 0.75);
      const blacklistCount = total - processingCount;

      _setStatistics([
        { label: 'TOTAL POSTULANTES', value: total },
        { label: 'EN PROCESO', value: processingCount },
        { label: 'LISTA NEGRA', value: blacklistCount },
      ]);

      setIsHireModalOpen(false);
      setSelectedApplicant(null);
      showSuccess(`Postulante ${selectedApplicant.fullName} contratado`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al contratar postulante';
      handleError(error instanceof Error ? error : new Error(errorMessage), {
        componentStack: 'ApplicantsDashboard.handleHireSubmit'
      });
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleBlacklistApplicant = (applicant: Applicant) => {
    setApplicants(applicants.filter((app) => app.id !== applicant.id));
    showSuccess(`${applicant.fullName} agregado a lista negra`);
  };

  if (loading) {
    return (
      <div className="applicants-dashboard">
        <Header title="Cargando..." />
        <main className="dashboard-content">
          <div className="loading">Cargando postulantes...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="applicants-dashboard">
      <Header title="Gestión de Postulantes" />

      <main className="dashboard-content">
        {/* Sección de Estadísticas */}
        <section className="statistics-section">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </section>

        {/* Sección de Directorio */}
        <section className="directory-section">
          <div className="section-header">
            <h2>POSTULANTES</h2>
            <div className="section-controls">
              <div className="search-container">
                <BiSearch className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <IconButton aria-label="Descargar" title="Descargar" className="download-btn" size="md">
                <BiDownload size={18} />
              </IconButton>

              <IconButton aria-label="Registrar nuevo postulante" title="Registrar nuevo postulante" variant="primary" className="add-applicant-btn" size="md" onClick={handleOpenModal}>
                <BiPlus size={18} />
              </IconButton>
            </div>
          </div>

          <ApplicantsTable
            applicants={paginatedApplicants}
            onEdit={handleEditApplicant}
            onBlacklist={handleBlacklistApplicant}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredApplicants.length / ITEMS_PER_PAGE)}
            totalItems={filteredApplicants.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </section>
      </main>

      <Modal isOpen={isModalOpen} title="Registrar Nuevo Postulante" onClose={handleCloseModal}>
        <NewApplicantForm onSubmit={handleSubmitForm} onCancel={handleCloseModal} />
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        title="Editar Postulante" 
        onClose={handleCloseEditModal}
      >
        {selectedApplicant && (
          <EditApplicantForm 
            applicant={selectedApplicant}
            onSubmit={handleEditSubmit}
            onCancel={handleCloseEditModal}
          />
        )}
      </Modal>

      <Modal 
        isOpen={isHireModalOpen} 
        title="Registrar Nuevo Empleado" 
        onClose={handleCloseHireModal}
      >
        {selectedApplicant && (
          <HireApplicantForm 
            applicant={selectedApplicant}
            onSubmit={handleHireSubmit}
            onCancel={handleCloseHireModal}
          />
        )}
      </Modal>
    </div>
  );
};