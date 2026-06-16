package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Response.EquipoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.request.EquipoActualizarRequest;
import pe.albrugroup.auth_service.entity.request.EquipoRequest;
import pe.albrugroup.auth_service.exception.BadRequestException;
import pe.albrugroup.auth_service.exception.ConflictException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.mapper.Mapper;
import pe.albrugroup.auth_service.repository.EquipoRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.usecase.IEquipo;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class EquipoService implements IEquipo {

    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;

    // Roles operativos: su acceso a datos se particiona por equipo, por lo que deben
    // pertenecer a exactamente un equipo. ADMIN/COMMUNITY/MONITOR no son operativos
    // (acceso global por permiso) y van sin equipo.
    private static final Set<String> ROLES_OPERATIVOS = Set.of(
            "ASESOR_GTR", "SUPERVISOR_GTR",
            "ASESOR_VENTAS", "SUPERVISOR_VENTAS", "OJT",
            "ASESOR_BACKOFFICE", "SUPERVISOR_BACKOFFICE",
            "ASESOR_POSTVENTA", "SUPERVISOR_POSTVENTA",
            "ASESOR_COBRANZA"
    );

    @Override
    public EquipoResponse crear(EquipoRequest request) {
        String nombre = request.getNombre().trim();
        if (equipoRepository.existsByNombre(nombre)) {
            throw new ConflictException("Ya existe un equipo con el nombre: " + nombre);
        }
        Equipo equipo = equipoRepository.save(Equipo.builder()
                .nombre(nombre)
                .descripcion(request.getDescripcion())
                .activo(true)
                .build());
        log.info("Equipo creado: {} (ID: {})", equipo.getNombre(), equipo.getId());
        return Mapper.toEquipoResponse(equipo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipoResponse> listar() {
        return equipoRepository.findAll().stream()
                .map(Mapper::toEquipoResponse)
                .toList();
    }

    @Override
    public EquipoResponse actualizar(Long id, EquipoActualizarRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado", id));

        if (request.getNombre() != null && !request.getNombre().isBlank()) {
            String nuevoNombre = request.getNombre().trim();
            if (!nuevoNombre.equalsIgnoreCase(equipo.getNombre())
                    && equipoRepository.existsByNombre(nuevoNombre)) {
                throw new ConflictException("Ya existe un equipo con el nombre: " + nuevoNombre);
            }
            equipo.setNombre(nuevoNombre);
        }
        if (request.getDescripcion() != null) {
            equipo.setDescripcion(request.getDescripcion());
        }
        if (request.getActivo() != null) {
            equipo.setActivo(request.getActivo());
        }
        return Mapper.toEquipoResponse(equipoRepository.save(equipo));
    }

    @Override
    public void eliminar(Long id) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado", id));
        // Quitar la membresía de los usuarios que pertenecían al equipo antes de borrarlo.
        List<Usuario> miembros = usuarioRepository.findByEquiposId(id);
        miembros.forEach(usuario -> usuario.getEquipos().removeIf(e -> e.getId().equals(id)));
        usuarioRepository.saveAll(miembros);
        equipoRepository.delete(equipo);
        log.info("Equipo eliminado: {} ({} miembros desvinculados)", id, miembros.size());
    }

    @Override
    public UsuarioResponse asignarEquipos(Long empleadoId, Set<Long> equipoIds) {
        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));

        Set<Long> idsSolicitados = equipoIds == null ? Set.of() : equipoIds;

        validarMembresia(usuario, idsSolicitados);

        Set<Equipo> equipos = new HashSet<>();
        if (!idsSolicitados.isEmpty()) {
            equipos.addAll(equipoRepository.findAllById(idsSolicitados));
            if (equipos.size() != idsSolicitados.size()) {
                throw new BadRequestException("Uno o más equipos no existen");
            }
        }

        usuario.setEquipos(equipos);
        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Equipos asignados a empleado {}: {}", empleadoId, idsSolicitados);
        return Mapper.toResponse(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRolResponse> listarMiembros(Long equipoId) {
        if (!equipoRepository.existsById(equipoId)) {
            throw new NotFoundException("Equipo no encontrado", equipoId);
        }
        return usuarioRepository.findDistinctByEquiposIdAndActivoTrue(equipoId).stream()
                .map(usuario -> UsuarioRolResponse.builder()
                        .empleadoId(usuario.getEmpleadoId())
                        .nombreCompleto(usuario.getNombreCompleto())
                        .roles(usuario.getRoles().stream().map(Rol::getNombre).collect(Collectors.toSet()))
                        .build())
                .toList();
    }

    private void validarMembresia(Usuario usuario, Set<Long> idsSolicitados) {
        boolean esOperativo = usuario.getRoles().stream()
                .map(Rol::getNombre)
                .anyMatch(ROLES_OPERATIVOS::contains);

        // Se permite dejar sin equipo (quitar): el fail-closed del filtro lo protege (no ve nada).
        // Solo se restringe que un rol operativo pertenezca a más de un equipo a la vez.
        if (esOperativo && idsSolicitados.size() > 1) {
            throw new BadRequestException(
                    "Un rol operativo solo puede pertenecer a un equipo");
        }
    }
}
