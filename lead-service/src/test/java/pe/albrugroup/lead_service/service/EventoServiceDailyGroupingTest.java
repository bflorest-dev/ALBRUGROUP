package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventoServiceDailyGroupingTest {

    @Mock private EventoRepository eventoRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private CurrentUser currentUser;
    @Mock private EventoMapper eventoMapper;
    @Mock private PaginationService paginationService;

    @InjectMocks private EventoService eventoService;

    @Test
    void agrupaTodosLosRegistrosDelDiaOperativo() {
        Instant inicio = Instant.parse("2026-06-10T05:00:00Z");
        Instant fin = Instant.parse("2026-06-11T05:00:00Z");
        when(eventoRepository.agruparRegistrosDiariosPorAsesor(Accion.REGISTRO, inicio, fin, false, null))
                .thenReturn(List.of(
                        group(9L, "Asesor B", null, null, 2),
                        group(null, null, null, null, 1),
                        group(8L, "Asesor A", null, null, 4)
                ));
        when(eventoRepository.agruparRegistrosDiariosPorCampana(Accion.REGISTRO, inicio, fin, false, null))
                .thenReturn(List.of(group(null, null, null, null, 7)));
        when(eventoRepository.agruparRegistrosDiariosPorEquipo(Accion.REGISTRO, inicio, fin, false, null))
                .thenReturn(List.of());
        when(eventoRepository.agruparRegistrosDiariosPorPrimeraTipificacion(Accion.REGISTRO, inicio, fin, false, null))
                .thenReturn(List.of(
                        group(null, null, "CONTACTADO", "INTERESADO", 5),
                        group(null, null, null, null, 2)
                ));
        when(eventoRepository.agruparRegistrosDiariosPorUltimaTipificacion(Accion.REGISTRO, inicio, fin, false, null))
                .thenReturn(List.of(group(null, null, null, null, 7)));

        LeadGtrAgrupacionesResponse response =
                eventoService.listarAgrupacionesRegistrosDiarios(LocalDate.of(2026, 6, 10), null);

        assertThat(response.getAsesores())
                .extracting("etiqueta", "cantidad", "sinValor")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Asesor A", 4L, false),
                        org.assertj.core.groups.Tuple.tuple("Asesor B", 2L, false),
                        org.assertj.core.groups.Tuple.tuple("Sin asesor", 1L, true)
                );
        assertThat(response.getPrimerasTipificaciones())
                .extracting("etiqueta", "cantidad")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("CONTACTADO / INTERESADO", 5L),
                        org.assertj.core.groups.Tuple.tuple("Sin tipificar", 2L)
                );
    }

    @Test
    void filtraPorLaCombinacionCompletaDeUltimaTipificacion() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(paginationService.toPageableWithMapping(eq(request), any())).thenReturn(Pageable.unpaged());
        when(eventoRepository.listarRegistrosDiarios(
                eq(Accion.REGISTRO),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq(null),
                eq("CONTACTADO"),
                eq("INTERESADO"),
                eq(false),
                eq(null),
                eq(false),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        eventoService.listarRegistrosDiarios(
                LocalDate.of(2026, 6, 10),
                TipoGrupoGtr.ULTIMA_TIPIFICACION,
                null,
                "CONTACTADO",
                "INTERESADO",
                null,
                false,
                request
        );

        verify(eventoRepository).listarRegistrosDiarios(
                eq(Accion.REGISTRO),
                eq(Instant.parse("2026-06-10T05:00:00Z")),
                eq(Instant.parse("2026-06-11T05:00:00Z")),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(true),
                eq(null),
                eq("CONTACTADO"),
                eq("INTERESADO"),
                eq(false),
                eq(null),
                eq(false),
                any(Pageable.class)
        );
    }

    @Test
    void filtraPorLeadNormalizadoEnRegistrosDiarios() {
        PageRequest request = PageRequest.builder()
                .pageNumber(0)
                .pageSize(10)
                .build();
        when(paginationService.toPageableWithMapping(eq(request), any())).thenReturn(Pageable.unpaged());
        when(eventoRepository.listarRegistrosDiarios(
                eq(Accion.REGISTRO),
                any(Instant.class),
                any(Instant.class),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(null),
                eq(null),
                eq(null),
                eq(true),
                eq("987654321"),
                eq(false),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        eventoService.listarRegistrosDiarios(
                LocalDate.of(2026, 6, 10),
                null,
                null,
                null,
                null,
                " 987 654 321 ",
                false,
                request
        );

        verify(eventoRepository).listarRegistrosDiarios(
                eq(Accion.REGISTRO),
                eq(Instant.parse("2026-06-10T05:00:00Z")),
                eq(Instant.parse("2026-06-11T05:00:00Z")),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(false),
                eq(null),
                eq(null),
                eq(null),
                eq(true),
                eq("987654321"),
                eq(false),
                any(Pageable.class)
        );
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
