package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;

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
}
