package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
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

    @InjectMocks private LeadService leadService;

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
                leadService.listarAgrupacionesBandejaGtr(LocalDate.of(2026, 6, 10));

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
        when(paginationService.toPageableWithMapping(eq(request), any())).thenReturn(pageable);
        when(leadRepository.listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                anyBoolean(),
                anyCollection(),
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
                request
        );

        verify(leadRepository).listarBandejaGtr(
                eq(Etapa.PREVENTA),
                eq("%"),
                any(Instant.class),
                any(Instant.class),
                anyBoolean(),
                anyCollection(),
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
        when(paginationService.toPageableWithMapping(eq(request), any())).thenReturn(pageable);
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
                request
        )).hasMessage("Debes indicar el grupo seleccionado");
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
