package pe.albrugroup.rrhh_service.entity.request;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarPagoRequest {

    // PERIODO
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    // ABONO
    private BigDecimal sueldoBase;
    private BigDecimal asignacionFamiliar;
    private BigDecimal comision;
    private BigDecimal sueldoTotal;
}
