package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Regimen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ContratoResponse {

    private Long id;
    private Long idEmpleado;
    // PUESTO DE TRABAJO
    private PuestoTrabajo puestoTrabajo;
    private Regimen regimen;
    private BigDecimal sueldoBase;
    // VIGENCIA
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
