package pe.albrugroup.billing_service.entity.response;

import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TramoPlanillaEmpleadoResponse(
        Long id,
        Long idContrato,
        LocalDate fechaInicioContrato,
        LocalDate fechaFinContrato,
        LocalDate fechaDesdeTramo,
        LocalDate fechaHastaTramo,
        ModalidadTrabajo modalidadTrabajo,
        BigDecimal sueldoBasico,
        Integer horasDia,
        Integer diasValidos,
        BigDecimal pagoDiaHabil,
        BigDecimal sueldoAfecto,
        Integer tardanzas,
        Integer faltasInjustificadas,
        BigDecimal descuentoTardanzas,
        BigDecimal descuentoFaltas,
        Integer minutosExtras,
        BigDecimal pagoExtras
) {
}
