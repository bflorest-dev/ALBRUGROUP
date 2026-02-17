package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.mapper.Mapper;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;
import pe.albrugroup.auth_service.usecase.IUsuario;

import java.security.SecureRandom;
import java.util.Set;

@Service @Slf4j
@RequiredArgsConstructor @Transactional
public class UsuarioService implements IUsuario {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int PASSWORD_LENGTH = 10;

    @Override
    public UsuarioResponse registrarUsuario(RegistrarUsuarioRequest request) {
        log.info("Registrando nuevo usuario: DNI[{}]", request.getDni());

        if(usuarioRepository.existsByEmail(request.getEmail())) {
            log.error("El email ya existe: {}", request.getEmail());
            throw new RuntimeException("❌ El email ya existe: " +  request.getEmail());
        }

        PuestoTrabajo puestoTrabajo = request.getPuestoTrabajo();
        Rol rol = rolRepository.findByNombre(puestoTrabajo.name())
                .orElseThrow(() -> {
                    log.error("El rol no existe: {}", puestoTrabajo.name());
                    return new RuntimeException("❌ El rol no existe: " + puestoTrabajo.name());
                });
        log.info("Rol asignado: {}", rol.getNombre());

        Usuario usuario = Usuario.builder()
                .username(usernameGenerator(
                        request.getNombres(),
                        request.getApellidos(),
                        request.getDni(),
                        puestoTrabajo))
                .password(passwordEncoder.encode(passwordGenerator()))
                .email(request.getEmail())
                .empleadoId(request.getEmpleadoId())
                .activo(true)
                .roles(Set.of(rol))
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Usuario registrado: {} (ID: {})", guardado.getUsername(), guardado.getId());
        log.info("Rol asignado: {}", rol.getNombre());
        return Mapper.toResponse(guardado);
    }
    private String usernameGenerator(String nombres, String apellidos, String dni, PuestoTrabajo puesto) {
        String first = nombres.substring(0, 1).toUpperCase();
        String last = apellidos.substring(0, 1).toUpperCase();
        String cargoIngles = puesto.getEnglishName();

        return first + dni + last + "@albru."+ cargoIngles + ".pe";
    }
    private String passwordGenerator() {
        String caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ" + "abcdefghijkmnopqrstuvwxyz" + "23456789" + "@#$%&*-_";
        SecureRandom random = new SecureRandom();

        StringBuilder pass = new StringBuilder(UsuarioService.PASSWORD_LENGTH);
        for(int i = 0; i < UsuarioService.PASSWORD_LENGTH; i++) {
            pass.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return pass.toString();
    }
    @Override
    public UsuarioResponse actualizarRolesUsuario(Long usuarioId, PuestoTrabajo puesto) {
        log.info("Actualizando roles del usuario ID: {}", usuarioId);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Rol rol = rolRepository.findByNombre(puesto.name())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + puesto.name()));
        usuario.setRoles(Set.of(rol));
        log.info("Rol actualizado para el usuario: {}|{}", usuario.getUsername(), rol.getNombre());
        return Mapper.toResponse(usuario);
    }
    @Override
    public UsuarioResponse getUsuarioPorEmpleadoID(Long empleadoId) {
        log.info("Buscando usuario por EmpleadoID: {}", empleadoId);
        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado por EmpleadoID: " + empleadoId));
        return Mapper.toResponse(usuario);
    }
    @Override
    public void deshabilitarUsuario(Long empleadoId) {
        log.info("Deshabilitando Empleado ID: {}", empleadoId);
        Usuario usuario = usuarioRepository.findByEmpleadoId(empleadoId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + empleadoId));
        if(!usuario.getActivo()) { log.warn("El usuario ya se encuentra deshabilitado"); return; }
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        log.info("Usuario deshabilitado: {}", usuario.getUsername());
    }
}
