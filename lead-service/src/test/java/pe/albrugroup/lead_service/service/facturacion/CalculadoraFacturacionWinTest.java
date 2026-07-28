package pe.albrugroup.lead_service.service.facturacion;

import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraFacturacionWinTest {

    private final CalculadoraFacturacionWin calculadora = new CalculadoraFacturacionWin();

    @Test
    void instalacionEnPrimerBloqueGeneraJulioUno() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadWin(), LocalDate.of(2026, 7, 10));
        PeriodoFacturacionPostventa periodo = calculadora.crearPeriodo(calendario, 1);

        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(1);
        assertThat(periodo.getFechaInicioPeriodo()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(periodo.getFechaCorteEstimada()).isEqualTo(LocalDate.of(2026, 7, 23));
        assertThat(periodo.getFechaVencimientoEstimado()).isEqualTo(LocalDate.of(2026, 7, 28));
    }

    @Test
    void instalacionEnSegundoBloqueGeneraJulioDos() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadWin(), LocalDate.of(2026, 7, 27));
        PeriodoFacturacionPostventa periodo = calculadora.crearPeriodo(calendario, 1);

        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(2);
        assertThat(periodo.getFechaInicioPeriodo()).isEqualTo(LocalDate.of(2026, 7, 23));
        assertThat(periodo.getFechaCorteEstimada()).isEqualTo(LocalDate.of(2026, 8, 23));
        assertThat(periodo.getFechaVencimientoEstimado()).isEqualTo(LocalDate.of(2026, 8, 28));
    }

    @Test
    void corteManualAgostoUnoRecalculaPeriodoDesdeInicioDelCorte() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadWin(), LocalDate.of(2026, 7, 27));
        calendario.setMesCorteBase(LocalDate.of(2026, 8, 1));
        calendario.setNumeroCorteBase(1);

        PeriodoFacturacionPostventa periodo = calculadora.crearPeriodo(calendario, 1);

        assertThat(periodo.getFechaInicioPeriodo()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(periodo.getFechaCorteEstimada()).isEqualTo(LocalDate.of(2026, 8, 23));
        assertThat(periodo.getFechaVencimientoEstimado()).isEqualTo(LocalDate.of(2026, 8, 28));
    }

    private Lead leadWin() {
        return Lead.builder()
                .nombreProveedorSnapshot("WIN")
                .nombrePlanSnapshot("Plan WIN")
                .build();
    }
}
