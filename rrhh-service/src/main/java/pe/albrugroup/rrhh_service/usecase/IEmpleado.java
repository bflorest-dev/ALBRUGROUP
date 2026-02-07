package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;

import java.util.List;

@Component
public interface IEmpleado {

    List<EmpleadoResponse> getEmpleados();
    EmpleadoResponse getEmpleado(Long idEmpleado);

    List<EmpleadoResponse> registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados);
    EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado);
    EmpleadoResponse actualizarDatosPersonales(Long idEmpleado, DatosPersonalesRequest datosPersonales);
    EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado, DatosContactoUbicacionRequest datosContactoUbicacion);
    EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado, DatosFinancierosRequest datosFinancieros);
    void cambiarEstadoOperativo(Long idEmpleado);
}
