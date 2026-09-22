package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.entity.enums.EnfoqueVenta;
import pe.albrugroup.lead_service.entity.enums.MetricaVentaDetalle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VentaMetricaSpecTest {

    @Test
    void instaladasDelPeriodoExigeIngresoEInstalacionDentroDeLaVentana() {
        var ctx = new VentaMetricaSpec.Ctx(
                Instant.parse("2026-08-01T05:00:00Z"),
                Instant.parse("2026-09-01T05:00:00Z"),
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 9, 1),
                null,
                null,
                List.of(),
                null
        );

        var spec = VentaMetricaSpec.build(MetricaVentaDetalle.INSTALADAS, EnfoqueVenta.DIA, ctx);

        assertThat(spec.where())
                .contains("rv.fechaIngresoEtapa >= :inicio")
                .contains("rv.ultimaCodigoTipificacion = :codigoInstalado")
                .contains("c.fechaInstalacion >= :desdeDate")
                .contains("c.fechaInstalacion < :hastaDateExcl");
        assertThat(spec.params())
                .containsEntry("desdeDate", LocalDate.of(2026, 8, 1))
                .containsEntry("hastaDateExcl", LocalDate.of(2026, 9, 1));
    }
}
