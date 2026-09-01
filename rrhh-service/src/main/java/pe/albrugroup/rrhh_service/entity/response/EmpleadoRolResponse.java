package pe.albrugroup.rrhh_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmpleadoRolResponse {

    private Long idEmpleado;
    private String nombres;
    private String apellidos;
    private String numeroDocumento;
    private String celularPersonal;
    private String correoPersonal;
    private PuestoTrabajo puestoTrabajo;
    private EstadoOperativo estadoOperativo;
}
