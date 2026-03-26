package pe.albrugroup.auth_service.mapper;

import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.stream.Collectors;

public class Mapper {

    public static UsuarioResponse toResponse(Usuario usuario) {
        if (usuario == null) return null;

        return UsuarioResponse.builder()
                .empleadoId(usuario.getEmpleadoId())
                .dni(usuario.getDni())
                .nombreCompleto(usuario.getNombreCompleto())
                .username(usuario.getUsername())
                .activo(usuario.getActivo())
                .email(usuario.getEmail())
                .roles
                (
                        usuario.getRoles().stream()
                                .map(Rol::getNombre)
                                .collect(Collectors.toSet())
                )
                .build();
    }
}
