package pe.albrugroup.auth_service.mapper;

import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Response.EquipoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.stream.Collectors;
import java.util.Set;

public class Mapper {

    public static UsuarioResponse toResponse(Usuario usuario) {
        if (usuario == null) return null;

        Set<String> roles = usuario.getRoles().stream()
                .map(Rol::getNombre)
                .collect(Collectors.toSet());
        String rolPrincipal = usuario.getRolPrincipal() == null ? null : usuario.getRolPrincipal().getNombre();
        Set<String> rolesSecundarios = roles.stream()
                .filter(rol -> !rol.equals(rolPrincipal))
                .collect(Collectors.toSet());

        return UsuarioResponse.builder()
                .empleadoId(usuario.getEmpleadoId())
                .dni(usuario.getDni())
                .nombreCompleto(usuario.getNombreCompleto())
                .username(usuario.getUsername())
                .activo(usuario.getActivo())
                .passwordInicializada(usuario.getPasswordInicializada())
                .email(usuario.getEmail())
                .roles(roles)
                .rolPrincipal(rolPrincipal)
                .rolesSecundarios(rolesSecundarios)
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
