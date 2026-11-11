package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import pe.albrugroup.lead_service.entity.response.ComisionVentaDetalleResponse;
import pe.albrugroup.lead_service.repository.ComisionVentaRepository;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaDetalleCountProjection;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaDetalleProjection;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ComisionVentaServiceTest {

    private ComisionVentaRepository repository;
    private ComisionVentaService service;

    @BeforeEach
    void setUp() {
        repository = mock(ComisionVentaRepository.class);
        service = new ComisionVentaService(repository);
    }

    @Test
    void detalleConservaConteosYMapeaEvidenciaDePago() {
        ComisionVentaDetalleProjection row = mock(ComisionVentaDetalleProjection.class);
        when(row.getIdLead()).thenReturn(33524L);
        when(row.getNumeroLead()).thenReturn("987654321");
        when(row.getNombreCliente()).thenReturn("Cliente de prueba");
        when(row.getEstadoValidacion()).thenReturn("NO_VALIDA");
        when(row.getMotivo()).thenReturn("No válido: sin pago registrado");

        ComisionVentaDetalleCountProjection counts = mock(ComisionVentaDetalleCountProjection.class);
        when(counts.getTotalLeads()).thenReturn(18L);
        when(counts.getTotalValidas()).thenReturn(15L);
        when(counts.getTotalNoValidas()).thenReturn(3L);

        PageRequest pageable = PageRequest.of(0, 12);
        when(repository.detalleVentasPorCorte(
                eq("CLARO"), eq(LocalDate.of(2026, 9, 1)), eq(1), eq(900042L),
                eq(null), eq("TODOS"), eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(row), pageable, 18));
        when(repository.contarDetalleVentasPorCorte(
                eq("CLARO"), eq(LocalDate.of(2026, 9, 1)), eq(1), eq(900042L), eq(null)
        )).thenReturn(counts);

        ComisionVentaDetalleResponse response = service.listarDetalleVentasPorCorte(
                LocalDate.of(2026, 9, 1), 1, "claro", 900042L, null, "todos", 0, 12);

        assertThat(response.totalLeads()).isEqualTo(18);
        assertThat(response.totalValidas()).isEqualTo(15);
        assertThat(response.totalNoValidas()).isEqualTo(3);
        assertThat(response.content()).singleElement().satisfies(item -> {
            assertThat(item.idLead()).isEqualTo(33524L);
            assertThat(item.motivo()).isEqualTo("No válido: sin pago registrado");
            assertThat(item.estadoValidacion()).isEqualTo("NO_VALIDA");
        });
        verify(repository).contarDetalleVentasPorCorte(
                "CLARO", LocalDate.of(2026, 9, 1), 1, 900042L, null);
    }
}
