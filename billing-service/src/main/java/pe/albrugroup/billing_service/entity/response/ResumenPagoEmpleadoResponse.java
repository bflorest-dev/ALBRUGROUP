package pe.albrugroup.billing_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ResumenPagoEmpleadoResponse(
        Long idEmpleado,
        String nombres,
        String apellidos,
        String tipoDocumento,
        String numeroDocumento,
        LocalDate fechaIngreso,
        LocalDate fechaBaja,
        BigDecimal sueldoBasico,
        BigDecimal sueldoAfecto,
        BigDecimal bonoProductividad,
        BigDecimal bonoPuntualidad,
        BigDecimal bonoCapacitacion,
        BigDecimal pagoExtras,
        BigDecimal bonoAdicional,
        BigDecimal descuentoTardanzas,
        BigDecimal descuentoFaltas,
        BigDecimal adelantoSueldo,
        BigDecimal totalDescuento,
        BigDecimal totalBonificaciones,
        BigDecimal remuneracionNeta,
        Integer tardanzas,
        Integer faltasInjustificadas,
        Integer minutosExtras,
        String banco,
        String cuentaBancaria,
        String cuentaInterbancaria
) {
}
