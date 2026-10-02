package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.projection.LeadPreventaInstalacionProjection;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadPreventaInstalacionServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private LeadPreventaInstalacionProjection win;
    @Mock private LeadPreventaInstalacionProjection claro;
    @Mock private LeadPreventaInstalacionProjection pendiente;
    @Mock private LeadPreventaInstalacionProjection personalizada;

    private LeadPreventaInstalacionService service;

    @BeforeEach
    void setUp() {
        service = new LeadPreventaInstalacionService(leadRepository);
    }

    @Test
    void calculaSemanasOperativasPorProveedorYConservaPendientes() {
        configurar(win, 1L, "2026-10-03T05:00:00Z", LocalDate.of(2026, 10, 9), TipoReglaFacturacion.WIN);
        configurar(claro, 2L, "2026-10-02T05:00:00Z", LocalDate.of(2026, 10, 8), TipoReglaFacturacion.CLARO);
        configurar(pendiente, 3L, "2026-10-04T05:00:00Z", null, TipoReglaFacturacion.WIN);
        configurar(personalizada, 4L, "2026-10-04T05:00:00Z", LocalDate.of(2026, 10, 5), TipoReglaFacturacion.PERSONALIZADA);
        when(leadRepository.listarLeadsPreventaInstalacion(
                eq(Etapa.PREVENTA), any(), any(), any(), any(), any(), any(), any(), eq(false)))
                .thenReturn(List.of(win, claro, pendiente, personalizada));

        var response = service.listar(
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                null,
                null,
                null,
                false,
                null,
                null,
                PageRequest.builder().pageSize(100).sortBy("fechaPreventa").direction("asc").build()
        );

        assertThat(response.getDetalle().getContent())
                .extracting("cumpleMismaSemana")
                .containsExactly(true, true, null, null);
        assertThat(response.getDetalle().getContent())
                .extracting("estadoCumplimientoSemana")
                .extracting(Object::toString)
                .containsExactly("CUMPLE", "CUMPLE", "PENDIENTE_INSTALACION", "NO_EVALUABLE");
        assertThat(response.getTotales().getTotalPreventas()).isEqualTo(4);
        assertThat(response.getTotales().getPendientesInstalacion()).isEqualTo(1);
        assertThat(response.getTotales().getCumplenMismaSemana()).isEqualTo(2);
    }

    @Test
    void filtraCumplimientoSinEliminarLosPendientesDelUniversoGeneral() {
        configurar(win, 1L, "2026-10-03T05:00:00Z", LocalDate.of(2026, 10, 9), TipoReglaFacturacion.WIN);
        configurar(pendiente, 2L, "2026-10-04T05:00:00Z", null, TipoReglaFacturacion.WIN);
        when(leadRepository.listarLeadsPreventaInstalacion(
                eq(Etapa.PREVENTA), any(), any(), any(), any(), any(), any(), any(), eq(false)))
                .thenReturn(List.of(win, pendiente));

        var response = service.listar(
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                null,
                null,
                null,
                false,
                true,
                null,
                PageRequest.builder().pageSize(100).sortBy("fechaPreventa").direction("asc").build()
        );

        assertThat(response.getDetalle().getTotalElements()).isEqualTo(1);
        assertThat(response.getDetalle().getContent().getFirst().getCumpleMismaSemana()).isTrue();
    }

    private void configurar(
            LeadPreventaInstalacionProjection row,
            Long id,
            String fechaPreventa,
            LocalDate fechaInstalacion,
            TipoReglaFacturacion regla
    ) {
        when(row.getIdLead()).thenReturn(id);
        when(row.getFechaPreventa()).thenReturn(Instant.parse(fechaPreventa));
        when(row.getFechaInstalacion()).thenReturn(fechaInstalacion);
        when(row.getReglaSemanaProveedor()).thenReturn(regla);
        when(row.getEtapaActual()).thenReturn(Etapa.POSTVENTA);
        when(row.getProveedor()).thenReturn(regla.name());
    }
}
