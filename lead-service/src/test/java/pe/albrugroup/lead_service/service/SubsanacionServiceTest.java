package pe.albrugroup.lead_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.*;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.SubsanacionRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.repository.*;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubsanacionServiceTest {

    @Mock LeadRepository leadRepository;
    @Mock ContactoRepository contactoRepository;
    @Mock CampanaRepository campanaRepository;
    @Mock PlanRepository planRepository;
    @Mock EquipoProveedorRepository equipoProveedorRepository;
    @Mock TipificacionRepository tipificacionRepository;
    @Mock SubtipificacionRepository subtipificacionRepository;
    @Mock EventoRepository eventoRepository;
    @Mock LeadEtapaResumenRepository resumenRepository;
    @Mock CalendarioFacturacionPostventaRepository calendarioRepository;
    @Mock PeriodoFacturacionPostventaRepository periodoRepository;
    @Mock PagoPostventaRepository pagoRepository;
    @Mock EncuestaPostventaRepository encuestaRepository;
    @Mock EntregaCredencialPlataformaRepository entregaRepository;
    @Mock EntregaCredencialDispositivoRepository dispositivoRepository;
    @Mock SubsanacionAuditoriaRepository auditoriaRepository;
    @Mock CalendarioFacturacionPostventaService calendarioService;
    @Mock LeadService leadService;
    @Mock LeadMapper leadMapper;
    @Mock LeadRealtimeNotifier realtimeNotifier;
    @Mock CurrentUser currentUser;
    @Mock ObjectMapper objectMapper;

    private SubsanacionService service;
    private SubsanacionRequest request;

    @BeforeEach
    void setUp() throws Exception {
        service = new SubsanacionService(
                leadRepository, contactoRepository, campanaRepository, planRepository,
                equipoProveedorRepository, tipificacionRepository, subtipificacionRepository,
                eventoRepository, resumenRepository, calendarioRepository, periodoRepository,
                pagoRepository, encuestaRepository, entregaRepository, dispositivoRepository,
                auditoriaRepository, calendarioService, leadService, leadMapper, realtimeNotifier,
                currentUser, objectMapper);
        request = requestValido();
        when(auditoriaRepository.findByRequestId(any())).thenReturn(Optional.empty());
        lenient().when(currentUser.empleadoID()).thenReturn(99L);
        lenient().when(currentUser.nombreCompleto()).thenReturn("Admin Prueba");
        lenient().when(currentUser.rolPrincipal()).thenReturn("ADMINISTRADOR");
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
    }

    @Test
    void nuevoCreaCincoEventosYTresResumenesCanonicos() {
        Proveedor proveedor = Proveedor.builder()
                .id(1L).nombre("Proveedor").activo(true).mesesPermanencia(3).requiereSecSotVenta(false)
                .build();
        Campana campana = Campana.builder().id(2L).nombre("Campana").proveedor(proveedor).activo(false).build();
        Plan plan = Plan.builder().id(3L).nombre("Plan historico").proveedor(proveedor)
                .precio(BigDecimal.valueOf(79.90)).activo(false).build();
        Tipificacion tipiPreventa = tipificacion(10L, Etapa.PREVENTA, "PREVENTA", 4, false);
        Subtipificacion subPreventa = subtipificacion(11L, tipiPreventa, "COMPLETA", Etapa.VENTA,
                ComportamientoTipificacion.ES_CIERRE_PREVENTA);
        Tipificacion tipiVenta = tipificacion(20L, Etapa.VENTA, "INSTALADO", 5, false);
        Subtipificacion subVenta = subtipificacion(21L, tipiVenta, "SERVICIO_INSTALADO", Etapa.POSTVENTA,
                ComportamientoTipificacion.REQUIERE_FECHA_INSTALACION);

        when(campanaRepository.findByIdForSubsanacion(2L)).thenReturn(Optional.of(campana));
        when(planRepository.findById(3L)).thenReturn(Optional.of(plan));
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(7L, 1L)).thenReturn(true);
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigo(Etapa.PREVENTA, 7L, "PREVENTA"))
                .thenReturn(Optional.of(tipiPreventa));
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigo(Etapa.VENTA, 7L, "INSTALADO"))
                .thenReturn(Optional.of(tipiVenta));
        when(subtipificacionRepository.findByTipificacionIdAndCodigo(10L, "COMPLETA"))
                .thenReturn(Optional.of(subPreventa));
        when(subtipificacionRepository.findByTipificacionIdAndCodigo(20L, "SERVICIO_INSTALADO"))
                .thenReturn(Optional.of(subVenta));
        when(contactoRepository.findByPrefijoAndLead("+51", "999888777")).thenReturn(Optional.empty());
        when(contactoRepository.save(any())).thenAnswer(invocation -> {
            Contacto contacto = invocation.getArgument(0);
            contacto.setId(100L);
            return contacto;
        });
        when(leadRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            Lead lead = invocation.getArgument(0);
            lead.setId(200L);
            return lead;
        });
        when(auditoriaRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            SubsanacionAuditoria auditoria = invocation.getArgument(0);
            auditoria.setId(300L);
            auditoria.setEjecutadoAt(Instant.parse("2026-09-06T20:00:00Z"));
            return auditoria;
        });
        when(auditoriaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(entregaRepository.findByLeadIdOrderByCreatedAtDesc(200L)).thenReturn(List.of());
        when(eventoRepository.findAllByIdLeadOrderByCreatedAtAscIdAsc(200L)).thenReturn(List.of());
        when(resumenRepository.findByIdLead(200L)).thenReturn(List.of());
        when(periodoRepository.findByLeadIdOrderByNumeroPeriodoAsc(200L)).thenReturn(List.of());
        when(pagoRepository.findAllByLeadId(200L)).thenReturn(List.of());
        when(encuestaRepository.findByLeadId(200L)).thenReturn(List.of());
        CalendarioFacturacionPostventa calendario = CalendarioFacturacionPostventa.builder().id(400L).diaCorte(15).build();
        when(calendarioRepository.findByLeadId(200L)).thenReturn(Optional.of(calendario));

        var response = service.subsanar(request);

        assertEquals(Etapa.POSTVENTA, response.getEtapaFinal());
        assertEquals(99L, response.getIdAdmin());
        assertEquals("Admin Prueba", response.getNombreAdmin());
        assertEquals(5, response.getLineaTiempo().size());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<Evento>> eventosCaptor = ArgumentCaptor.forClass(Iterable.class);
        verify(eventoRepository).saveAll(eventosCaptor.capture());
        List<Evento> eventos = toList(eventosCaptor.getValue());
        assertEquals(List.of(Accion.SUBSANACION, Accion.REGISTRO, Accion.ASIGNACION,
                        Accion.TIPIFICACION, Accion.TIPIFICACION),
                eventos.stream().map(Evento::getAccion).toList());
        assertEquals(List.of(Etapa.PREVENTA, Etapa.PREVENTA, Etapa.PREVENTA, Etapa.PREVENTA, Etapa.VENTA),
                eventos.stream().map(Evento::getEtapa).toList());
        assertTrue(eventos.stream().allMatch(e -> e.getIdActor().equals(99L)));
        assertEquals(99L, eventos.get(2).getIdAsesorAsignado());
        assertEquals(request.getFechaInstalacion(), eventos.get(4).getFechaInstalacion());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<LeadEtapaResumen>> resumenCaptor = ArgumentCaptor.forClass(Iterable.class);
        verify(resumenRepository).saveAll(resumenCaptor.capture());
        List<LeadEtapaResumen> resumenes = toList(resumenCaptor.getValue());
        assertEquals(List.of(Etapa.PREVENTA, Etapa.VENTA, Etapa.POSTVENTA),
                resumenes.stream().map(LeadEtapaResumen::getEtapa).toList());
        assertEquals(1, resumenes.get(0).getTotalTipificaciones());
        assertEquals(1, resumenes.get(1).getTotalTipificaciones());
        assertNull(resumenes.get(2).getUltimaCodigoTipificacion());
        assertNull(resumenes.get(2).getFechaSalidaEtapa());
        assertEquals(99L, resumenes.get(0).getIdAsesorMerito());
        assertEquals(99L, resumenes.get(1).getIdAsesorMerito());
    }

    @Test
    void requestIdRepetidoDevuelveMismaAuditoriaSinVolverAEscribir() {
        SubsanacionAuditoria auditoria = SubsanacionAuditoria.builder()
                .id(8L).requestId(request.getRequestId()).idLead(9L).modo(ModoSubsanacion.NUEVO)
                .fechaGestion(request.getFechaGestion()).fechaInstalacion(request.getFechaInstalacion())
                .motivo("ya ejecutada").eventosReemplazados(0).resumenesReemplazados(0)
                .artefactosPostventaReemplazados(0).oportunidadesHermanasAfectadas(0)
                .build();
        when(auditoriaRepository.findByRequestId(request.getRequestId())).thenReturn(Optional.of(auditoria));

        var response = service.subsanar(request);

        assertEquals(8L, response.getIdSubsanacion());
        assertEquals(9L, response.getIdLead());
        verifyNoInteractions(campanaRepository, planRepository, eventoRepository, resumenRepository);
    }

    @Test
    void fechaGestionDeHoyEsRechazadaAntesDeCrearElLead() {
        request.setFechaGestion(OperationalDateTime.today());
        request.setFechaInstalacion(OperationalDateTime.today());

        assertThrows(BadRequestException.class, () -> service.subsanar(request));
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    void rechazaCampanaYPlanDeProveedoresDistintosAunqueAmbosPertenezcanAlEquipo() {
        Proveedor proveedorCampana = Proveedor.builder().id(1L).nombre("Proveedor A").build();
        Proveedor proveedorPlan = Proveedor.builder().id(2L).nombre("Proveedor B").build();
        Campana campana = Campana.builder().id(2L).proveedor(proveedorCampana).build();
        Plan plan = Plan.builder().id(3L).proveedor(proveedorPlan).build();

        when(campanaRepository.findByIdForSubsanacion(2L)).thenReturn(Optional.of(campana));
        when(planRepository.findById(3L)).thenReturn(Optional.of(plan));
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(7L, 1L)).thenReturn(true);
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(7L, 2L)).thenReturn(true);

        ConflictException error = assertThrows(ConflictException.class, () -> service.subsanar(request));

        assertTrue(error.getMessage().contains("mismo proveedor"));
        verifyNoInteractions(tipificacionRepository, subtipificacionRepository);
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    void rechazaPlanFueraDeVigenciaParaLaFechaHistoricaElegida() {
        Proveedor proveedor = Proveedor.builder().id(1L).nombre("Proveedor").build();
        Campana campana = Campana.builder().id(2L).proveedor(proveedor).build();
        Plan plan = Plan.builder()
                .id(3L)
                .proveedor(proveedor)
                .vigenciaDesde(request.getFechaGestion().minusMonths(2))
                .vigenciaHasta(request.getFechaGestion().minusDays(1))
                .build();

        when(campanaRepository.findByIdForSubsanacion(2L)).thenReturn(Optional.of(campana));
        when(planRepository.findById(3L)).thenReturn(Optional.of(plan));
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(7L, 1L)).thenReturn(true);

        ConflictException error = assertThrows(ConflictException.class, () -> service.subsanar(request));

        assertTrue(error.getMessage().contains("vigente"));
        verifyNoInteractions(tipificacionRepository, subtipificacionRepository);
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    void leadExistenteEnPostventaExigeConfirmacionAntesDeEliminarInformacion() {
        request.setModo(ModoSubsanacion.EXISTENTE);
        request.setIdLead(42L);
        request.setConfirmarRecreacionPostventa(false);

        Proveedor proveedor = Proveedor.builder().id(1L).nombre("Proveedor").requiereSecSotVenta(false).build();
        Campana campana = Campana.builder().id(2L).proveedor(proveedor).build();
        Plan plan = Plan.builder().id(3L).proveedor(proveedor).build();
        Tipificacion tipiPreventa = tipificacion(10L, Etapa.PREVENTA, "PREVENTA", 4, true);
        Subtipificacion subPreventa = subtipificacion(11L, tipiPreventa, "COMPLETA", Etapa.VENTA,
                ComportamientoTipificacion.ES_CIERRE_PREVENTA);
        Tipificacion tipiVenta = tipificacion(20L, Etapa.VENTA, "INSTALADO", 5, true);
        Subtipificacion subVenta = subtipificacion(21L, tipiVenta, "SERVICIO_INSTALADO", Etapa.POSTVENTA,
                ComportamientoTipificacion.REQUIERE_FECHA_INSTALACION);
        when(campanaRepository.findByIdForSubsanacion(2L)).thenReturn(Optional.of(campana));
        when(planRepository.findById(3L)).thenReturn(Optional.of(plan));
        when(equipoProveedorRepository.existsByIdEquipoAndProveedorId(7L, 1L)).thenReturn(true);
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigo(Etapa.PREVENTA, 7L, "PREVENTA"))
                .thenReturn(Optional.of(tipiPreventa));
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigo(Etapa.VENTA, 7L, "INSTALADO"))
                .thenReturn(Optional.of(tipiVenta));
        when(subtipificacionRepository.findByTipificacionIdAndCodigo(10L, "COMPLETA"))
                .thenReturn(Optional.of(subPreventa));
        when(subtipificacionRepository.findByTipificacionIdAndCodigo(20L, "SERVICIO_INSTALADO"))
                .thenReturn(Optional.of(subVenta));

        Lead existente = new Lead();
        existente.setId(42L);
        existente.setEtapa(Etapa.POSTVENTA);
        existente.setContacto(Contacto.builder().id(5L).prefijo("+51").lead("999888777").build());
        when(leadRepository.findByIdForSubsanacion(42L)).thenReturn(Optional.of(existente));
        when(entregaRepository.findByLeadIdOrderByCreatedAtDesc(42L)).thenReturn(List.of());
        when(calendarioRepository.countByLeadId(42L)).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.subsanar(request));
        verify(eventoRepository, never()).deleteByIdLead(anyLong());
        verify(calendarioRepository, never()).deleteByLeadId(anyLong());
    }

    private SubsanacionRequest requestValido() {
        SubsanacionRequest value = new SubsanacionRequest();
        value.setRequestId(UUID.randomUUID());
        value.setModo(ModoSubsanacion.NUEVO);
        value.setPrefijo("+51");
        value.setLead("999888777");
        value.setIdEquipo(7L);
        value.setIdCampana(2L);
        value.setIdPlan(3L);
        value.setBase(Base.WHATSAPP);
        value.setDatosPreventa(new LeadDatosPreventaRequest());
        value.setDireccion(new LeadDireccionRequest());
        value.setCodigoTipificacionPreventa("PREVENTA");
        value.setCodigoSubtipificacionPreventa("COMPLETA");
        value.setCodigoTipificacionVenta("INSTALADO");
        value.setCodigoSubtipificacionVenta("SERVICIO_INSTALADO");
        value.setFechaGestion(OperationalDateTime.today().minusDays(10));
        value.setFechaInstalacion(OperationalDateTime.today().minusDays(8));
        value.setMotivo("Lead omitido en la gestion original");
        return value;
    }

    private Tipificacion tipificacion(Long id, Etapa etapa, String codigo, int orden, boolean activo) {
        Tipificacion t = new Tipificacion();
        t.setId(id);
        t.setEtapa(etapa);
        t.setIdEquipo(7L);
        t.setCodigo(codigo);
        t.setOrden(orden);
        t.setActivo(activo);
        return t;
    }

    private Subtipificacion subtipificacion(
            Long id, Tipificacion tipificacion, String codigo, Etapa destino,
            ComportamientoTipificacion comportamiento
    ) {
        Subtipificacion s = new Subtipificacion();
        s.setId(id);
        s.setTipificacion(tipificacion);
        s.setCodigo(codigo);
        s.setEtapaCambio(destino);
        s.setComportamientos(new HashSet<>(Set.of(comportamiento)));
        s.setActivo(false);
        return s;
    }

    private static <T> List<T> toList(Iterable<T> iterable) {
        List<T> result = new ArrayList<>();
        iterable.forEach(result::add);
        return result;
    }
}
