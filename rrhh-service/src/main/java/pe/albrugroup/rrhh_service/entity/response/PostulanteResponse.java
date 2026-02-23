package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.time.Instant;

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
    // ESTADO
    private String etapaProceso;
    private String estadoProceso;
    private String subestadoProceso;
    // OBJETIVO
    private Origen origen;
    private PuestoTrabajo puestoTrabajo;
    private Instant fechaActualizacion;
    private Boolean listaNegra;
}
