package pe.albrugroup.rrhh_service.repository.projection;

import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;

public interface EmpleadoRolProjection {

    Long getIdEmpleado();
    String getNombres();
    String getApellidos();
    String getNumeroDocumento();
    String getCelularPersonal();
    String getCorreoPersonal();
    PuestoTrabajo getPuestoTrabajo();
    EstadoOperativo getEstadoOperativo();
}
