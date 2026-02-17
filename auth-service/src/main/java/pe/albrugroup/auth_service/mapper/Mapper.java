package pe.albrugroup.auth_service.mapper;

import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.stream.Collectors;

public class Mapper {

    public static UsuarioResponse toResponse(Usuario usuario) {
        if (usuario == null) return null;

        return UsuarioResponse.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .empleadoId(usuario.getEmpleadoId())
                .activo(usuario.getActivo())
                .roles
                (
                        usuario.getRoles().stream()
                                .map(Rol::getNombre)
                                .collect(Collectors.toSet())
                )
                .build();
    }
}
