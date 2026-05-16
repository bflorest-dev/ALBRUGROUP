package pe.albrugroup.auth_service.usecase;

import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.EstadoAccesoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.request.ActualizarCredencialesRequest;
import pe.albrugroup.auth_service.entity.request.ForgotPasswordRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;

import java.util.List;

public interface IUsuario {

    void upsertUsuario(RegistrarUsuarioRequest request);
    UsuarioResponse actualizarUsernameRoles(Long empleadoId, ActualizarCredencialesRequest request);
    CredencialesResponse resetPassword(Long empleadoId);
    CredencialesResponse forgotPassword(ForgotPasswordRequest request);
    EstadoAccesoResponse getEstadoAcceso(String username);
    UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId);
    List<UsuarioRolResponse> listarUsuariosActivosPorRol(PuestoTrabajo puestoTrabajo);
    void deshabilitarUsuario(Long empleadoId);
}
