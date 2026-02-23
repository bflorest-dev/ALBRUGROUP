package pe.albrugroup.rrhh_service.entity.request.pago;

import jakarta.validation.constraints.DecimalMin;
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
    @NotNull(message = "La asignación familiar es obligatoria")
    @DecimalMin(value = "0.0", inclusive = false, message = "Asignación familiar invalida")
    private BigDecimal asignacionFamiliar;
    @DecimalMin(value = "0.0", inclusive = false, message = "Bono de puntualidad invalido")
    private BigDecimal bonoPuntualidad;
    @DecimalMin(value = "0.0", inclusive = false, message = "Comisión semanal invalida")
    private BigDecimal comisionSemanal;
    @DecimalMin(value = "0.0", inclusive = false, message = "Comisión mensual invalida")
    private BigDecimal comisionMensual;
    @DecimalMin(value = "0.0", inclusive = false, message = "Bono extra invalido")
    private BigDecimal bonoExtra;
}
