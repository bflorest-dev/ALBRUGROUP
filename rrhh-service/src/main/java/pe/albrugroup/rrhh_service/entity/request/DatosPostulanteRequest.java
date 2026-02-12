package pe.albrugroup.rrhh_service.entity.request;


import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosPostulanteRequest {

    // POSTULANTE
    @NotNull private Origen origen;
    @NotNull private PuestoTrabajo puestoTrabajo;
    @NotNull private BigDecimal pagoDiaCapacitacion;
    @NotNull private LocalDate fechaInicio;
    @NotNull private LocalDate fechaFin;
}
