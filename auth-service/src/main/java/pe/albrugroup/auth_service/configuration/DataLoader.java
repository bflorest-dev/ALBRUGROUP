package pe.albrugroup.auth_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.repository.PermisoRepository;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

import java.util.Set;

@Component @Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository  permisoRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void loadData() {
        log.info("=================================");
        log.info("🚀 INICIANDO CARGA DE DATOS INICIAL");

        crearPermisos();
        crearRoles();
        crearUsuariosIniciales();

        log.info("✅ DATOS CARGADOS");
        log.info("=================================");
    }

    private void crearPermisos() {
        log.info("🚀 Creando Permisos...");
        // POSTULANTES
        savePermiso("CREATE_POSTULANTE", "Puede registrar postulantes nuevos", "POSTULANTE", "CREATE");
        savePermiso("READ_POSTULANTE", "Puede listar y ver postulantes", "POSTULANTE", "READ");
        savePermiso("READ_RECLUTADO", "Puede listar y ver postulantes reclutados", "POSTULANTE", "READ");
        savePermiso("UPDATE_POSTULANTE", "Puede editar postulantes", "POSTULANTE", "UPDATE");
        savePermiso("EVALUATE_POSTULANTE_RECLUTAMIENTO", "Puede evaluar a los postulantes", "POSTULANTE", "EVALUATE");
        savePermiso("EVALUATE_POSTULANTE_CAPACITACION", "Puede evaluar a los postulantes", "POSTULANTE", "EVALUATE");
        // EMPLEADOS
        savePermiso("CREATE_EMPLEADO", "Puede registrar empleados directamente", "EMPLEADO", "CREATE");
        savePermiso("READ_EMPLEADO", "Puede ver empleados", "EMPLEADO", "READ");
        savePermiso("UPDATE_EMPLEADOS", "Puede editar empleados", "EMPLEADO", "UPDATE");
        savePermiso("BLACKLIST_EMPLEADO", "Puede marcar como lista negra a los postulantes", "POSTULANTE", "BLACKLIST");

        // TODO
        // CONTRATOS
        // PAGOS
        // LEADS

        log.info("✅ Permisos Creados");
    }
    private void savePermiso(String nombre, String descripcion, String recurso, String accion) {
        Permiso permiso = Permiso.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .recurso(recurso)
                .accion(accion)
                .build();
        permisoRepository.save(permiso);
    }

    private void crearRoles() {
        log.info("🚀 Creando Roles...");
        // RRHH
        Set<Permiso> rrhhPermisos = Set.of(
                getPermiso("CREATE_POSTULANTE"),
                getPermiso("READ_POSTULANTE"),
                getPermiso("READ_RECLUTADO"),
                getPermiso("UPDATE_POSTULANTE"),

                getPermiso("CREATE_EMPLEADO"),
                getPermiso("UPDATE_EMPLEADOS"),
                getPermiso("READ_EMPLEADOS"),
                getPermiso("BLACKLIST_EMPLEADO")
        );
        saveRol("RRHH", "Recursos Humanos - Gestion de personal", rrhhPermisos);
        // RECLUTADOR
        Set<Permiso> reclutadorPermisos = Set.of(
                getPermiso("READ_POSTULANTE"),
                getPermiso("UPDATE_POSTULANTE"),
                getPermiso("EVALUATE_POSTULANTE_RECLUTAMIENTO")
        );
        saveRol("RECLUTADOR", "Recursos Humanos - Contacto con postulantes", reclutadorPermisos);
        // CAPACITADOR
        Set<Permiso> capacitadorPermisos = Set.of(
                getPermiso("READ_POSTULANTE"),
                getPermiso("EVALUATE_POSTULANTE_CAPACITACION")
        );
        saveRol("CAPACITADOR", "Capacitacion - Gestion de postulantes", capacitadorPermisos);

        log.info("✅ Roles Creados");
    }
    private Permiso getPermiso(String nombre) {
        return permisoRepository.findByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Permiso no encontrado " + nombre));
    }
    private void saveRol(String nombre, String descripcion, Set<Permiso> permisos) {
        Rol rol = Rol.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .permisos(permisos)
                .build();
        rolRepository.save(rol);
    }

    private void crearUsuariosIniciales() {
        log.info("🚀 Creando Usuarios...");

        log.info("Creando Usuario RRHH INICIAL");
        Rol rrhhRol = rolRepository.findByNombre("RRHH")
                        .orElseThrow(() -> new RuntimeException("Rol RRHH no encontrado"));
        Usuario rrhhUsuario = Usuario.builder()
                .username("J75413802B@albru.recruiter.pe")
                .password(passwordEncoder.encode("123456"))
                .email("jevbxx@gmail.com")
                .empleadoId(1L)
                .activo(true)
                .roles(Set.of(rrhhRol))
                .build();
        usuarioRepository.save(rrhhUsuario);

        log.info("══════════════════════════════════════════════════════");
        log.info("✓ Usuario RRHH creado:");
        log.info("  Username: J75413802B@albru.recruiter.pe");
        log.info("  Password: 123456");
        log.info("  Email: jevbxx@gmail.com");
        log.info("  EmpleadoId: 1");
        log.info("  Roles: [RRHH]");
        log.info("═══════════════════════════════════════════════════════");

        log.info("✅ Usuarios Creados");
    }
}
