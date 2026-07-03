package pe.albrugroup.rrhh_service.usecase;

import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoRolResponse;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;

import java.util.List;

public interface IEmpleado {

    PageResponse<EmpleadoResponse> getEmpleados(String q, String dni, String celular, Distrito distrito, Banco banco,
                                                Long idEmpresaContratista, Origen origen, EstadoOperativo estado,
                                                PageRequest pageRequest);
    PageResponse<EmpleadoResponse> getEmpleadoUniversal(String dato, PageRequest pageRequest);
    EmpleadoResponse getEmpleadoDocumento(String documento);
    EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado, Long responsableId);
    void registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados, Long responsableId);
    EmpleadoResponse actualizarDatosPersonales(Long idEmpleado, DatosPersonalesRequest datosPersonales, String authHeader);
    EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado, DatosContactoUbicacionRequest datosContactoUbicacion);
    EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado, DatosFinancierosRequest datosFinancieros);
    EmpleadoResponse actualizarContactoCorporativo(Long idEmpleado, DatosContactoCorporativoRequest datosCorporativos);
    EmpleadoResponse listaNegraEmpleado(Long idEmpleado, Long responsableId);
    EmpleadoResponse darDeBajaEmpleado(Long idEmpleado, String authHeader);
    List<EmpleadoRolResponse> listarEmpleadosLight(List<PuestoTrabajo> puestosTrabajo, List<Long> empleadoIds);
    List<EmpleadoRolResponse> listarPersonalRecruitment();
}
