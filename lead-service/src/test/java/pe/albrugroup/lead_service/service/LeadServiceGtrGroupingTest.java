package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoVenta;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadInstaladoBackofficeResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.repository.ZonaReglaRepository;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceGtrGroupingTest {

    @Mock private LeadRepository leadRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;
    @Mock private PlanRepository planRepository;
    @Mock private PagoPostventaRepository pagoPostventaRepository;
    @Mock private EncuestaPostventaRepository encuestaPostventaRepository;
    @Mock private PromocionComercialRepository promocionComercialRepository;
    @Mock private AdicionalRepository adicionalRepository;
    @Mock private TipificacionRepository tipificacionRepository;
    @Mock private SubtipificacionRepository subtipificacionRepository;
    @Mock private LeadMapper leadMapper;
    @Mock private DistritoRepository distritoRepository;
    @Mock private ZonaReglaRepository zonaReglaRepository;
    @Mock private PaginationService paginationService;
    @Mock private org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;
    @Mock private LeadAsignacionCounterService leadAsignacionCounterService;
    @Mock private ProveedorScopeService proveedorScopeService;

    @InjectMocks private LeadService leadService;

    @Test
    void listaBandejaVentaUsaModoOperativoPorDefecto() {
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(true),
                anyCollection(),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarBandejaVenta(null, null, null, false, null, pageRequest);

        verify(leadRepository).listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(true),
                argThat(values -> values.size() == 3
                        && values.contains("PROGRAMADO")
                        && values.contains("SUBSANABLE")
                        && values.contains("NO RECUPERABLE")),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void listaBandejaVentaHistoricaNoExcluyeTipificacionesSeparadas() {
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(false),
                anyCollection(),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarBandejaVenta(
                null,
                null,
                null,
                false,
                null,
                pageRequest,
                ModoListadoVentaPlataforma.HISTORICO
        );

        verify(leadRepository).listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(false),
                argThat(values -> values.size() == 3
                        && values.contains("PROGRAMADO")
                        && values.contains("SUBSANABLE")
                        && values.contains("NO RECUPERABLE")),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void busquedaExplicitaVentaUsaHistoricoSinRangoOperativoNiGrupo() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("970329171%"),
                eq(false),
                eq("INGRESO"),
                eq(Instant.EPOCH),
                eq(Instant.parse("9999-12-31T00:00:00Z")),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(false),
                anyCollection(),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarBandejaVenta(
                "970329171",
                TipoGrupoVenta.TIPIFICACION,
                List.of("NUEVO"),
                false,
                null,
                desde,
                hasta,
                pageRequest
        );

        verify(leadRepository).listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("970329171%"),
                eq(false),
                eq("INGRESO"),
                eq(Instant.EPOCH),
                eq(Instant.parse("9999-12-31T00:00:00Z")),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(false),
                argThat(values -> values.size() == 3
                        && values.contains("PROGRAMADO")
                        && values.contains("SUBSANABLE")
                        && values.contains("NO RECUPERABLE")),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void agrupacionesVentaUsanModoOperativoPorDefecto() {
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.agruparVentaPorEstado(
                eq(Etapa.VENTA), eq("%"), eq(false), any(Instant.class), any(Instant.class), eq(false), eq(null),
                eq(true), anyCollection(), eq(false), anyCollection()))
                .thenReturn(List.of());
        when(leadRepository.agruparVentaPorProveedor(
                eq(Etapa.VENTA), eq("%"), eq(false), any(Instant.class), any(Instant.class), eq(false), eq(null),
                eq(true), anyCollection(), eq(false), anyCollection()))
                .thenReturn(List.of());
        when(leadRepository.agruparVentaPorPlan(
                eq(Etapa.VENTA), eq("%"), eq(false), any(Instant.class), any(Instant.class), eq(false), eq(null),
                eq(true), anyCollection(), eq(false), anyCollection()))
                .thenReturn(List.of());
        when(leadRepository.agruparVentaPorUltimoGestor(
                eq(Etapa.VENTA), eq("%"), eq(false), any(Instant.class), any(Instant.class), eq(false), eq(null),
                eq(true), anyCollection(), eq(false), anyCollection()))
                .thenReturn(List.of());
        when(leadRepository.agruparVentaPorTipificacion(
                eq(Etapa.VENTA), eq("%"), eq(false), any(Instant.class), any(Instant.class), eq(false), eq(null),
                eq(true), anyCollection(), eq(false), anyCollection()))
                .thenReturn(List.of());

        leadService.listarAgrupacionesBandejaVenta(null, null);

        verify(leadRepository).agruparVentaPorTipificacion(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(null),
                eq(true),
                argThat(values -> values.size() == 3
                        && values.contains("PROGRAMADO")
                        && values.contains("SUBSANABLE")
                        && values.contains("NO RECUPERABLE")),
                eq(false),
                eq(List.of(-1L))
        );
    }

    @Test
    void listaBandejaVentaUsaRangoFechasSolicitado() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                eq(OperationalDateTime.startOfDay(desde)),
                eq(OperationalDateTime.endExclusiveOfDay(hasta)),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(true),
                anyCollection(),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarBandejaVenta(null, null, null, false, null, desde, hasta, pageRequest);

        verify(leadRepository).listarBandejaVenta(
                eq(Etapa.VENTA),
                eq("%"),
                eq(false),
                eq("INGRESO"),
                eq(OperationalDateTime.startOfDay(desde)),
                eq(OperationalDateTime.endExclusiveOfDay(hasta)),
                eq(false),
                eq(""),
                anyCollection(),
                eq(false),
                eq(Accion.TIPIFICACION),
                eq("PROGRAMADO"),
                anyCollection(),
                eq(Etapa.PREVENTA),
                eq(true),
                anyCollection(),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaIngresoEtapa"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void rechazaRangoInvalidoEnBandejaVenta() {
        PageRequest pageRequest = PageRequest.builder().build();

        assertThatThrownBy(() -> leadService.listarBandejaVenta(
                null,
                null,
                null,
                false,
                null,
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 8, 1),
                pageRequest
        )).hasMessageContaining("fecha de inicio");
    }

    @Test
    void listaProgramadosVentaUsaRangoFechasSolicitado() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsProgramadosVentaAsignados(
                eq(Etapa.VENTA),
                eq("PROGRAMADO"),
                eq("PROGRAMACION_CANCELADA"),
                eq(Accion.TIPIFICACION),
                eq(Etapa.PREVENTA),
                eq("PROGRAMACION"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaProgramacion"),
                eq(false),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarLeadsVentaProgramadosAsignados(pageRequest, null, desde, hasta);

        verify(leadRepository).listarLeadsProgramadosVentaAsignados(
                eq(Etapa.VENTA),
                eq("PROGRAMADO"),
                eq("PROGRAMACION_CANCELADA"),
                eq(Accion.TIPIFICACION),
                eq(Etapa.PREVENTA),
                eq("PROGRAMACION"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaProgramacion"),
                eq(false),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void listaProgramadosVentaUsaProximosTreintaDiasPorDefecto() {
        LocalDate hoy = OperationalDateTime.today();
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsProgramadosVentaAsignados(
                eq(Etapa.VENTA),
                eq("PROGRAMADO"),
                eq("PROGRAMACION_CANCELADA"),
                eq(Accion.TIPIFICACION),
                eq(Etapa.PREVENTA),
                eq("PROGRAMACION"),
                eq(hoy),
                eq(hoy.plusDays(30)),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaProgramacion"),
                eq(false),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarLeadsVentaProgramadosAsignados(pageRequest, null);

        verify(leadRepository).listarLeadsProgramadosVentaAsignados(
                eq(Etapa.VENTA),
                eq("PROGRAMADO"),
                eq("PROGRAMACION_CANCELADA"),
                eq(Accion.TIPIFICACION),
                eq(Etapa.PREVENTA),
                eq("PROGRAMACION"),
                eq(hoy),
                eq(hoy.plusDays(30)),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaProgramacion"),
                eq(false),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void listaRechazadosVentaConEventosDeVentaYEtapasActualesPermitidas() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("fechaRechazo")
                .direction("desc")
                .build();
        LeadResponse row = LeadResponse.builder()
                .id(10L)
                .codigoTipificacion("NO RECUPERABLE")
                .fechaRechazo(hasta)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                anyCollection(),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                anyCollection(),
                eq(false),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(row)));

        var response = leadService.listarLeadsVentaRechazados(desde, hasta, pageRequest, null);

        assertThat(response.getContent())
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.getCodigoTipificacion()).isEqualTo("NO RECUPERABLE");
                    assertThat(item.getFechaRechazo()).isEqualTo(hasta);
                });
        verify(leadRepository).listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                argThat(values -> values.size() == 1 && values.contains("NO RECUPERABLE")),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(List.of(Etapa.VENTA, Etapa.PREVENTA)),
                eq(false),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void listaSubsanablesVentaConLeadActualSubsanableYEventoDeVenta() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("fechaRechazo")
                .direction("desc")
                .build();
        LeadResponse row = LeadResponse.builder()
                .id(11L)
                .codigoTipificacion("SUBSANABLE")
                .fechaRechazo(hasta)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                anyCollection(),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                anyCollection(),
                eq(true),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(row)));

        var response = leadService.listarLeadsVentaSubsanables(desde, hasta, pageRequest, null);

        assertThat(response.getContent())
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.getCodigoTipificacion()).isEqualTo("SUBSANABLE");
                    assertThat(item.getFechaRechazo()).isEqualTo(hasta);
                });
        verify(leadRepository).listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                argThat(values -> values.size() == 1 && values.contains("SUBSANABLE")),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(List.of(Etapa.VENTA)),
                eq(true),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void rechazaRangoInvalidoEnBandejaRechazadosVenta() {
        PageRequest pageRequest = PageRequest.builder()
                .sortBy("fechaRechazo")
                .direction("desc")
                .build();

        assertThatThrownBy(() -> leadService.listarLeadsVentaRechazados(
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 8, 1),
                pageRequest,
                null
        )).hasMessageContaining("fecha de inicio");
    }

    @Test
    void listaRechazadosVentaUsaFechaRechazoDescComoOrdenPorDefecto() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                anyCollection(),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                anyCollection(),
                eq(false),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        leadService.listarLeadsVentaRechazados(desde, hasta, pageRequest, null);

        verify(leadRepository).listarLeadsVentaRechazados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                anyCollection(),
                eq("RECHAZO"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(List.of(Etapa.VENTA, Etapa.PREVENTA)),
                eq(false),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaRechazo"),
                eq(true),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(EstadoSeguimiento.class),
                any(Pageable.class)
        );
    }

    @Test
    void listaInstaladosVentaConEventoInstaladoYEstadoPostventa() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 24);
        PageRequest pageRequest = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("fechaInstalacion")
                .direction("desc")
                .build();
        LeadInstaladoBackofficeResponse row = LeadInstaladoBackofficeResponse.builder()
                .idLead(12L)
                .lead("970329171")
                .fechaInstalacion(hasta)
                .fechaTipificacionInstalado(Instant.parse("2026-08-24T15:00:00Z"))
                .idAsesorInstalador(90L)
                .nombreAsesorInstalador("Backoffice Uno")
                .estadoClientePostventa(EstadoClientePostventa.SUSPENDIDO)
                .etapaActual(Etapa.POSTVENTA)
                .build();
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(leadRepository.listarLeadsVentaInstalados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                eq("INSTALADO"),
                eq("INSTALACION"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                anyCollection(),
                eq(false),
                anyCollection(),
                eq("SIN_AGRUPAR"),
                eq("fechaInstalacion"),
                eq(true),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(row)));

        var response = leadService.listarLeadsVentaInstalados(desde, hasta, pageRequest, null);

        assertThat(response.getContent())
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.getFechaInstalacion()).isEqualTo(hasta);
                    assertThat(item.getIdAsesorInstalador()).isEqualTo(90L);
                    assertThat(item.getNombreAsesorInstalador()).isEqualTo("Backoffice Uno");
                    assertThat(item.getEstadoClientePostventa()).isEqualTo(EstadoClientePostventa.SUSPENDIDO);
                });
        verify(leadRepository).listarLeadsVentaInstalados(
                eq(Accion.TIPIFICACION),
                eq(Etapa.VENTA),
                eq(Etapa.PREVENTA),
                eq("INSTALADO"),
                eq("INSTALACION"),
                eq(desde),
                eq(hasta),
                any(Instant.class),
                any(Instant.class),
                eq(List.of(Etapa.POSTVENTA, Etapa.COBRANZA)),
                eq(false),
                eq(List.of(-1L)),
                eq("SIN_AGRUPAR"),
                eq("fechaInstalacion"),
                eq(true),
                any(Pageable.class)
        );
    }

    @Test
    void rechazaRangoInvalidoEnBandejaInstaladosVenta() {
        PageRequest pageRequest = PageRequest.builder()
                .sortBy("fechaInstalacion")
                .direction("desc")
                .build();

        assertThatThrownBy(() -> leadService.listarLeadsVentaInstalados(
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 8, 1),
                pageRequest,
                null
        )).hasMessageContaining("fecha de inicio");
    }

    @Test
    void listaConteosGlobalesOrdenadosEIncluyeValoresPendientes() {
        when(leadRepository.agruparBandejaGtrPorAsesor(
                eq(Etapa.PREVENTA), any(Instant.class), any(Instant.class), anyBoolean(), anyCollection()))
                .thenReturn(List.of(
                        group(8L, "Asesor B", null, null, 2),
                        group(null, null, null, null, 3),
                        group(7L, "Asesor A", null, null, 5)
                ));
        when(leadRepository.agruparBandejaGtrPorCampana(
                eq(Etapa.PREVENTA), any(Instant.class), any(Instant.class), anyBoolean(), anyCollection()))
                .thenReturn(List.of(group(null, null, null, null, 10)));
        when(leadRepository.agruparBandejaGtrPorEstado(
                eq(Etapa.PREVENTA), any(Instant.class), any(Instant.class), anyBoolean(), anyCollection()))
                .thenReturn(List.of(
                        group(null, "NUEVO", null, null, 7),
                        group(null, "ASIGNADO", null, null, 3),
                        group(null, null, null, null, 2)
                ));
        when(leadRepository.agruparBandejaGtrPorPrimeraTipificacion(
                eq(Etapa.PREVENTA), any(Instant.class), any(Instant.class), anyBoolean(), anyCollection()))
                .thenReturn(List.of(
                        group(null, null, "CONTACTADO", "INTERESADO", 6),
                        group(null, null, null, null, 4)
                ));
        when(leadRepository.agruparBandejaGtrPorUltimaTipificacion(
                eq(Etapa.PREVENTA), any(Instant.class), any(Instant.class), anyBoolean(), anyCollection()))
                .thenReturn(List.of(group(null, null, null, "DATO_INCONSISTENTE", 10)));

        LeadGtrAgrupacionesResponse response =
                leadService.listarAgrupacionesBandejaGtr(LocalDate.of(2026, 6, 10), null);

        assertThat(response.getAsesores())
                .extracting("etiqueta", "cantidad", "sinValor")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Asesor A", 5L, false),
                        org.assertj.core.groups.Tuple.tuple("Sin asignar", 3L, true),
                        org.assertj.core.groups.Tuple.tuple("Asesor B", 2L, false)
                );
        assertThat(response.getPrimerasTipificaciones())
                .extracting("etiqueta", "cantidad")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("CONTACTADO / INTERESADO", 6L),
                        org.assertj.core.groups.Tuple.tuple("Sin tipificar", 4L)
                );
        assertThat(response.getEstados())
                .extracting("etiqueta", "cantidad", "sinValor")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("NUEVO", 7L, false),
                        org.assertj.core.groups.Tuple.tuple("ASIGNADO", 3L, false)
                );
        assertThat(response.getUltimasTipificaciones())
                .singleElement()
                .satisfies(group -> {
                    assertThat(group.getEtiqueta()).isEqualTo("Sin tipificar");
                    assertThat(group.getCantidad()).isEqualTo(10);
                    assertThat(group.isSinValor()).isTrue();
                });
    }

    @Test
    void usaLaConsultaOriginalCuandoPlataformaNoTieneAgrupacion() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("lastEntryAt")
                .direction("desc")
                .build();
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 12);
        when(leadRepository.listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                null,
                request
        );

        verify(leadRepository).listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        );
    }

    @Test
    void busquedaGtrPorLeadRespetaEquipoSolicitado() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("lastEntryAt")
                .direction("desc")
                .build();
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 12);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(10L));
        when(leadRepository.listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("987654321%"),
                any(Instant.class),
                any(Instant.class),
                eq(true),
                eq(List.of(10L)),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                "987654321",
                null,
                null,
                null,
                null,
                null,
                false,
                10L,
                request
        );

        verify(leadRepository).listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("987654321%"),
                any(Instant.class),
                any(Instant.class),
                eq(true),
                eq(List.of(10L)),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        );
    }

    @Test
    void aplicaLaCombinacionCompletaDePrimeraTipificacionAlListadoPaginado() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("lastEntryAt")
                .direction("desc")
                .build();
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 12);
        when(leadRepository.listarBandejaGtrFiltrada(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq(false),
                eq(false),
                eq((Long) null),
                eq((EstadoSeguimiento) null),
                eq("CONTACTADO"),
                eq("INTERESADO"),
                eq(false),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                null,
                TipoGrupoGtr.PRIMERA_TIPIFICACION,
                null,
                null,
                "CONTACTADO",
                "INTERESADO",
                false,
                null,
                request
        );

        verify(leadRepository).listarBandejaGtrFiltrada(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq(false),
                eq(false),
                eq((Long) null),
                eq((EstadoSeguimiento) null),
                eq("CONTACTADO"),
                eq("INTERESADO"),
                eq(false),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        );
    }

    @Test
    void permiteFiltrarPlataformaPorTipificacionSinSubtipificacion() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(12)
                .sortBy("lastEntryAt")
                .direction("desc")
                .build();
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 12);
        when(leadRepository.listarBandejaGtrFiltrada(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq((Long) null),
                eq((EstadoSeguimiento) null),
                eq("CONTACTADO"),
                eq((String) null),
                eq(false),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                null,
                TipoGrupoGtr.MAYOR_TIPIFICACION,
                null,
                null,
                "CONTACTADO",
                null,
                false,
                null,
                request
        );

        verify(leadRepository).listarBandejaGtrFiltrada(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq((Long) null),
                eq((EstadoSeguimiento) null),
                eq("CONTACTADO"),
                eq((String) null),
                eq(false),
                anyBoolean(),
                anyCollection(),
                eq("lastEntryAt"),
                eq(true),
                eq(EstadoSeguimiento.NUEVO),
                eq(EstadoSeguimiento.EN_GESTION),
                eq(EstadoSeguimiento.ASIGNADO),
                eq(EstadoSeguimiento.GESTIONADO),
                eq(pageable)
        );
    }

    @Test
    void exigeIdentificadorAlFiltrarPorAsesor() {
        PageRequest request = PageRequest.builder().build();

        assertThatThrownBy(() -> leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                null,
                TipoGrupoGtr.ASESOR,
                null,
                null,
                null,
                null,
                false,
                null,
                request
        )).hasMessage("Debes indicar el grupo seleccionado");
    }

    @Test
    void rechazaOrdenamientoNoPermitidoEnBandejaDiaria() {
        PageRequest request = PageRequest.builder()
                .sortBy("lead")
                .direction("asc")
                .build();

        assertThatThrownBy(() -> leadService.listarBandejaGtr(
                LocalDate.of(2026, 6, 10),
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                null,
                request
        )).hasMessage("Campo de ordenamiento no permitido: lead");
    }

    private LeadGtrAgrupacionProjection group(
            Long idGrupo,
            String etiqueta,
            String tipificacion,
            String subtipificacion,
            long cantidad
    ) {
        return new LeadGtrAgrupacionProjection() {
            public Long getIdGrupo() { return idGrupo; }
            public String getEtiqueta() { return etiqueta; }
            public String getCodigoTipificacion() { return tipificacion; }
            public String getCodigoSubtipificacion() { return subtipificacion; }
            public long getCantidad() { return cantidad; }
        };
    }
}
