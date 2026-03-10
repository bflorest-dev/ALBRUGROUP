/**
 * GTRDashboard Page Component
 * 
 * Dashboard principal para SUPERVISOR_GTR (Gestión de Tráficos de Reconexión)
 * 
 * Responsabilidades principales:
 * 1. Orquestar toda la lógica de leads y asesores
 * 2. Gestionar estados de carga, error y éxito
 * 3. Coordinar múltiples hooks para filtrado, validación y envío
 * 4. Componer la interfaz mediante componentes reutilizables
 * 
 * Estructura:
 * - Tarjetas de estadísticas (total, nuevos, asignados, en gestión, gestionados)
 * - Sección de asesores: muestra carga de trabajo de cada asesor
 * - Sección de leads: tabla filtrable con búsqueda multicriterio
 * - Modal de creación: formulario para registrar nuevo lead
 * 
 * Hooks integrados:
 * - useLeadsData: Gestiona carga de leads y estados async
 * - useLeadsFiltering: Filtra leads por canal, asesor, campaña, búsqueda
 * - useStatistics: Calcula estadísticas para tarjetas
 * - useLeadColors: Proporciona colores consistentes
 * - useNewLeadForm: Gestiona estado y validación del formulario
 * - useLeadSubmit: Maneja envío con loading/error
 * 
 * Datos mock:
 * - mockAdvisors: 4 asesores con diferentes estados de carga
 * - mockLeadsInitial: 10 leads de ejemplo (simulan API)
 * - Canales: Facebook, Instagram, WhatsApp
 * - Asesores: María, Juan, Ana, Carlos
 * - Campañas: 6 campañas de ejemplo
 * 
 * Flow de usuario:
 * 1. Se cargan leads con delay simulado (useLeadsData)
 * 2. Usuario ve spinner mientras carga
 * 3. Una vez cargados, puede filtrar, buscar, crear lead
 * 4. Para crear lead, abre modal, completa formulario, valida y envía
 * 5. Modal muestra spinner durante envío, error si falla
 * 
 * @component
 * @returns {JSX.Element} Dashboard completo con todas las secciones
 * 
 * @example
 * // Uso en router
 * import { GTRDashboard } from '.../GTRDashboard';
 * <Route path="/supervisor-gtr" element={<GTRDashboard />} />
 * 
 * @note
 * - useLeadsData simula API con delay de 1s
 * - useLeadSubmit simula envío con delay de 1.5s
 * - Ambos deben reemplazarse con llamadas a API real (LeadService)
 */
import { useState, useMemo, useCallback } from 'react';
import { StatCard } from '@molecules/StatCard';
import type { DataTableColumn } from '@molecules/DataTable';
import type { LeadDTO } from '@shared/types/lead.types';
import type { AdvisorDTO } from '@shared/types/advisor.types';
import { useLeadsFiltering, useStatistics, useLeadColors } from '../hooks/useLeadsManagement';
import { useNewLeadForm } from '../hooks/useNewLeadForm';
import { useLeadsData } from '../hooks/useLeadsData';
import { useLeadSubmit } from '../hooks/useLeadSubmit';
import { AdvisorsSection } from '../components/AdvisorsSection';
import { LeadsSection } from '../components/LeadsSection';
import { NewLeadModal } from '../components/NewLeadModal';
import './GTRDashboard.css';

// Type alias para compatibilidad
type Lead = LeadDTO;
type Advisor = AdvisorDTO;

const mockAdvisors: Advisor[] = [
  {
    id: '1',
    initials: 'MA',
    firstName: 'María',
    lastName: 'Antúnez',
    area: 'Norte',
    status: 'Disponible',
    assignedLeads: 8,
    managedLeads: 3,
    totalCapacity: 15,
    utilizationRate: 53,
    isActive: true,
  },
  {
    id: '2',
    initials: 'JU',
    firstName: 'Juan',
    lastName: 'Urrutia',
    area: 'Sur',
    status: 'Ocupado',
    assignedLeads: 12,
    managedLeads: 1,
    totalCapacity: 15,
    utilizationRate: 80,
    isActive: true,
  },
  {
    id: '3',
    initials: 'AN',
    firstName: 'Ana',
    lastName: 'Navarro',
    area: 'Centro',
    status: 'Disponible',
    assignedLeads: 5,
    managedLeads: 1,
    totalCapacity: 15,
    utilizationRate: 33,
    isActive: true,
  },
  {
    id: '4',
    initials: 'CA',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    area: 'Este',
    status: 'Saturado',
    assignedLeads: 15,
    managedLeads: 1,
    totalCapacity: 15,
    utilizationRate: 100,
    isActive: true,
  }
];

const mockLeadsInitial: Lead[] = [
  {
    id: '1',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '04/03/26',
    registrationTime: '08:10 a.m.',
    firstName: 'Roberto',
    lastName: 'Sánchez',
    phone: '+51 987 123 456',
    tipification: 'Sin tipificar',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'Nuevo',
    reassignmentCount: 0,
    aliasName: ''
  },
  {
    id: '2',
    campaign: 'Fibra Empresarial Q1',
    businessUnit: 'Internet Empresas',
    channel: 'Instagram',
    registrationDate: '04/03/26',
    registrationTime: '09:15 a.m.',
    firstName: 'Laura',
    lastName: 'Jiménez',
    phone: '+51 912 345 678',
    tipification: 'Sin tipificar',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'Nuevo',
    reassignmentCount: 0,
    aliasName: ''
  },
  {
    id: '3',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '03/03/26',
    registrationTime: '04:30 p.m.',
    firstName: 'Pedro',
    lastName: 'López',
    phone: '+51 945 678 901',
    tipification: '1 - SEGUIMIENTO',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'En gestión',
    reassignmentCount: 0,
    aliasName: 'MARI.G'
  },
  {
    id: '4',
    campaign: 'Combo TV + Internet',
    businessUnit: 'Telefonía Hogar',
    channel: 'WhatsApp',
    registrationDate: '03/03/26',
    registrationTime: '02:20 p.m.',
    firstName: 'Sofía',
    lastName: 'Ramírez',
    phone: '+51 978 234 567',
    tipification: '2 - AGENDADOS',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'En gestión',
    reassignmentCount: 1,
    aliasName: 'JUAN.P'
  },
  {
    id: '5',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '02/03/26',
    registrationTime: '11:00 a.m.',
    firstName: 'Miguel',
    lastName: 'Torres',
    phone: '+51 934 567 890',
    tipification: '7 - PREVENTA COMPLETA',
    advisor: 'Ana',
    advisorArea: 'Centro',
    followUp: 'Gestionado',
    reassignmentCount: 0,
    aliasName: 'ANA.M'
  },
  {
    id: '6',
    campaign: 'Fibra Empresarial Q1',
    businessUnit: 'Internet Empresas',
    channel: 'Instagram',
    registrationDate: '04/03/26',
    registrationTime: '10:00 a.m.',
    firstName: 'Carmen',
    lastName: 'Vega',
    phone: '+51 956 789 012',
    tipification: 'Sin tipificar',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Nuevo',
    reassignmentCount: 0,
    aliasName: ''
  },
  {
    id: '7',
    campaign: 'Combo TV + Internet',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '03/03/26',
    registrationTime: '09:45 a.m.',
    firstName: 'Diego',
    lastName: 'Morales',
    phone: '+51 967 890 123',
    tipification: '0 - SIN CONTACTO',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Asignado',
    reassignmentCount: 2,
    aliasName: 'CARL.R'
  },
  {
    id: '8',
    campaign: 'Plan Familia Marzo',
    businessUnit: 'Móviles',
    channel: 'Instagram',
    registrationDate: '03/03/26',
    registrationTime: '01:30 p.m.',
    firstName: 'Valeria',
    lastName: 'Herrera',
    phone: '+51 923 456 789',
    tipification: '6 - PDTE SCORE/PREVENTA',
    advisor: 'María',
    advisorArea: 'Norte',
    followUp: 'En gestión',
    reassignmentCount: 0,
    aliasName: 'MARI.G'
  },
  {
    id: '9',
    campaign: 'Retargeting Fibra',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '04/03/26',
    registrationTime: '08:45 a.m.',
    firstName: 'Andrés',
    lastName: 'Castillo',
    phone: '+51 998 765 432',
    tipification: 'Sin tipificar',
    advisor: 'Juan',
    advisorArea: 'Sur',
    followUp: 'Nuevo',
    reassignmentCount: 0,
    aliasName: ''
  },
  {
    id: '10',
    campaign: 'Promo Fibra Marzo',
    businessUnit: 'Telefonía Hogar',
    channel: 'Facebook',
    registrationDate: '02/03/26',
    registrationTime: '03:10 p.m.',
    firstName: 'Lucía',
    lastName: 'Flores',
    phone: '+51 911 234 567',
    tipification: '3 - RECHAZADO',
    advisor: 'Carlos',
    advisorArea: 'Este',
    followUp: 'Gestionado',
    reassignmentCount: 0,
    aliasName: 'MARI.G'
  }
];

const channels = ['Todos', 'Facebook', 'Instagram', 'WhatsApp'];
const advisors = ['Todos', 'María', 'Juan', 'Ana', 'Carlos'];
const campaigns = [
  'Todas las campañas',
  'Promo Fibra Marzo',
  'Fibra Empresarial Q1',
  'Combo TV + Internet',
  'Plan Familia Marzo',
  'Retargeting Fibra'
];

export const GTRDashboard = () => {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  /**
   * ============================================================================
   * HOOKS DE DATOS Y ESTADO
   * ============================================================================
   * Estos hooks manejan la lógica de negocio separada de la presentación
   */

  // useLeadsData: Carga leads con simulación de API (delay 1s)
  // Proporciona: leads, isLoading, error, refetch(), clearError()
  const { leads: mockLeads, isLoading: leadsIsLoading, error: leadsError, refetch: refetchLeads } = useLeadsData(mockLeadsInitial);

  // useLeadsFiltering: Filtra leads por múltiples criterios (canal, asesor, campaña, búsqueda)
  // Usa useMemo para optimizar: solo recalcula cuando leads cambian
  const { filteredLeads, setSearchTerm, setSelectedChannel, setSelectedAdvisor, setSelectedCampaign } = useLeadsFiltering(mockLeads);

  // useLeadColors: Centraliza paleta de colores según canal, estado y tipificación
  // Proporciona: CHANNEL_COLORS, getStatusBadgeStyle(), getTipificationColor(), getProgressFillColor()
  const { CHANNEL_COLORS, getStatusBadgeStyle, getTipificationColor, getProgressFillColor } = useLeadColors();

  // useNewLeadForm: Gestiona estado y validación del formulario
  // Validación: campos requeridos + formato de teléfono según país
  const { formData, errors, handleChange, handleSubmit, reset } = useNewLeadForm();

  // useLeadSubmit: Maneja envío con loading/error (simula: delay 1.5s, error 20%)
  // Estados: isSubmitting, submitError, submit(data), resetSubmitState()
  const { isSubmitting, submitError, submit: submitNewLead, resetSubmitState } = useLeadSubmit();

  // useStatistics: Calcula estadísticas de leads (total, nuevos, asignados, en gestión, gestionados)
  // Usa useMemo: recalcula solo cuando filteredLeads cambian
  const statistics = useStatistics(filteredLeads);

  /**
   * ============================================================================
   * CONFIGURACIÓN DE TABLA
   * ============================================================================
   * Define las columnas y su renderizado para la tabla de leads
   * 
   * OPTIMIZACIÓN Punto #4: Memoizar definiciones de columnas
   * 
   * PROBLEMA: Sin memoización, cada render del dashboard recrea leadsTableColumns
   * - Nuevas referencias [] para cada columna object
   * - DataTable prop comparison detecta cambio (no son ===)
   * - DataTable re-renderiza completamente, incluso si datos no cambiaron
   * - Con 100+ rows, esto causa lag visible en la interfaz
   * 
   * SOLUCIÓN: Envolver en useMemo con dependencias correctas
   * - Columnas memorizadas mientras CHANNEL_COLORS y getTipificationColor sean estables
   * - useLeadColors ya devuelve referencias memorizadas (ver useLeadsManagement.ts)
   * - Resultado: DataTable solo re-renderiza cuando filteredLeads realmente cambia
   */
  const leadsTableColumns: DataTableColumn<Lead>[] = useMemo(() => [
    {
      header: 'FECHA REG.',
      accessor: (l: Lead) => (
        <div className="date-cell">
          <span>{l.registrationDate}</span>
          <small>{l.registrationTime}</small>
        </div>
      ),
    },
    {
      header: 'CAMPAÑA',
      accessor: (l: Lead) => (
        <div className="campaign-cell">
          <strong>{l.campaign}</strong>
          <small>{l.businessUnit}</small>
        </div>
      ),
    },
    {
      header: 'CANAL',
      accessor: (l: Lead) => (
        <span
          className="channel-badge"
          style={{
            '--channel-bg': CHANNEL_COLORS[l.channel] + '20',
            '--channel-color': CHANNEL_COLORS[l.channel],
          } as React.CSSProperties}
        >
          {l.channel}
        </span>
      ),
    },
    {
      header: 'LEAD',
      accessor: (l: Lead) => (
        <div className="lead-cell">
          <strong>{l.firstName}</strong>
          <strong>{l.lastName}</strong>
          <small>{l.phone}</small>
        </div>
      ),
    },
    {
      header: 'TIPIF.',
      accessor: (l: Lead) => (
        <span
          className="tipification-badge"
          style={{
            '--tip-color': getTipificationColor(l.tipification),
          } as React.CSSProperties}
        >
          {l.tipification}
        </span>
      ),
    },
    {
      header: 'ASESOR',
      accessor: (l: Lead) => (
        <div className="advisor-cell">
          <strong>{l.advisor}</strong>
          <small>{l.advisorArea}</small>
        </div>
      ),
    },
    {
      header: 'SEGUIM.',
      accessor: (l: Lead) => <span className="followup-badge">{l.followUp}</span>,
    },
    { header: 'REASIG.', accessor: (l: Lead) => l.reassignmentCount },
    { header: 'ALIAS', accessor: (l: Lead) => l.aliasName },
    {
      header: 'ACCIONES',
      accessor: () => (
        <div className="actions-cell">
          <button className="action-btn view-btn">Ver</button>
          <button className="action-btn assign-btn">Asignar</button>
        </div>
      ),
    },
  ], [CHANNEL_COLORS, getTipificationColor]);

  /**
   * ============================================================================
   * HANDLERS (Funciones de usuario)
   * ============================================================================
   * Orquestan la lógica cuando el usuario interactúa con la interfaz
   * 
   * OPTIMIZACIÓN Punto #4: Memoizar handlers con useCallback
   * 
   * PROBLEMA: Sin memoización, cada render del dashboard crea nuevas funciones
   * - handleCreateNewLead: Nueva referencia [] cada render
   * - handleCloseModal: Nueva referencia [] cada render
   * - Componentes child (LeadsSection, NewLeadModal) reciben nuevas props
   * - React cree que props cambiaron, re-renderiza aunque datos son iguales
   * - Con 100+ componentes, efecto cascada de re-renders innecesarios
   * 
   * SOLUCIÓN: Envolver en useCallback con dependencias correctas
   * - handleCreateNewLead: Depende de handleSubmit, submitNewLead, reset, etc
   * - handleCloseModal: Depende de setIsNewLeadModalOpen, reset, resetSubmitState
   * - Referencias estables para componentes child
   * - Solo recrean si sus dependencias cambian (muy raramente)
   */

  /**
   * Handler: Crear nuevo lead
   * 
   * Flujo:
   * 1. Valida formulario (campos requeridos + formato)
   * 2. Si válido, envía datos con useLeadSubmit (simula API con delay 1.5s)
   * 3. Si envío exitoso:
   *    - Cierra modal
   *    - Limpia formulario y estados
   *    - Refrescar lista de leads (con delay 500ms)
   * 4. Si falla, muestra error en modal y permite reintentar
   * 
   * Nota: El botón está deshabilitado durante isSubmitting para prevenir double-click
   */
  const handleCreateNewLead = useCallback(async () => {
    const result = handleSubmit();
    if (result.valid && result.data) {
      const success = await submitNewLead(result.data);
      if (success) {
        console.log('Nuevo lead creado:', result.data);
        setIsNewLeadModalOpen(false);
        reset();
        resetSubmitState();
        setTimeout(() => {
          refetchLeads();
        }, 500);
      }
    }
  }, [handleSubmit, submitNewLead, reset, resetSubmitState, refetchLeads]);

  /**
   * Handler: Cerrar modal
   * 
   * Acciones:
   * - Cierra el modal
   * - Limpia el formulario (todos los fields)
   * - Limpia estados de envío (error, success, isSubmitting)
   * 
   * Permite descartar cambios sin afectar los datos (no actualiza leads)
   */
  const handleCloseModal = useCallback(() => {
    setIsNewLeadModalOpen(false);
    reset();
    resetSubmitState();
  }, [reset, resetSubmitState]);

  /**
   * ============================================================================
   * RENDER
   * ============================================================================
   * Estructura visual del dashboard organizda en secciones
   */

  return (
    <div className="gtr-dashboard">
      {/* ========================================================================
          SECCIÓN 1: ESTADÍSTICAS
          Muestra tarjetas con métricas de leads (total, nuevos, asignados, etc)
          Datos calculados por useStatistics basado en leads filtrados
          ======================================================================== */}
      <div className="statistics-grid">
        {statistics.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* ========================================================================
          SECCIÓN 2: ASESORES
          Muestra carga de trabajo de cada asesor con:
          - Avatar + nombre + estado (Disponible/Ocupado/Saturado)
          - Estadísticas: leads asignados y gestionados
          - Barra de progreso de capacidad utilizada
          
          Manejo de estado:
          - Loading: Spinner durante 1s
          - Error: Alert rojo (si falla al cargar leads)
          - Success: Grilla de tarjetas de asesores
          ======================================================================== */}
      <AdvisorsSection
        advisors={mockAdvisors}
        statusBgStyle={getStatusBadgeStyle}
        progressFillColor={getProgressFillColor}
        isLoading={leadsIsLoading}
        error={leadsError}
      />

      {/* ========================================================================
          SECCIÓN 3: LEADS CON FILTROS
          Tabla de leads con múltiples opciones de búsqueda y filtrado:
          - Búsqueda de texto: busca en nombre y teléfono (case-insensitive)
          - Filtro por Canal: Facebook, Instagram, WhatsApp
          - Filtro por Asesor: asignado a cada miembro del equipo
          - Filtro por Campaña: agrupa por nombre de campaña
          
          La tabla muestra campos: fecha, campaña, canal, lead, tipificación,
          asesor, seguimiento, reasignaciones, alias y acciones
          
          Manejo de estado:
          - Loading: Spinner con "Cargando leads..." durante 1s
          - Error: Alert rojo + botón "Reintentar" (dispara refetchLeads)
          - Success: Muestra filtros y tabla con leads aplicando filtros
          ======================================================================== */}
      <LeadsSection
        leads={mockLeads}
        filteredLeads={filteredLeads}
        columns={leadsTableColumns}
        filters={{
          searchTerm: '',
          selectedChannel: '',
          selectedAdvisor: '',
          selectedCampaign: ''
        }}
        onFilterChange={{
          onSearchChange: setSearchTerm,
          onChannelChange: setSelectedChannel,
          onAdvisorChange: setSelectedAdvisor,
          onCampaignChange: setSelectedCampaign,
        }}
        channels={channels}
        advisors={advisors}
        campaigns={campaigns}
        isLoading={leadsIsLoading}
        error={leadsError}
        onRetry={refetchLeads}
        onRegisterClick={() => setIsNewLeadModalOpen(true)}
      />

      {/* ========================================================================
          SECCIÓN 4: MODAL PARA CREAR NUEVO LEAD
          Modal flotante para registrar un nuevo lead con formulario de 5 campos:
          - País (POIS): Determina el formato de validación del teléfono
          - Teléfono (LEAD): Solo números, validado según país seleccionado
          - Campaña: Selección de lista de campañas disponibles
          - Canal: Selección entre Facebook, Instagram, WhatsApp
          - Base: Selección de lista
          
          Validación:
          - Al inicio: todos los campos están vacíos, botón deshabilitado
          - Al escribir: se marcan campos con errores en rojo
          - Antes de enviar: valida todo, muestra errores si falta algo
          
          Envío:
          - Se simula con delay de 1.5s usando useLeadSubmit
          - Durante envío: botón deshabilitado con spinner + "Creando..."
          - Si falla: muestra alert rojo con error del servidor
          - Si éxito: cierra modal, refrescar tabla, limpia formulario
          
          Control:
          - isOpen: booleano para mostrar/ocultar modal
          - onClose: cierra y limpia sin guardar
          - onSubmit: valida, envía y cierra si todo ok
          ======================================================================== */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        formData={formData}
        errors={errors}
        campaigns={campaigns}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onFormChange={handleChange}
        onSubmit={handleCreateNewLead}
        onClose={handleCloseModal}
      />
    </div>
  );
};
