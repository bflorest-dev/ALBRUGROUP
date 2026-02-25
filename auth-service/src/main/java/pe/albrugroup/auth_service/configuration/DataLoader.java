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

import java.util.HashSet;
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
        savePermiso("CREATE_POSTULANTES", "Puede registrar postulantes nuevos", "POSTULANTE", "CREATE");
        savePermiso("UPDATE_POSTULANTES", "Puede editar y actualizar postulantes", "POSTULANTE", "UPDATE");
        savePermiso("READ_POSTULANTES", "Puede listar y ver postulantes", "POSTULANTE", "READ");
        savePermiso("TYPIFY_POSTULANTES", "Puede tipificar postulantes", "POSTULANTE", "TYPIFY");

        savePermiso("READ_RECLUTADOS", "Puede listar y ver postulantes reclutados", "POSTULANTE", "READ");
        savePermiso("TYPIFY_RECLUTADOS", "Puede tipificar postulantes reclutados", "POSTULANTE", "TYPIFY");
        savePermiso("EVALUATE_POSTULANTES_RECLUTAMIENTO", "Puede evaluar y tipificar a los postulantes reclutados", "POSTULANTE", "EVALUATE");

        savePermiso("READ_CAPACITADOS", "Puede listar y ver postulantes capacitados", "POSTULANTE", "READ");
        savePermiso("EVALUATE_POSTULANTES_CAPACITACION", "Puede evaluar y tipificar a los reclutados", "POSTULANTE", "EVALUATE");
        // EMPLEADOS
        savePermiso("CREATE_EMPLEADOS", "Puede registrar empleados directamente", "EMPLEADO", "CREATE");
        savePermiso("READ_EMPLEADOS", "Puede listar y ver empleados", "EMPLEADO", "READ");
        savePermiso("UPDATE_EMPLEADOS", "Puede editar empleados", "EMPLEADO", "UPDATE");
        savePermiso("BLACKLIST_EMPLEADOS", "Puede marcar como lista negra a los empleados", "EMPLEADO", "BLACKLIST");
        // CONTRATOS
        savePermiso("CREATE_CONTRATOS", "Puede registrar contratos", "CONTRATO", "CREATE");
        savePermiso("UPDATE_CONTRATOS", "Puede editar contratos", "CONTRATO", "UPDATE");
        savePermiso("READ_CONTRATOS", "Puede listar y ver contratos", "CONTRATO", "READ");
        savePermiso("CANCEL_CONTRATOS", "Puede dar de baja contratos", "CONTRATO", "CANCEL");
        // PAGOS
        savePermiso("CREATE_PAGOS", "Puede registrar pagos a los empleados", "PAGO", "CREATE");
        savePermiso("UPDATE_PAGOS", "Puede actualizar informacion de pagos", "PAGO", "UPDATE");
        savePermiso("READ_PAGOS", "Puede listar y ver informacion de pagos", "PAGO", "READ");
        // EVENTOS en RRHH-SERVICE
        savePermiso("READ_EVENTOS", "Puede ver el historico de eventos", "ENTIDAD", "READ");

        // TODO
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

        // ADMINISTRADOR
        Set<Permiso> adminPermisos = new HashSet<>(permisoRepository.findAll());
        saveRol("ADMINISTRADOR", "Gestion completa de Administracion", adminPermisos);

        // RRHH
        Set<Permiso> rrhhPermisos = Set.of(
                getPermiso("CREATE_POSTULANTES"),
                getPermiso("UPDATE_POSTULANTES"),
                getPermiso("READ_POSTULANTES"),
                getPermiso("READ_RECLUTADOS"),
                getPermiso("READ_CAPACITADOS"),

                getPermiso("CREATE_EMPLEADOS"),
                getPermiso("READ_EMPLEADOS"),
                getPermiso("UPDATE_EMPLEADOS"),
                getPermiso("BLACKLIST_EMPLEADOS"),

                getPermiso("CREATE_CONTRATOS"),
                getPermiso("UPDATE_CONTRATOS"),
                getPermiso("READ_CONTRATOS"),
                getPermiso("CANCEL_CONTRATOS")
        );
        saveRol("RRHH", "Recursos Humanos - Gestion de personal", rrhhPermisos);

        // RECLUTADOR
        Set<Permiso> reclutadorPermisos = Set.of(
                getPermiso("READ_POSTULANTES"),
                getPermiso("TYPIFY_POSTULANTES"),
                getPermiso("EVALUATE_POSTULANTES_RECLUTAMIENTO"),
                getPermiso("READ_RECLUTADOS")
        );
        saveRol("RECLUTADOR", "Recursos Humanos - Contacto con postulantes", reclutadorPermisos);

        // CAPACITADOR
        Set<Permiso> capacitadorPermisos = Set.of(
                getPermiso("READ_RECLUTADOS"),
                getPermiso("TYPIFY_RECLUTADOS"),
                getPermiso("EVALUATE_POSTULANTES_CAPACITACION"),
                getPermiso("READ_CAPACITADOS")
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

        log.info("Creando Usuario ADMINISTRADOR INICIAL");
        Rol adminRol = rolRepository.findByNombre("ADMINISTRADOR")
                        .orElseThrow(() -> new RuntimeException("Rol ADMINISTRADOR no encontrado"));
        Usuario adminUsuario = Usuario.builder()
                .username("admin@albru.admin.pe")
                .password(passwordEncoder.encode("123456"))
                .email("jevbxx@gmail.com")
                .empleadoId(1L)
                .activo(true)
                .roles(Set.of(adminRol))
                .build();
        usuarioRepository.save(adminUsuario);

        log.info("══════════════════════════════════════════════════════");
        log.info("✓ Usuario ADMINISTRADOR creado:");
        log.info("  Username: J75413802B@albru.recruiter.pe");
        log.info("  Password: 123456");
        log.info("  Email: jevbxx@gmail.com");
        log.info("  EmpleadoId: 1");
        log.info("  Roles: [ADMINISTRADOR]");
        log.info("═══════════════════════════════════════════════════════");

        log.info("✅ Usuarios Creados");
    }
}
