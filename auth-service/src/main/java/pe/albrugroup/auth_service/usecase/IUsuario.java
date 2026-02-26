package pe.albrugroup.auth_service.usecase;

import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.request.ActualizarCredencialesRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;

public interface IUsuario {

    UsuarioResponse registrarUsuario(RegistrarUsuarioRequest request);
    CredencialesResponse registrarUsuarioConCredenciales(RegistrarUsuarioRequest request);
    UsuarioResponse actualizarUsernameRoles(Long empleadoId, ActualizarCredencialesRequest request);
    CredencialesResponse resetPassword(Long empleadoId);
    UsuarioResponse actualizarRolesUsuario(Long usuarioId, PuestoTrabajo puesto);
    UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId);
    void deshabilitarUsuario(Long empleadoId);
}
