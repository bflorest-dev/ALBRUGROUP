package pe.albrugroup.auth_service.usecase;

import pe.albrugroup.auth_service.entity.Response.EquipoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.request.EquipoActualizarRequest;
import pe.albrugroup.auth_service.entity.request.EquipoRequest;

import java.util.List;
import java.util.Set;

public interface IEquipo {

    EquipoResponse crear(EquipoRequest request);
    List<EquipoResponse> listar();
    EquipoResponse actualizar(Long id, EquipoActualizarRequest request);
    void eliminar(Long id);
    UsuarioResponse asignarEquipos(Long empleadoId, Set<Long> equipoIds);
    List<EquipoResponse> listarMisEquipos();
    List<UsuarioRolResponse> listarAsesoresPreventa(Long equipoId);
    List<UsuarioRolResponse> listarMiembros(Long equipoId);
}
