package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GestionMensualPostventaServiceTest {

    // ===== Regla de la ventana del dia 15 =====

    @Test
    void mesGestionExplicitoSeRespeta() {
        assertThat(GestionMensualPostventaService.resolverMesGestion(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 20)))
                .isEqualTo(YearMonth.of(2026, 7));
    }

    @Test
    void antesDelDia15DevuelveMesAnterior() {
        assertThat(GestionMensualPostventaService.resolverMesGestion(null, LocalDate.of(2026, 8, 14)))
                .isEqualTo(YearMonth.of(2026, 7));
    }

    @Test
    void desdeElDia15DevuelveMesActual() {
        assertThat(GestionMensualPostventaService.resolverMesGestion(null, LocalDate.of(2026, 8, 15)))
                .isEqualTo(YearMonth.of(2026, 8));
    }

    @Test
    void antesDelDia15EnEneroRetrocedeAlAnioAnterior() {
        assertThat(GestionMensualPostventaService.resolverMesGestion(null, LocalDate.of(2026, 1, 3)))
                .isEqualTo(YearMonth.of(2025, 12));
    }

    // ===== Etiqueta en lenguaje de usuario final =====

    @Test
    void etiquetaUsaMesEnEspanolCorteYRecibo() {
        assertThat(GestionMensualPostventaService.construirEtiqueta(LocalDate.of(2026, 6, 1), 1, 2))
                .isEqualTo("Junio · Corte 1 · Recibo 2");
    }

    @Test
    void etiquetaCapitalizaOtrosMeses() {
        assertThat(GestionMensualPostventaService.construirEtiqueta(LocalDate.of(2026, 4, 1), 2, 3))
                .isEqualTo("Abril · Corte 2 · Recibo 3");
    }

    @Test
    void despuesDelDia15LaVentanaUsaElVencimientoDelMismoMes() {
        var ventana = GestionMensualPostventaService.resolverVentanaDecision(LocalDate.of(2026, 10, 23));

        assertThat(ventana.fechaVencimientoObjetivo()).isEqualTo(LocalDate.of(2026, 10, 28));
        assertThat(ventana.fechaLimite()).isEqualTo(LocalDate.of(2026, 11, 15));
    }

    @Test
    void hastaElDia15LaVentanaSigueElVencimientoDelMesAnterior() {
        var ventana = GestionMensualPostventaService.resolverVentanaDecision(LocalDate.of(2026, 11, 15));

        assertThat(ventana.fechaVencimientoObjetivo()).isEqualTo(LocalDate.of(2026, 10, 28));
        assertThat(ventana.fechaLimite()).isEqualTo(LocalDate.of(2026, 11, 15));
    }

    @Test
    void despuesDelLimiteAbreLaSiguienteVentana() {
        var ventana = GestionMensualPostventaService.resolverVentanaDecision(LocalDate.of(2026, 11, 16));

        assertThat(ventana.fechaVencimientoObjetivo()).isEqualTo(LocalDate.of(2026, 11, 28));
        assertThat(ventana.fechaLimite()).isEqualTo(LocalDate.of(2026, 12, 15));
    }

    @Test
    void ventanaUsaLosMismosGruposDeLaGestionMensualDelMesDeVencimiento() {
        PeriodoFacturacionPostventaRepository repository = mock(PeriodoFacturacionPostventaRepository.class);
        when(repository.gestionMensualPorCorte(2026 * 12 + 10, "WIN")).thenReturn(List.of());
        GestionMensualPostventaService service = new GestionMensualPostventaService(repository, mock(ProveedorScopeService.class));

        assertThat(service.obtenerFilasVentana(LocalDate.of(2026, 10, 28), "WIN")).isEmpty();

        verify(repository).gestionMensualPorCorte(2026 * 12 + 10, "WIN");
    }
}
