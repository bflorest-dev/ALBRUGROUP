/**
 * Componente ApplicantsDashboard - Página de postulantes
 */

import { useMemo } from 'react';
import { BiPlus, BiSearch, BiDownload } from 'react-icons/bi';
import { ApplicantsTable } from '../organisms/Tables';
import { Modal } from '../molecules/Modal';
import { NewApplicantForm, EditApplicantForm, HireApplicantForm } from '../organisms/Forms';
import { StatCard } from '../molecules/StatCard';
import { Pagination } from '../molecules/Pagination';
import { Header } from '../organisms/Layout/Header';
import { useNotification } from '../../contexts/useNotification';
import { useData } from '../../contexts/DataContext';
import { useState } from 'react';
import type { Applicant, NewApplicantFormData, EditApplicantFormData, HireApplicantFormData, Employee } from '../../types';
import './ApplicantsDashboard.css';

const ITEMS_PER_PAGE = 10;

export const ApplicantsDashboard = () => {
  const { applicants, setApplicants, addEmployee, removeApplicant } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showSuccess } = useNotification();

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleOpenHireModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsHireModalOpen(true);
  };

  const handleCloseHireModal = () => {
    setIsHireModalOpen(false);
    setSelectedApplicant(null);
  };

  const handleSubmitForm = (formData: NewApplicantFormData) => {
    const newApplicant = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName,
      phoneMobile: formData.phoneMobile,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      positionOfInterest: formData.positionOfInterest,
      modality: formData.modality,
      campaign: formData.campaign,
    };

    setApplicants([...applicants, newApplicant]);
    setIsModalOpen(false);
    showSuccess(`Postulante ${newApplicant.fullName} registrado exitosamente`);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    handleOpenEditModal(applicant);
  };

  const handleEditSubmit = (formData: EditApplicantFormData) => {
    if (!selectedApplicant) return;

    const updatedApplicants = applicants.map((app) => {
      if (app.id === selectedApplicant.id) {
        return {
          ...app,
          fullName: formData.fullName,
          phoneMobile: formData.phoneMobile,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          positionOfInterest: formData.positionOfInterest,
          modality: formData.modality,
          campaign: formData.campaign,
        };
      }
      return app;
    });

    setApplicants(updatedApplicants);
    setIsEditModalOpen(false);
    setSelectedApplicant(null);
    showSuccess(`Cambios de ${formData.fullName} guardados exitosamente`);
  };

  const handleHireApplicant = (applicant: Applicant) => {
    handleOpenHireModal(applicant);
  };

  const handleHireSubmit = (formData: HireApplicantFormData) => {
    if (!selectedApplicant) return;

    // Crear objeto empleado con datos del formulario
    const newEmployee: Employee = {
      id: selectedApplicant.id,
      initials: selectedApplicant.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      fullName: formData.fullName || selectedApplicant.fullName,
      position: formData.role || selectedApplicant.positionOfInterest,
      department: formData.role || selectedApplicant.positionOfInterest,
      status: 'ACTIVO',
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      nationality: formData.nationality || '',
      birthDate: formData.birthDate || '',
      civilStatus: formData.civilStatus || '',
      hasChildren: formData.hasChildren || false,
      district: formData.district || '',
      address: formData.address || '',
      phoneFixed: formData.phoneFixed || '',
      phoneMobile: formData.phoneMobile || selectedApplicant.phoneMobile,
      phoneWork: formData.phoneWork || '',
      personalEmail: formData.personalEmail || '',
      bank: formData.bank || '',
      accountNumber: formData.accountNumber || '',
      interbankNumber: formData.interbankNumber || '',
      startDate: formData.startDate || '',
      modality: formData.modality || selectedApplicant.modality,
      scheduleType: formData.scheduleType || '',
      googleEmail: formData.googleEmail || '',
    };

    // Agregar empleado y eliminar postulante
    addEmployee(newEmployee);
    removeApplicant(selectedApplicant.id);
    
    setIsHireModalOpen(false);
    setSelectedApplicant(null);
    showSuccess(`${formData.fullName} pasado a empleados correctamente`);
  };

  const handleBlacklistApplicant = (applicant: Applicant) => {
    setApplicants(applicants.filter((app) => app.id !== applicant.id));
    showSuccess(`${applicant.fullName} agregado a lista negra correctamente`);
  };

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
              <button className="download-btn" title="Descargar">
                <BiDownload size={18} />
              </button>
              <button 
                className="add-applicant-btn" 
                title="Registrar nuevo postulante"
                onClick={handleOpenModal}
              >
                <BiPlus size={18} />
              </button>
            </div>
          </div>

          <ApplicantsTable
            applicants={paginatedApplicants}
            onEdit={handleEditApplicant}
            onHire={handleHireApplicant}
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
