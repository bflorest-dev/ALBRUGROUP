package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.Response.AccesoUsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.RolAuditoriaResponse;
import pe.albrugroup.auth_service.entity.Response.RolResponse;
import pe.albrugroup.auth_service.entity.Response.RolesUsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.TokenRefreshResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.UsuarioRolAuditoria;
import pe.albrugroup.auth_service.entity.request.AsignarRolesRequest;
import pe.albrugroup.auth_service.entity.request.CambiarRolActivoRequest;
import pe.albrugroup.auth_service.exception.BadRequestException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.exception.UnprocessableEntityException;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.repository.UsuarioRolAuditoriaRepository;
import pe.albrugroup.auth_service.security.CustomUserDetails;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RolService {

    private static final String ADMINISTRADOR = "ADMINISTRADOR";

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolAuditoriaRepository auditoriaRepository;
    private final RefreshTokenService refreshTokenService;
    private final SessionInvalidationService sessionInvalidationService;
    private final EquipoService equipoService;

    @Transactional(readOnly = true)
    public List<RolResponse> catalogo() {
        return rolRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
                .map(rol -> new RolResponse(rol.getNombre(), rol.getDescripcion()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AccesoUsuarioResponse> listarUsuarios(
            String buscar, Boolean activo, String rol, Boolean sinRol, int page, int size) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        String criterio = normalizarOpcional(buscar);
        if (criterio == null) criterio = "";
        Long empleadoId = parseLongOrNull(criterio);
        String rolNormalizado = normalizarOpcional(rol);
        if (rolNormalizado != null) rolNormalizado = rolNormalizado.toUpperCase(Locale.ROOT);
        return usuarioRepository.buscarAccesos(
                        criterio, empleadoId, activo, rolNormalizado, sinRol,
                        PageRequest.of(Math.max(page, 0), pageSize, Sort.by("nombreCompleto").ascending()))
                .map(this::toAccesoResponse);
    }

    @Transactional(readOnly = true)
    public RolesUsuarioResponse obtenerRoles(Long empleadoId) {
        return toRolesResponse(buscarUsuario(empleadoId));
    }

    public RolesUsuarioResponse asignarRoles(Long empleadoId, AsignarRolesRequest request) {
        Usuario usuario = buscarUsuario(empleadoId);
        String principalNombre = normalizarRol(request.getRolPrincipal());
        List<String> secundariosEntrada = request.getRolesSecundarios() == null
                ? List.of()
                : request.getRolesSecundarios().stream().map(this::normalizarRol).toList();

        if (new LinkedHashSet<>(secundariosEntrada).size() != secundariosEntrada.size()) {
            throw new BadRequestException("No se permiten roles secundarios duplicados");
        }
        if (secundariosEntrada.contains(principalNombre)) {
            throw new BadRequestException("El rol principal no puede repetirse como secundario");
        }

        LinkedHashSet<String> nombresSolicitados = new LinkedHashSet<>();
        nombresSolicitados.add(principalNombre);
        nombresSolicitados.addAll(secundariosEntrada);
        List<Rol> rolesEncontrados = rolRepository.findAllByNombreIn(nombresSolicitados);
        Set<String> nombresEncontrados = rolesEncontrados.stream().map(Rol::getNombre).collect(Collectors.toSet());
        if (!nombresEncontrados.equals(nombresSolicitados)) {
            Set<String> faltantes = new LinkedHashSet<>(nombresSolicitados);
            faltantes.removeAll(nombresEncontrados);
            throw new NotFoundException("Roles no encontrados: " + faltantes);
        }

        Rol nuevoPrincipal = rolesEncontrados.stream()
                .filter(rol -> principalNombre.equals(rol.getNombre()))
                .findFirst()
                .orElseThrow();
        Set<Rol> nuevosRoles = new LinkedHashSet<>(rolesEncontrados);
        equipoService.validarRolesCompatibles(nuevosRoles, usuario.getEquipos());

        Set<String> anteriores = nombresRoles(usuario);
        String principalAnterior = usuario.getRolPrincipal() == null ? null : usuario.getRolPrincipal().getNombre();
        if (anteriores.equals(nombresSolicitados) && principalNombre.equals(principalAnterior)) {
            return toRolesResponse(usuario);
        }

        validarUltimoAdministrador(usuario, anteriores, nombresSolicitados);
        Usuario actor = usuarioActual();
        usuario.setRoles(nuevosRoles);
        usuario.setRolPrincipal(nuevoPrincipal);
        Usuario guardado = usuarioRepository.saveAndFlush(usuario);

        auditoriaRepository.save(UsuarioRolAuditoria.builder()
                .usuario(guardado)
                .empleadoId(guardado.getEmpleadoId())
                .actorEmpleadoId(actor.getEmpleadoId())
                .actorUsername(actor.getUsername())
                .rolPrincipalAnterior(principalAnterior)
                .rolPrincipalNuevo(principalNombre)
                .rolesAnteriores(serializar(anteriores))
                .rolesNuevos(serializar(nombresSolicitados))
                .build());

        int tokensRevocados = refreshTokenService.revokeActiveTokens(guardado);
        sessionInvalidationService.invalidateAfterCommit(guardado.getEmpleadoId());
        log.info("Roles actualizados para empleado {} por {}: {} ({} refresh tokens revocados)",
                empleadoId, actor.getEmpleadoId(), nombresSolicitados, tokensRevocados);
        return toRolesResponse(guardado);
    }

    @Transactional(readOnly = true)
    public Page<RolAuditoriaResponse> historial(Long empleadoId, int page, int size) {
        buscarUsuario(empleadoId);
        return auditoriaRepository.findByEmpleadoIdOrderByCreatedAtDesc(
                        empleadoId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)))
                .map(item -> new RolAuditoriaResponse(
                        item.getId(), item.getEmpleadoId(), item.getActorEmpleadoId(), item.getActorUsername(),
                        item.getRolPrincipalAnterior(), item.getRolPrincipalNuevo(),
                        deserializar(item.getRolesAnteriores()), deserializar(item.getRolesNuevos()),
                        item.getCreatedAt()));
    }

    public TokenRefreshResponse cambiarRolActivo(CambiarRolActivoRequest request) {
        Usuario usuario = usuarioActual();
        String nombreRol = normalizarRol(request.getRolActivo());
        Rol rol = usuario.getRoles().stream()
                .filter(asignado -> nombreRol.equals(asignado.getNombre()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("El rol solicitado no esta asignado al usuario"));
        RefreshTokenService.TokenPair tokens = refreshTokenService.switchActiveRole(
                request.getRefreshToken(), usuario.getEmpleadoId(), rol);
        return toTokenResponse(tokens);
    }

    public TokenRefreshResponse toTokenResponse(RefreshTokenService.TokenPair tokens) {
        Usuario usuario = tokens.usuario();
        return TokenRefreshResponse.builder()
                .token(tokens.accessToken())
                .refreshToken(tokens.refreshToken())
                .type("Bearer")
                .expiresIn(tokens.expiresIn())
                .rolesAsignados(nombresRoles(usuario).stream().sorted().toList())
                .rolPrincipal(usuario.getRolPrincipal().getNombre())
                .rolActivo(tokens.rolActivo().getNombre())
                .build();
    }

    private void validarUltimoAdministrador(Usuario usuario, Set<String> anteriores, Set<String> nuevos) {
        if (Boolean.TRUE.equals(usuario.getActivo())
                && anteriores.contains(ADMINISTRADOR)
                && !nuevos.contains(ADMINISTRADOR)
                && usuarioRepository.findActiveByRoleForUpdate(ADMINISTRADOR).size() <= 1) {
            throw new UnprocessableEntityException("No se puede retirar el rol al ultimo administrador activo");
        }
    }

    private AccesoUsuarioResponse toAccesoResponse(Usuario usuario) {
        RolesUsuarioResponse roles = toRolesResponse(usuario);
        return new AccesoUsuarioResponse(
                usuario.getEmpleadoId(), usuario.getDni(), usuario.getNombreCompleto(), usuario.getUsername(),
                usuario.getEmail(), usuario.getActivo(), roles.rolPrincipal(),
                roles.rolesSecundarios(), roles.rolesAsignados());
    }

    private RolesUsuarioResponse toRolesResponse(Usuario usuario) {
        Set<String> asignados = nombresRoles(usuario);
        String principal = usuario.getRolPrincipal() == null ? null : usuario.getRolPrincipal().getNombre();
        Set<String> secundarios = asignados.stream()
                .filter(rol -> !rol.equals(principal))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return new RolesUsuarioResponse(usuario.getEmpleadoId(), principal, secundarios, asignados);
    }

    private Set<String> nombresRoles(Usuario usuario) {
        return usuario.getRoles().stream()
                .map(Rol::getNombre)
                .sorted()
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Usuario buscarUsuario(Long empleadoId) {
        return usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));
    }

    private Usuario usuarioActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails detalles) {
            return detalles.getUsuario();
        }
        throw new BadRequestException("No se pudo resolver el usuario autenticado");
    }

    private String normalizarRol(String nombre) {
        if (nombre == null || nombre.isBlank()) throw new BadRequestException("El rol no puede estar vacio");
        return nombre.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private Long parseLongOrNull(String valor) {
        if (valor == null || !valor.matches("\\d+")) return null;
        try {
            return Long.parseLong(valor);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String serializar(Set<String> roles) {
        return roles.stream().sorted().collect(Collectors.joining(","));
    }

    private Set<String> deserializar(String roles) {
        if (roles == null || roles.isBlank()) return Set.of();
        return new LinkedHashSet<>(new ArrayList<>(List.of(roles.split(","))));
    }
}
