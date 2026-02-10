package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

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
    private Modalidad modalidad;
    private SeguroSalud seguroSalud;
    private SistemaPensiones sistemaPensiones;
    private BigDecimal sueldoBase;
    // VIGENCIA
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
