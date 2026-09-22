package pe.albrugroup.auth_service.usecase;

import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.EstadoAccesoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.request.ForgotPasswordRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;

import java.util.List;

public interface IUsuario {

    void upsertUsuario(RegistrarUsuarioRequest request);
    CredencialesResponse resetPassword(Long empleadoId);
    CredencialesResponse forgotPassword(ForgotPasswordRequest request);
    EstadoAccesoResponse getEstadoAcceso(String username);
    UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId);
    List<UsuarioRolResponse> listarUsuariosActivosPorRol(String rolNombre);
    void deshabilitarUsuario(Long empleadoId);
}
