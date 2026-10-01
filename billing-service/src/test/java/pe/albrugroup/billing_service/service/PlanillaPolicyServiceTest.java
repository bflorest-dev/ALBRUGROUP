package pe.albrugroup.billing_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;

class PlanillaPolicyServiceTest {

    private final PlanillaPolicyService policy = new PlanillaPolicyService();

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
        assertThat(policy.descuentoTardanza(4)).isEqualByComparingTo("0.00");
        assertThat(policy.descuentoTardanza(5)).isEqualByComparingTo("5.00");
        assertThat(policy.descuentoTardanza(9)).isEqualByComparingTo("5.00");
        assertThat(policy.descuentoTardanza(10)).isEqualByComparingTo("10.00");
        assertThat(policy.descuentoTardanza(20)).isEqualByComparingTo("10.00");
        assertThat(policy.descuentoTardanza(21)).isEqualByComparingTo("0.00");
    }

    @Test
    void calculaBonosPorModalidad() {
        assertThat(policy.bonoPuntualidad(ModalidadTrabajo.PARTTIME, 0)).isEqualByComparingTo("50.00");
        assertThat(policy.bonoPuntualidad(ModalidadTrabajo.FULLTIME, 0)).isEqualByComparingTo("100.00");
        assertThat(policy.bonoPuntualidad(ModalidadTrabajo.FULLTIME, 1)).isEqualByComparingTo("0.00");
        assertThat(policy.bonoProductividad(ModalidadTrabajo.PARTTIME, 29)).isEqualByComparingTo("0.00");
        assertThat(policy.bonoProductividad(ModalidadTrabajo.PARTTIME, 30)).isEqualByComparingTo("100.00");
        assertThat(policy.bonoProductividad(ModalidadTrabajo.SUPERFULLTIME, 60)).isEqualByComparingTo("100.00");
    }

    @Test
    void pagaSoloHorasExtraCompletas() {
        BigDecimal pago = policy.pagoExtras(new BigDecimal("80.00"), ModalidadTrabajo.FULLTIME, 119);

        assertThat(pago).isEqualByComparingTo("10.00");
        assertThat(policy.pagoExtras(new BigDecimal("80.00"), ModalidadTrabajo.FULLTIME, 59)).isEqualByComparingTo("0.00");
    }
}
