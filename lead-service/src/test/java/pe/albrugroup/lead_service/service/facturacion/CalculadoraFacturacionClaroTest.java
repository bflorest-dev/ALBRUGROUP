package pe.albrugroup.lead_service.service.facturacion;

import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraFacturacionClaroTest {

    private final CalculadoraFacturacionClaro calculadora = new CalculadoraFacturacionClaro();

    @Test
    void instalacionDiaUnoGeneraCorteUnoDelMes() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 1));

        assertThat(calendario.getTipoReglaProveedor()).isEqualTo(TipoReglaFacturacion.CLARO);
        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(1);
        assertThat(calendario.getDiaCorte()).isEqualTo(1);
        assertThat(calendario.getBloqueFacturacion()).isEqualTo(BloqueFacturacion.MISMO_MES);
    }

    @Test
    void instalacionDiaOnceGeneraCorteUnoDelMes() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 11));

        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(1);
        assertThat(calendario.getDiaCorte()).isEqualTo(1);
        assertThat(calendario.getBloqueFacturacion()).isEqualTo(BloqueFacturacion.MISMO_MES);
    }

    @Test
    void instalacionDiaDoceGeneraCorteDosDelMes() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 12));

        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(2);
        assertThat(calendario.getDiaCorte()).isEqualTo(12);
        assertThat(calendario.getBloqueFacturacion()).isEqualTo(BloqueFacturacion.MES_SIGUIENTE);
    }

    @Test
    void instalacionFinDeMesGeneraCorteDosDelMes() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 31));

        assertThat(calendario.getMesCorteBase()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(calendario.getNumeroCorteBase()).isEqualTo(2);
        assertThat(calendario.getDiaCorte()).isEqualTo(12);
        assertThat(calendario.getBloqueFacturacion()).isEqualTo(BloqueFacturacion.MES_SIGUIENTE);
    }

    @Test
    void periodoUnoMantieneEstimadosDesdeInstalacionMasQuinceDias() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 10));
        PeriodoFacturacionPostventa periodo = calculadora.crearPeriodo(calendario, 1);

        assertThat(periodo.getFechaInicioPeriodo()).isEqualTo(LocalDate.of(2026, 8, 10));
        assertThat(periodo.getFechaCorteEstimada()).isEqualTo(LocalDate.of(2026, 8, 10));
        assertThat(periodo.getFechaEmisionEstimada()).isEqualTo(LocalDate.of(2026, 8, 10));
        assertThat(periodo.getFechaVencimientoEstimado()).isEqualTo(LocalDate.of(2026, 8, 25));
    }

    @Test
    void periodoDosSumaUnMesALosEstimadosDelPeriodoUno() {
        CalendarioFacturacionPostventa calendario = calculadora.crearCalendario(leadClaro(), LocalDate.of(2026, 8, 10));
        PeriodoFacturacionPostventa periodo = calculadora.crearPeriodo(calendario, 2);

        assertThat(periodo.getFechaInicioPeriodo()).isEqualTo(LocalDate.of(2026, 9, 10));
        assertThat(periodo.getFechaCorteEstimada()).isEqualTo(LocalDate.of(2026, 9, 10));
        assertThat(periodo.getFechaEmisionEstimada()).isEqualTo(LocalDate.of(2026, 9, 10));
        assertThat(periodo.getFechaVencimientoEstimado()).isEqualTo(LocalDate.of(2026, 9, 25));
    }

    private Lead leadClaro() {
        return Lead.builder()
                .nombreProveedorSnapshot("CLARO")
                .nombrePlanSnapshot("Plan CLARO")
                .build();
    }
}
