package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarContratoRequest {

    // PUESTO DE TRABAJO
    @NotNull private PuestoTrabajo puestoTrabajo;
    @NotNull private Regimen regimen;
    @NotNull private Modalidad modalidad;
    @NotNull private SeguroSalud seguroSalud;
    @NotNull private SistemaPensiones sistemaPensiones;
    @NotNull @DecimalMin(value = "0.00", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    private BigDecimal sueldoBase;
    // VIGENCIA
    @NotNull private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
