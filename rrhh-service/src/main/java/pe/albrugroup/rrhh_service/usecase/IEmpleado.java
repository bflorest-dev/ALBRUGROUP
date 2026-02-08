package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

import java.util.List;

@Component
public interface IEmpleado {

    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante);
    List<PostulanteResponse> getPostulantesPeriodoMensual();
    List<EmpleadoResponse> getEmpleadosActivos();
    List<EmpleadoResponse> getEmpleadoUniversal(String dato);
    EmpleadoResponse getEmpleadoDocumento(String documento);
    EmpleadoResponse actualizarDatosPersonales(Long idEmpleado, DatosPersonalesRequest datosPersonales);
    EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado, DatosContactoUbicacionRequest datosContactoUbicacion);
    EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado, DatosFinancierosRequest datosFinancieros);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

//    List<EmpleadoResponse> getEmpleados();
//    EmpleadoResponse getEmpleado(Long idEmpleado);
//    List<EmpleadoResponse> registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados);
//    EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado);
//    void cambiarEstadoOperativo(Long idEmpleado);
}
