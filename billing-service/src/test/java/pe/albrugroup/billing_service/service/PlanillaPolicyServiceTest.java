package pe.albrugroup.billing_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.billing_service.entity.MatrizCalculoPlanilla;
import pe.albrugroup.billing_service.entity.MatrizModalidadPlanilla;
import pe.albrugroup.billing_service.entity.MatrizTardanzaPlanilla;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;

class PlanillaPolicyServiceTest {

    private final PlanillaPolicyService policy = new PlanillaPolicyService();
    private final MatrizCalculoPlanilla matriz = matrizInicial();

    @Test
    void calculaDiasHabilesSinDomingosReales() {
        assertThat(policy.diasHabiles(YearMonth.of(2026, 9))).isEqualTo(26);
        assertThat(policy.diasHabiles(YearMonth.of(2026, 8))).isEqualTo(26);
    }

    @Test
    void calculaPagoDiaYSueldoAfectoConRedondeo() {
        BigDecimal pagoDia = policy.pagoDiaHabil(new BigDecimal("1500.00"), 26);

        assertThat(pagoDia).isEqualByComparingTo("57.69");
        assertThat(policy.sueldoAfecto(pagoDia, 26)).isEqualByComparingTo("1499.94");
    }

    @Test
    void aplicaDescuentosDeTardanzaSoloEnRangosAcordados() {
        assertThat(policy.descuentoTardanza(matriz, 4)).isEqualByComparingTo("0.00");
        assertThat(policy.descuentoTardanza(matriz, 5)).isEqualByComparingTo("5.00");
        assertThat(policy.descuentoTardanza(matriz, 9)).isEqualByComparingTo("5.00");
        assertThat(policy.descuentoTardanza(matriz, 10)).isEqualByComparingTo("10.00");
        assertThat(policy.descuentoTardanza(matriz, 20)).isEqualByComparingTo("10.00");
        assertThat(policy.descuentoTardanza(matriz, 21)).isEqualByComparingTo("0.00");
    }

    @Test
    void calculaBonosPorModalidad() {
        assertThat(policy.bonoPuntualidad(matriz, ModalidadTrabajo.PARTTIME, 0)).isEqualByComparingTo("50.00");
        assertThat(policy.bonoPuntualidad(matriz, ModalidadTrabajo.FULLTIME, 0)).isEqualByComparingTo("100.00");
        assertThat(policy.bonoPuntualidad(matriz, ModalidadTrabajo.FULLTIME, 1)).isEqualByComparingTo("0.00");
        assertThat(policy.bonoProductividad(matriz, ModalidadTrabajo.PARTTIME, 29)).isEqualByComparingTo("0.00");
        assertThat(policy.bonoProductividad(matriz, ModalidadTrabajo.PARTTIME, 30)).isEqualByComparingTo("100.00");
        assertThat(policy.bonoProductividad(matriz, ModalidadTrabajo.SUPERFULLTIME, 60)).isEqualByComparingTo("100.00");
    }

    @Test
    void pagaSoloHorasExtraCompletas() {
        BigDecimal pago = policy.pagoExtras(matriz, new BigDecimal("80.00"), ModalidadTrabajo.FULLTIME, 119);

        assertThat(pago).isEqualByComparingTo("10.00");
        assertThat(policy.pagoExtras(matriz, new BigDecimal("80.00"), ModalidadTrabajo.FULLTIME, 59)).isEqualByComparingTo("0.00");
    }

    private MatrizCalculoPlanilla matrizInicial() {
        MatrizCalculoPlanilla matriz = MatrizCalculoPlanilla.builder()
                .bonoCapacitacion(PlanillaPolicyService.money("50.00"))
                .build();
        matriz.getModalidades().add(modalidad(matriz, ModalidadTrabajo.PARTTIME, 4, "50.00", 30, "100.00"));
        matriz.getModalidades().add(modalidad(matriz, ModalidadTrabajo.SEMIFULLTIME, 6, "100.00", 40, "100.00"));
        matriz.getModalidades().add(modalidad(matriz, ModalidadTrabajo.FULLTIME, 8, "100.00", 60, "100.00"));
        matriz.getModalidades().add(modalidad(matriz, ModalidadTrabajo.SUPERFULLTIME, 10, "100.00", 60, "100.00"));
        matriz.getTardanzas().add(tardanza(matriz, 5, 9, "5.00"));
        matriz.getTardanzas().add(tardanza(matriz, 10, 20, "10.00"));
        return matriz;
    }

    private MatrizModalidadPlanilla modalidad(MatrizCalculoPlanilla matriz, ModalidadTrabajo modalidad, int horasDia, String puntualidad, int ventas, String productividad) {
        return MatrizModalidadPlanilla.builder()
                .matrizCalculo(matriz)
                .modalidad(modalidad)
                .horasDia(horasDia)
                .bonoPuntualidad(PlanillaPolicyService.money(puntualidad))
                .ventasMinimasProductividad(ventas)
                .bonoProductividad(PlanillaPolicyService.money(productividad))
                .build();
    }

    private MatrizTardanzaPlanilla tardanza(MatrizCalculoPlanilla matriz, int desde, int hasta, String monto) {
        return MatrizTardanzaPlanilla.builder()
                .matrizCalculo(matriz)
                .minutosDesde(desde)
                .minutosHasta(hasta)
                .montoDescuento(PlanillaPolicyService.money(monto))
                .build();
    }
}
