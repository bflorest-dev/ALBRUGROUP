package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotNull;
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
    @NotNull private BigDecimal sueldoBase;
    @NotNull private BigDecimal asignacionFamiliar;
    @NotNull private BigDecimal bonoPuntualidad;
    @NotNull private BigDecimal comisionSemanal;
    @NotNull private BigDecimal comisionMensual;
    @NotNull private BigDecimal bonoExtra;
}
