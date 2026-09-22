package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.Response.EstadoAccesoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.request.ForgotPasswordRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.exception.ConflictException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.exception.UnprocessableEntityException;
import pe.albrugroup.auth_service.mapper.Mapper;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.security.CustomUserDetails;
import pe.albrugroup.auth_service.usecase.IUsuario;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UsuarioService implements IUsuario {

    private static final int PASSWORD_LENGTH = 10;
    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final SessionInvalidationService sessionInvalidationService;

    @Override
    public void upsertUsuario(RegistrarUsuarioRequest request) {
        usuarioRepository.findByEmpleadoId(request.getEmpleadoId())
                .ifPresentOrElse(
                        usuario -> actualizarIdentidad(usuario, request),
                        () -> registrarUsuario(request)
                );
    }

    private void registrarUsuario(RegistrarUsuarioRequest request) {
        String email = request.getEmail().trim();
        if (usuarioRepository.existsByEmail(email)) {
            throw new ConflictException("El email ya existe: " + email);
        }

        String username = usernameGenerator(request.getNombres(), request.getApellidos(), request.getDni());
        validarUsernameDisponible(username, null);
        String plainPassword = passwordGenerator();

        Usuario usuario = Usuario.builder()
                .username(username)
                .password(passwordEncoder.encode(plainPassword))
                .email(email)
                .empleadoId(request.getEmpleadoId())
                .dni(request.getDni().trim())
                .nombreCompleto(construirNombreCompleto(request.getNombres(), request.getApellidos()))
                .activo(true)
                .passwordInicializada(false)
                .roles(new HashSet<>())
                .rolPrincipal(null)
                .build();
        usuarioRepository.save(usuario);
        log.info("Identidad de usuario creada sin rol para empleado {}", request.getEmpleadoId());
    }

    private void actualizarIdentidad(Usuario usuario, RegistrarUsuarioRequest request) {
        String nuevoUsername = usernameGenerator(request.getNombres(), request.getApellidos(), request.getDni());
        String nuevoEmail = request.getEmail().trim();
        validarUsernameDisponible(nuevoUsername, usuario.getUsername());
        validarEmailDisponible(nuevoEmail, usuario.getEmail());

        boolean cambioUsername = !nuevoUsername.equalsIgnoreCase(usuario.getUsername());
        usuario.setUsername(nuevoUsername);
        usuario.setEmail(nuevoEmail);
        usuario.setDni(request.getDni().trim());
        usuario.setNombreCompleto(construirNombreCompleto(request.getNombres(), request.getApellidos()));
        Usuario guardado = usuarioRepository.save(usuario);
        if (cambioUsername) {
            invalidarSesiones(guardado, "cambio de username");
        }
    }

    @Override
    public CredencialesResponse resetPassword(Long empleadoId) {
        Usuario usuario = buscarPorEmpleado(empleadoId);
        String plainPassword = passwordGenerator();
        usuario.setPassword(passwordEncoder.encode(plainPassword));
        usuario.setPasswordInicializada(true);
        Usuario guardado = usuarioRepository.save(usuario);
        invalidarSesiones(guardado, "reset de password");
        return CredencialesResponse.builder().username(guardado.getUsername()).password(plainPassword).build();
    }

    @Override
    public CredencialesResponse forgotPassword(ForgotPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByUsernameAndEmailAndDni(
                        request.getUsername().trim(), request.getEmail().trim(), request.getDni().trim())
                .orElseThrow(() -> new NotFoundException("No se encontraron datos coincidentes para recuperar acceso"));
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new NotFoundException("No se encontraron datos coincidentes para recuperar acceso");
        }

        String plainPassword = passwordGenerator();
        usuario.setPassword(passwordEncoder.encode(plainPassword));
        usuario.setPasswordInicializada(true);
        Usuario guardado = usuarioRepository.save(usuario);
        invalidarSesiones(guardado, "recuperacion de password");
        return CredencialesResponse.builder().username(guardado.getUsername()).password(plainPassword).build();
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoAccesoResponse getEstadoAcceso(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username.trim())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return EstadoAccesoResponse.builder()
                .activo(usuario.getActivo())
                .passwordInicializada(usuario.getPasswordInicializada())
                .nombreCompleto(usuario.getNombreCompleto())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId) {
        return Mapper.toResponse(buscarPorEmpleado(empleadoId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRolResponse> listarUsuariosActivosPorRol(String rolNombre) {
        Set<Long> equiposDelSolicitante = equiposDelUsuarioActual();
        return usuarioRepository.findDistinctByRolesNombreAndActivoTrue(rolNombre.trim().toUpperCase())
                .stream()
                .filter(usuario -> equiposDelSolicitante.isEmpty()
                        || usuario.getEquipos().stream().anyMatch(e -> equiposDelSolicitante.contains(e.getId())))
                .map(usuario -> UsuarioRolResponse.builder()
                        .empleadoId(usuario.getEmpleadoId())
                        .nombreCompleto(usuario.getNombreCompleto())
                        .roles(usuario.getRoles().stream().map(Rol::getNombre).collect(java.util.stream.Collectors.toSet()))
                        .equipoIds(usuario.getEquipos().stream().map(Equipo::getId).collect(java.util.stream.Collectors.toSet()))
                        .build())
                .toList();
    }

    @Override
    public void deshabilitarUsuario(Long empleadoId) {
        Usuario usuario = buscarPorEmpleado(empleadoId);
        if (!Boolean.TRUE.equals(usuario.getActivo())) return;

        boolean esAdmin = usuario.getRoles().stream().anyMatch(rol -> ROL_ADMINISTRADOR.equals(rol.getNombre()));
        if (esAdmin && usuarioRepository.findActiveByRoleForUpdate(ROL_ADMINISTRADOR).size() <= 1) {
            throw new UnprocessableEntityException("No se puede deshabilitar al ultimo administrador activo");
        }
        usuario.setActivo(false);
        Usuario guardado = usuarioRepository.save(usuario);
        invalidarSesiones(guardado, "usuario deshabilitado");
    }

    private Usuario buscarPorEmpleado(Long empleadoId) {
        return usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));
    }

    private Set<Long> equiposDelUsuarioActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails detalles) {
            return detalles.getUsuario().getEquipos().stream()
                    .map(Equipo::getId)
                    .collect(java.util.stream.Collectors.toSet());
        }
        return Set.of();
    }

    private void invalidarSesiones(Usuario usuario, String motivo) {
        int tokensRevocados = refreshTokenService.revokeActiveTokens(usuario);
        sessionInvalidationService.invalidateAfterCommit(usuario.getEmpleadoId());
        log.info("Sesiones invalidadas para empleado {} por {} ({} refresh tokens)",
                usuario.getEmpleadoId(), motivo, tokensRevocados);
    }

    private void validarUsernameDisponible(String nuevoUsername, String usernameActual) {
        if (usuarioRepository.existsByUsername(nuevoUsername)
                && (usernameActual == null || !nuevoUsername.equalsIgnoreCase(usernameActual))) {
            throw new ConflictException("El username ya existe: " + nuevoUsername);
        }
    }

    private void validarEmailDisponible(String nuevoEmail, String emailActual) {
        if (usuarioRepository.existsByEmail(nuevoEmail) && !nuevoEmail.equalsIgnoreCase(emailActual)) {
            throw new ConflictException("El email ya existe: " + nuevoEmail);
        }
    }

    private String usernameGenerator(String nombres, String apellidos, String dni) {
        String first = nombres.trim().substring(0, 1).toUpperCase();
        String last = apellidos.trim().substring(0, 1).toUpperCase();
        return first + dni.trim() + last + "@albru.pe";
    }

    private String passwordGenerator() {
        String caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*-_";
        SecureRandom random = new SecureRandom();
        StringBuilder pass = new StringBuilder(PASSWORD_LENGTH);
        for (int i = 0; i < PASSWORD_LENGTH; i++) {
            pass.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return pass.toString();
    }

    private String construirNombreCompleto(String nombres, String apellidos) {
        return (nombres.trim() + " " + apellidos.trim()).trim();
    }
}
