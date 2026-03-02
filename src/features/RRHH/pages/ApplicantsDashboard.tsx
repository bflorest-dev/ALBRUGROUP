/**
 * ApplicantsDashboard (moved copy into features/RRHH/pages)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useApplicants } from '@contexts/ApplicantsContext';
import type { Applicant, NewApplicantFormData, EditApplicantFormData, HireApplicantFormData, Statistic } from '@types';
import './ApplicantsDashboard.css';

const ITEMS_PER_PAGE = 10;

export const ApplicantsDashboard = () => {
  // Get applicants from context
  const { applicants, addApplicant, updateApplicant, loading } = useApplicants();
  const [_statistics, _setStatistics] = useState<Statistic[]>([]);

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  // keep track of applicant that was just edited so we can stay on its page
  const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);

  // Hooks
  const { showSuccess, showError } = useNotification();
  const { handleError } = useErrorHandler();

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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((app) =>
        app.fullName.toLowerCase().includes(term) ||
        app.documentNumber?.toLowerCase().includes(term) ||
        app.phoneMobile?.toLowerCase().includes(term)
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

  // adjust page when the number of filtered applicants changes
  // keep edited item visible and otherwise behave as before
  const prevCount = useRef(filteredApplicants.length);
  useEffect(() => {
    const totalPages = Math.ceil(filteredApplicants.length / ITEMS_PER_PAGE) || 1;

    // if we know which id was modified, jump to its page
    if (lastModifiedId) {
      const idx = filteredApplicants.findIndex(app => app.id === lastModifiedId);
      if (idx !== -1) {
        const page = Math.floor(idx / ITEMS_PER_PAGE) + 1;
        setCurrentPage(page);
        setLastModifiedId(null);
        prevCount.current = filteredApplicants.length;
        return;
      }
    }

    setCurrentPage((cur) => {
      // added new item
      if (filteredApplicants.length > prevCount.current) {
        return totalPages;
      }
      // removed items and current page became too large
      if (cur > totalPages) {
        return totalPages;
      }
      return cur;
    });
    prevCount.current = filteredApplicants.length;
  }, [filteredApplicants.length, lastModifiedId]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // prevent duplicates except allowed fields
  const ALLOWED_DUPLICATES = new Set([
    'nombres',
    'apellidos',
    'documentType',
    'positionOfInterest',
    'company',
    'status',
    'campaign',
  ]);

  const validateNoDuplicates = (candidate: Partial<Applicant>, list: Applicant[], ignoreId?: string) => {
    for (const app of list) {
      if (ignoreId && app.id === ignoreId) continue;
      for (const key of Object.keys(candidate)) {
        if (ALLOWED_DUPLICATES.has(key)) continue;
        const val = (candidate as any)[key];
        if (val === undefined || val === null || val === '') continue;
        if ((app as any)[key] === val) {
          throw new Error(`Ya existe otro registro con el mismo valor de ${key}`);
        }
      }
    }
  };

  const handleOpenEditModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    // delay opening until after click event finishes to avoid overlay auto-close
    setTimeout(() => setIsEditModalOpen(true), 0);
  };

  const handleOpenHireModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setTimeout(() => setIsHireModalOpen(true), 0);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedApplicant(null);
  };

  // open modal when an applicant is selected
  useEffect(() => {
    if (selectedApplicant) {
      setIsEditModalOpen(true);
    }
  }, [selectedApplicant]);

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
      company: formData.company || '',
      status: 'POSTULANTE',
    };

    try {
      validateNoDuplicates(newApplicant, applicants);
    } catch (err) {
      if (err instanceof Error) {
        showError(err.message);
        return;
      }
    }

    addApplicant(newApplicant);
    setIsModalOpen(false);
    showSuccess(`Postulante ${newApplicant.fullName} registrado`);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    handleOpenEditModal(applicant);
  };

  const handleEditSubmit = async (formData: EditApplicantFormData) => {
    if (!selectedApplicant) return;

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      ...formData,
      fullName: `${formData.nombres} ${formData.apellidos}`,
    };

    try {
      validateNoDuplicates(updatedApplicant, applicants, selectedApplicant.id);
    } catch (err) {
      if (err instanceof Error) {
        showError(err.message);
        return;
      }
    }

    updateApplicant(selectedApplicant.id, updatedApplicant);
    setLastModifiedId(selectedApplicant.id);
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

      // Actualizar estado local y marcar como aceptado
      const acceptedApplicant: Applicant = { ...selectedApplicant, status: 'APROBADO' };
      updateApplicant(selectedApplicant.id, acceptedApplicant);
      setLastModifiedId(selectedApplicant.id);

      // Actualizar estadísticas (postulantes restantes)
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
    updateApplicant(applicant.id, { ...applicant, status: 'EN_LISTA_NEGRA' });
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
      <Header title="Gestión de Postulantes" searchTerm={searchTerm} onSearchChange={setSearchTerm} />

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
            onHire={handleOpenHireModal}
            onBlacklist={handleBlacklistApplicant}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
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
        {selectedApplicant ? (
          <EditApplicantForm 
            applicant={selectedApplicant}
            onSubmit={handleEditSubmit}
            onCancel={handleCloseEditModal}
          />
        ) : (
          <div>Loading applicant...</div>
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