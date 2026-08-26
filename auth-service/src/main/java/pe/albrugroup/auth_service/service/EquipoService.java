package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
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
import pe.albrugroup.auth_service.exception.ForbiddenException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.mapper.Mapper;
import pe.albrugroup.auth_service.repository.EquipoRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.security.CustomUserDetails;
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

    // Roles operativos: su acceso a datos se particiona por equipo. Por defecto pertenecen a
    // exactamente un equipo (salvo los listados en ROLES_MULTIEQUIPO). ADMIN/COMMUNITY/MONITOR no
    // son operativos (acceso global por permiso) y van sin equipo. BACKOFFICE y POSTVENTA ya NO se
    // particionan por equipo sino por proveedor (ver ROLES_GESTIONADOS_POR_PROVEEDOR y lead-service).
    private static final Set<String> ROLES_OPERATIVOS = Set.of(
            "ASESOR_GTR", "SUPERVISOR_GTR",
            "ASESOR_VENTAS", "SUPERVISOR_VENTAS", "OJT"
    );

    // Roles operativos que SÍ pueden pertenecer a varios equipos a la vez. El ASESOR_VENTAS se
    // comparte entre equipos: cada GTR le asigna leads de su propio equipo y el aislamiento se
    // mantiene porque la partición de datos es por el equipo del lead, no por la membresía del asesor.
    private static final Set<String> ROLES_MULTIEQUIPO = Set.of(
            "ASESOR_GTR",
            "ASESOR_VENTAS"
    );

    // Roles cuyo acceso se acota por PROVEEDOR, no por equipo. No se les asignan equipos: se gestionan
    // en la vista de Proveedores (tabla usuario_proveedor en lead-service). Fase 2 no destructiva:
    // se bloquean nuevas asignaciones a equipo, pero NO se vacían las membresías existentes (el
    // fallback por equipo de lead-service sigue protegiendo a quien aún no tiene proveedor asignado).
    private static final Set<String> ROLES_GESTIONADOS_POR_PROVEEDOR = Set.of(
            "ASESOR_BACKOFFICE", "SUPERVISOR_BACKOFFICE",
            "ASESOR_POSTVENTA", "SUPERVISOR_POSTVENTA"
    );

    private static final Set<String> ROLES_ASIGNABLES_PREVENTA = Set.of(
            "ASESOR_VENTAS",
            "SUPERVISOR_VENTAS",
            "OJT"
    );
    private static final String ROL_ASESOR_VENTAS = "ASESOR_VENTAS";

    @Override
    public EquipoResponse crear(EquipoRequest request) {
        String nombre = request.getNombre().trim();
        if (equipoRepository.existsByNombre(nombre)) {
            throw new ConflictException("Ya existe un equipo con el nombre: " + nombre);
        }
        Equipo equipo = equipoRepository.save(Equipo.builder()
                .nombre(nombre)
                .descripcion(request.getDescripcion())
                .color(normalizarColor(request.getColor()))
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
    @Transactional(readOnly = true)
    public List<EquipoResponse> listarMisEquipos() {
        if (tieneVisibilidadGlobalEquipos()) {
            return equipoRepository.findAll().stream()
                    .filter(equipo -> Boolean.TRUE.equals(equipo.getActivo()))
                    .map(Mapper::toEquipoResponse)
                    .toList();
        }
        return usuarioActual().getEquipos().stream()
                .filter(equipo -> Boolean.TRUE.equals(equipo.getActivo()))
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
        // Color: null = no se toca; cadena vacía = se limpia (vuelve a gris por defecto).
        if (request.getColor() != null) {
            equipo.setColor(normalizarColor(request.getColor()));
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
                        .equipoIds(usuario.getEquipos().stream().map(Equipo::getId).collect(Collectors.toSet()))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRolResponse> listarAsesoresPreventa(Long equipoId) {
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado", equipoId));
        if (!Boolean.TRUE.equals(equipo.getActivo())) {
            throw new BadRequestException("El equipo seleccionado no esta activo");
        }
        validarEquipoVisible(equipoId);

        return usuarioRepository.findDistinctByEquiposIdAndActivoTrue(equipoId).stream()
                .filter(usuario -> usuario.getRoles().stream()
                        .map(Rol::getNombre)
                        .anyMatch(ROLES_ASIGNABLES_PREVENTA::contains))
                .map(usuario -> UsuarioRolResponse.builder()
                        .empleadoId(usuario.getEmpleadoId())
                        .nombreCompleto(usuario.getNombreCompleto())
                        .roles(usuario.getRoles().stream().map(Rol::getNombre).collect(Collectors.toSet()))
                        .equipoIds(usuario.getEquipos().stream().map(Equipo::getId).collect(Collectors.toSet()))
                        .build())
                .toList();
    }

    // Normaliza el color de marca: cadena vacía/espacios -> null (sin color); en otro caso, hex en
    // mayúsculas. El formato ya fue validado en el DTO (@Pattern), aquí solo se estandariza.
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRolResponse> listarAsesoresVentasMerito(Long equipoId) {
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado", equipoId));
        if (!Boolean.TRUE.equals(equipo.getActivo())) {
            throw new BadRequestException("El equipo seleccionado no esta activo");
        }
        validarEquipoVisible(equipoId);

        return usuarioRepository.findByEquiposId(equipoId).stream()
                .filter(usuario -> usuario.getRoles().stream()
                        .map(Rol::getNombre)
                        .anyMatch(ROL_ASESOR_VENTAS::equals))
                .map(this::toUsuarioRolResponse)
                .toList();
    }

    private UsuarioRolResponse toUsuarioRolResponse(Usuario usuario) {
        return UsuarioRolResponse.builder()
                .empleadoId(usuario.getEmpleadoId())
                .nombreCompleto(usuario.getNombreCompleto())
                .roles(usuario.getRoles().stream().map(Rol::getNombre).collect(Collectors.toSet()))
                .equipoIds(usuario.getEquipos().stream().map(Equipo::getId).collect(Collectors.toSet()))
                .build();
    }

    private String normalizarColor(String color) {
        if (color == null || color.isBlank()) {
            return null;
        }
        return color.trim().toUpperCase();
    }

    private void validarMembresia(Usuario usuario, Set<Long> idsSolicitados) {
        Set<String> roles = usuario.getRoles().stream().map(Rol::getNombre).collect(Collectors.toSet());

        // Roles gestionados por proveedor: no se les asignan equipos. Si el usuario no tiene además un
        // rol de equipo (caso normal), se rechaza cualquier asignación a equipo. Quitar (set vacío) sí
        // se permite. No se tocan las membresías ya existentes: solo se bloquean asignaciones nuevas.
        boolean gestionadoPorProveedor = roles.stream().anyMatch(ROLES_GESTIONADOS_POR_PROVEEDOR::contains);
        boolean tieneRolDeEquipo = roles.stream().anyMatch(ROLES_OPERATIVOS::contains);
        if (gestionadoPorProveedor && !tieneRolDeEquipo && !idsSolicitados.isEmpty()) {
            throw new BadRequestException(
                    "Este rol se gestiona por proveedor, no por equipo");
        }

        // Un usuario queda limitado a un solo equipo si tiene algún rol operativo que NO admite
        // multi-equipo. Así un ASESOR_VENTAS "puro" puede pertenecer a varios equipos, pero si
        // además tuviera un rol operativo single-team (p. ej. GTR) prevalece la restricción a uno.
        boolean limitadoAUnEquipo = usuario.getRoles().stream()
                .map(Rol::getNombre)
                .anyMatch(rol -> ROLES_OPERATIVOS.contains(rol) && !ROLES_MULTIEQUIPO.contains(rol));

        // Se permite dejar sin equipo (quitar): el fail-closed del filtro lo protege (no ve nada).
        if (limitadoAUnEquipo && idsSolicitados.size() > 1) {
            throw new BadRequestException(
                    "Este rol solo puede pertenecer a un equipo a la vez");
        }
    }

    private void validarEquipoVisible(Long equipoId) {
        if (tieneVisibilidadGlobalEquipos()) {
            return;
        }
        boolean pertenece = usuarioActual().getEquipos().stream()
                .anyMatch(equipo -> equipo.getId().equals(equipoId));
        if (!pertenece) {
            throw new ForbiddenException("No tienes acceso a este equipo");
        }
    }

    private boolean tieneVisibilidadGlobalEquipos() {
        return usuarioActual().getRoles().stream().map(Rol::getNombre).anyMatch("ADMINISTRADOR"::equals)
                || usuarioActual().getRoles().stream()
                .flatMap(rol -> rol.getPermisos().stream())
                .anyMatch(permiso -> "VER_TODOS_LOS_EQUIPOS".equals(permiso.getNombre()));
    }

    private Usuario usuarioActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails detalles) {
            return detalles.getUsuario();
        }
        throw new ForbiddenException("No se pudo resolver el usuario actual");
    }
}
