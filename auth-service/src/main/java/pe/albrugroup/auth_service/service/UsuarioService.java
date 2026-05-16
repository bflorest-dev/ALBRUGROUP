package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.Response.EstadoAccesoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.ActualizarCredencialesRequest;
import pe.albrugroup.auth_service.entity.request.ForgotPasswordRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.exception.BadRequestException;
import pe.albrugroup.auth_service.exception.ConflictException;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.mapper.Mapper;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
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

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int PASSWORD_LENGTH = 10;

    @Override
    public void upsertUsuario(RegistrarUsuarioRequest request) {
        usuarioRepository.findByEmpleadoId(request.getEmpleadoId())
                .ifPresentOrElse(
                        usuario -> actualizarUsuarioExistente(usuario, request),
                        () -> registrarUsuarioInternal(request)
                );
    }

    @Override
    public UsuarioResponse actualizarUsernameRoles(Long empleadoId, ActualizarCredencialesRequest request) {
        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));

        PuestoTrabajo puestoTrabajo = request.getPuestoTrabajo();
        Rol rol = obtenerRol(puestoTrabajo);

        String nuevoUsername = usernameGenerator(
                request.getNombres(),
                request.getApellidos(),
                request.getDni(),
                puestoTrabajo
        );

        validarUsernameDisponible(nuevoUsername, usuario.getUsername());

        usuario.setUsername(nuevoUsername);
        usuario.setDni(request.getDni().trim());
        usuario.setNombreCompleto(construirNombreCompleto(request.getNombres(), request.getApellidos()));
        usuario.setRoles(new HashSet<>(Set.of(rol)));
        Usuario guardado = usuarioRepository.save(usuario);
        return Mapper.toResponse(guardado);
    }

    @Override
    public CredencialesResponse resetPassword(Long empleadoId) {
        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));
        String plainPassword = passwordGenerator();
        usuario.setPassword(passwordEncoder.encode(plainPassword));
        usuario.setPasswordInicializada(true);
        Usuario guardado = usuarioRepository.save(usuario);
        return CredencialesResponse.builder()
                .username(guardado.getUsername())
                .password(plainPassword)
                .build();
    }

    @Override
    public CredencialesResponse forgotPassword(ForgotPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByUsernameAndEmailAndDni(
                        request.getUsername().trim(),
                        request.getEmail().trim(),
                        request.getDni().trim()
                )
                .orElseThrow(() -> new NotFoundException("No se encontraron datos coincidentes para recuperar acceso"));

        if (!usuario.getActivo()) {
            throw new NotFoundException("No se encontraron datos coincidentes para recuperar acceso");
        }

        String plainPassword = passwordGenerator();
        usuario.setPassword(passwordEncoder.encode(plainPassword));
        usuario.setPasswordInicializada(true);
        Usuario guardado = usuarioRepository.save(usuario);
        return CredencialesResponse.builder()
                .username(guardado.getUsername())
                .password(plainPassword)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EstadoAccesoResponse getEstadoAcceso(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username.trim())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return EstadoAccesoResponse.builder()
                .activo(usuario.getActivo())
                .passwordInicializada(usuario.getPasswordInicializada())
                .build();
    }

    private RegistroUsuarioResult registrarUsuarioInternal(RegistrarUsuarioRequest request) {
        log.info("Registrando nuevo usuario: DNI[{}]", request.getDni());

        if (usuarioRepository.existsByEmail(request.getEmail())) {
            log.error("El email ya existe: {}", request.getEmail());
            throw new ConflictException("El email ya existe: " + request.getEmail());
        }

        PuestoTrabajo puestoTrabajo = request.getPuestoTrabajo();
        Rol rol = obtenerRol(puestoTrabajo);
        log.info("Rol asignado: {}", rol.getNombre());

        String plainPassword = passwordGenerator();
        Usuario usuario = Usuario.builder()
                .username(usernameGenerator(
                        request.getNombres(),
                        request.getApellidos(),
                        request.getDni(),
                        puestoTrabajo))
                .password(passwordEncoder.encode(plainPassword))
                .email(request.getEmail())
                .empleadoId(request.getEmpleadoId())
                .dni(request.getDni().trim())
                .nombreCompleto(construirNombreCompleto(request.getNombres(), request.getApellidos()))
                .activo(true)
                .passwordInicializada(false)
                .roles(new HashSet<>(Set.of(rol)))
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Usuario registrado: {} (ID: {})", guardado.getUsername(), guardado.getId());
        log.info("Rol asignado: {}", rol.getNombre());

        return new RegistroUsuarioResult(guardado, plainPassword);
    }

    private void actualizarUsuarioExistente(Usuario usuario, RegistrarUsuarioRequest request) {
        PuestoTrabajo puestoTrabajo = request.getPuestoTrabajo();
        Rol rol = obtenerRol(puestoTrabajo);

        String nuevoUsername = usernameGenerator(
                request.getNombres(),
                request.getApellidos(),
                request.getDni(),
                puestoTrabajo
        );

        validarUsernameDisponible(nuevoUsername, usuario.getUsername());
        validarEmailDisponible(request.getEmail(), usuario.getEmail());

        usuario.setUsername(nuevoUsername);
        usuario.setEmail(request.getEmail().trim());
        usuario.setDni(request.getDni().trim());
        usuario.setNombreCompleto(construirNombreCompleto(request.getNombres(), request.getApellidos()));
        usuario.setActivo(true);
        usuario.setRoles(new HashSet<>(Set.of(rol)));
        usuarioRepository.save(usuario);
    }

    private Rol obtenerRol(PuestoTrabajo puestoTrabajo) {
        if (puestoTrabajo == null) {
            throw new BadRequestException("Falta Puesto de Trabajo");
        }
        return rolRepository.findByNombre(puestoTrabajo.name())
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + puestoTrabajo.name()));
    }

    private void validarUsernameDisponible(String nuevoUsername, String usernameActual) {
        if (usuarioRepository.existsByUsername(nuevoUsername)
                && !nuevoUsername.equalsIgnoreCase(usernameActual)) {
            throw new ConflictException("El username ya existe: " + nuevoUsername);
        }
    }

    private void validarEmailDisponible(String nuevoEmail, String emailActual) {
        if (usuarioRepository.existsByEmail(nuevoEmail)
                && !nuevoEmail.equalsIgnoreCase(emailActual)) {
            throw new ConflictException("El email ya existe: " + nuevoEmail);
        }
    }

    private String usernameGenerator(String nombres, String apellidos, String dni, PuestoTrabajo puesto) {
        String first = nombres.trim().substring(0, 1).toUpperCase();
        String last = apellidos.trim().substring(0, 1).toUpperCase();
        String cargoIngles = puesto.getEnglishName();

        return first + dni + last + "@albru." + cargoIngles + ".pe";
    }

    private String passwordGenerator() {
        String caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ" + "abcdefghijkmnopqrstuvwxyz" + "23456789" + "@#$%&*-_";
        SecureRandom random = new SecureRandom();

        StringBuilder pass = new StringBuilder(UsuarioService.PASSWORD_LENGTH);
        for (int i = 0; i < UsuarioService.PASSWORD_LENGTH; i++) {
            pass.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return pass.toString();
    }

    private String construirNombreCompleto(String nombres, String apellidos) {
        String nombresLimpios = nombres == null ? "" : nombres.trim();
        String apellidosLimpios = apellidos == null ? "" : apellidos.trim();
        return (nombresLimpios + " " + apellidosLimpios).trim();
    }

    @Override
    public UsuarioResponse actualizarRolesUsuario(Long empleadoId, PuestoTrabajo puesto) {
        log.info("Actualizando roles del usuario ID: {}", empleadoId);

        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado", empleadoId));
        Rol rol = obtenerRol(puesto);
        usuario.setRoles(new HashSet<>(Set.of(rol)));

        log.info("Rol actualizado para el usuario: {}|{}", usuario.getUsername(), rol.getNombre());
        return Mapper.toResponse(usuario);
    }

    @Override
    public UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId) {
        log.info("Buscando usuario por EmpleadoID: {}", empleadoId);

        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado por EmpleadoID", empleadoId));
        return Mapper.toResponse(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRolResponse> listarUsuariosActivosPorRol(PuestoTrabajo puestoTrabajo) {
        return usuarioRepository.findDistinctByRolesNombreAndActivoTrue(puestoTrabajo.name())
                .stream()
                .map(usuario -> UsuarioRolResponse.builder()
                        .empleadoId(usuario.getEmpleadoId())
                        .nombreCompleto(usuario.getNombreCompleto())
                        .roles(usuario.getRoles().stream().map(Rol::getNombre).collect(java.util.stream.Collectors.toSet()))
                        .build())
                .toList();
    }

    @Override
    public void deshabilitarUsuario(Long empleadoId) {
        log.info("Deshabilitando Empleado ID: {}", empleadoId);

        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado", empleadoId));
        if (!usuario.getActivo()) {
            log.warn("El usuario ya se encuentra deshabilitado");
            return;
        }
        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        log.info("Usuario deshabilitado: {}", usuario.getUsername());
    }

    private record RegistroUsuarioResult(Usuario usuario, String plainPassword) {}
}
