package pe.albrugroup.auth_service.mapper;

import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Response.EquipoResponse;
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
                .passwordInicializada(usuario.getPasswordInicializada())
                .email(usuario.getEmail())
                .roles
                (
                        usuario.getRoles().stream()
                                .map(Rol::getNombre)
                                .collect(Collectors.toSet())
                )
                .equipos
                (
                        usuario.getEquipos().stream()
                                .map(Equipo::getNombre)
                                .collect(Collectors.toSet())
                )
                .build();
    }

    public static EquipoResponse toEquipoResponse(Equipo equipo) {
        if (equipo == null) return null;

        return EquipoResponse.builder()
                .id(equipo.getId())
                .nombre(equipo.getNombre())
                .descripcion(equipo.getDescripcion())
                .color(equipo.getColor())
                .activo(equipo.getActivo())
                .build();
    }
}
