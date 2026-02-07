package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Modalidad;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarContratoRequest {

    // PUESTO DE TRABAJO
    @NotNull
    private PuestoTrabajo puestoTrabajo;
    @NotNull
    private Modalidad modalidad;
    @NotNull @DecimalMin(value = "0.00", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    private BigDecimal sueldoBase;
    // VIGENCIA
    @NotNull
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
