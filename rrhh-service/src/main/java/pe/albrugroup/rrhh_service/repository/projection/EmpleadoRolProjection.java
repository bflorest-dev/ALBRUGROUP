package pe.albrugroup.rrhh_service.repository.projection;

import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

public interface EmpleadoRolProjection {

    Long getIdEmpleado();
    String getNombres();
    String getApellidos();
    String getNumeroDocumento();
    String getCelularPersonal();
    String getCorreoPersonal();
    CategoriaPersonal getCategoriaPersonal();
    @Deprecated(forRemoval = true)
    PuestoTrabajo getPuestoTrabajo();
    EstadoOperativo getEstadoOperativo();
}
