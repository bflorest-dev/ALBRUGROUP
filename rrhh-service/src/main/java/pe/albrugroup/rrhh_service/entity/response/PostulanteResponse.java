package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class PostulanteResponse {

    private Long id;
    // EMPLEADO
    private String nombres;
    private String apellidos;
    private Documento tipoDocumento;
    private String numeroDocumento;
    private String celularPersonal;
    // POSTULANTE
    private Origen origen;
    private PuestoTrabajo puestoTrabajo;
    private EstadoPostulacion estadoPostulacion;
    private BigDecimal pagoDiaCapacitacion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
}
