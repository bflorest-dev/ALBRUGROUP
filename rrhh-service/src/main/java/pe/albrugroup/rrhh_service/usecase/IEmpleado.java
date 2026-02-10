package pe.albrugroup.rrhh_service.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;

import java.util.List;

@Component
public interface IEmpleado {

    Page<EmpleadoResponse> getEmpleados(String q, String dni, String celular, Distrito distrito, Banco banco,
                                       EstadoOperativo estado, Pageable pageable);
    Page<EmpleadoResponse> getEmpleadoUniversal(String dato, Pageable pageable);
    EmpleadoResponse getEmpleadoDocumento(String documento);
    EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado);
    void registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados);
    EmpleadoResponse actualizarDatosPersonales(Long idEmpleado, DatosPersonalesRequest datosPersonales);
    EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado, DatosContactoUbicacionRequest datosContactoUbicacion);
    EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado, DatosFinancierosRequest datosFinancieros);
    EmpleadoResponse actualizarContactoCorporativo(Long idEmpleado, DatosContactoCorporativoRequest datosCorporativos);
}
