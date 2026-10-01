package pe.albrugroup.billing_service.entity.response;

import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;
import pe.albrugroup.billing_service.entity.enums.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PlanillaEmpleadoResponse(
        Long id,
        Long idEmpleado,
        String nombres,
        String apellidos,
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        ModalidadTrabajo modalidad,
        boolean multipleTramos,
        BigDecimal sueldoBasico,
        Integer diasMes,
        Integer diasHabiles,
        BigDecimal pagoDiaHabil,
        LocalDate fechaIngreso,
        LocalDate fechaBaja,
        Integer diasValidos,
        BigDecimal sueldoAfecto,
        Integer tardanzas,
        Integer faltasInjustificadas,
        BigDecimal descuentoTardanzas,
        BigDecimal descuentoFaltas,
        BigDecimal adelantoSueldo,
        BigDecimal totalDescuento,
        Integer ventasValidas,
        BigDecimal bonoProductividad,
        BigDecimal bonoPuntualidad,
        BigDecimal bonoCapacitacion,
        BigDecimal bonoAdicional,
        Integer minutosExtras,
        BigDecimal pagoExtras,
        BigDecimal totalBonificaciones,
        BigDecimal remuneracionNeta,
        List<TramoPlanillaEmpleadoResponse> tramos,
        List<DetallePlanillaResponse> detalles
) {
}
