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
        savePermiso("REJECT_POSTULANTE_INASISTENCIA", "Puede rechazar a un postulante por inasistencia",  "POSTULANTE", "REJECT");
        // EMPLEADOS
        savePermiso("CREATE_EMPLEADOS", "Puede registrar empleados directamente", "EMPLEADO", "CREATE");
        savePermiso("READ_EMPLEADOS", "Puede listar y ver empleados", "EMPLEADO", "READ");
        savePermiso("UPDATE_EMPLEADOS", "Puede editar empleados", "EMPLEADO", "UPDATE");
        savePermiso("BLACKLIST_EMPLEADOS", "Puede marcar como lista negra a los empleados", "EMPLEADO", "BLACKLIST");
        savePermiso("CREATE_CONTRATISTA", "Puede registrar empresas contratistas", "EMPRESA_CONTRATISTA", "CREATE");
        savePermiso("READ_CONTRATISTAS", "Puede listar y ver empresas contratistas", "EMPRESA_CONTRATISTA", "READ");
        savePermiso("DELETE_CONTRATISTA", "Puede desactivar empresas contratistas", "EMPRESA_CONTRATISTA", "DELETE");
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

        // LEADS
        savePermiso("CREATE_CUENTA_PUBLICITARIA", "Puede registrar cuentas publicitarias", "CUENTA_PUBLICITARIA", "CREATE");
        savePermiso("READ_CUENTAS_PUBLICITARIAS", "Puede listar y ver cuentas publicitarias", "CUENTA_PUBLICITARIA", "READ");
        savePermiso("DELETE_CUENTA_PUBLICITARIA", "Puede desactivar cuentas publicitarias", "CUENTA_PUBLICITARIA", "DELETE");

        savePermiso("CREATE_CAMPANA", "Puede registrar campanas", "CAMPANA", "CREATE");
        savePermiso("READ_CAMPANA", "Puede listar y ver campanas", "CAMPANA", "READ");
        savePermiso("UPDATE_CAMPANA", "Puede actualizar campanas", "CAMPANA", "UPDATE");
        savePermiso("DELETE_CAMPANA", "Puede desactivar campanas", "CAMPANA", "DELETE");

        savePermiso("CREATE_PROVEEDORES", "Puede registrar proveedores", "PROVEEDOR", "CREATE");
        savePermiso("UPDATE_PROVEEDORES", "Puede actualizar el estado de proveedores", "PROVEEDOR", "UPDATE");

        savePermiso("CREATE_ZONAS", "Puede registrar zonas", "ZONA", "CREATE");
        savePermiso("READ_ZONAS", "Puede listar y ver zonas", "ZONA", "READ");
        savePermiso("UPDATE_ZONAS", "Puede actualizar zonas", "ZONA", "UPDATE");

        savePermiso("READ_UBIGEO", "Puede consultar ubigeo", "UBIGEO", "READ");

        savePermiso("CREATE_PLANES", "Puede registrar planes", "PLAN", "CREATE");
        savePermiso("READ_PLANES", "Puede listar y ver planes", "PLAN", "READ");
        savePermiso("UPDATE_PLANES", "Puede actualizar planes", "PLAN", "UPDATE");
        savePermiso("DELETE_PLANES", "Puede desactivar planes", "PLAN", "DELETE");

        savePermiso("CREATE_ADICIONALES", "Puede registrar adicionales", "ADICIONAL", "CREATE");
        savePermiso("READ_ADICIONALES", "Puede listar y ver adicionales", "ADICIONAL", "READ");

        savePermiso("CREATE_PROMOCIONES", "Puede registrar promociones", "PROMOCION", "CREATE");
        savePermiso("READ_PROMOCIONES", "Puede listar y ver promociones", "PROMOCION", "READ");
        savePermiso("DELETE_PROMOCIONES", "Puede desactivar promociones", "PROMOCION", "DELETE");

        savePermiso("READ_TIPIFICACIONES", "Puede consultar catalogos de tipificacion", "TIPIFICACION", "READ");
        savePermiso("UPDATE_TIPIFICACIONES", "Puede actualizar catalogos de tipificacion", "TIPIFICACION", "UPDATE");

        savePermiso("CREATE_LEADS", "Puede registrar ingresos de leads", "LEAD", "CREATE");
        savePermiso("ASSIGN_LEADS", "Puede asignar leads", "LEAD", "ASSIGN");
        savePermiso("READ_LEADS_ASESOR", "Puede ver bandeja y detalle de leads del asesor", "LEAD", "READ");
        savePermiso("UPDATE_LEADS_ASESOR", "Puede actualizar datos de gestion del lead", "LEAD", "UPDATE");
        savePermiso("TYPIFY_LEADS", "Puede tipificar leads", "LEAD", "TYPIFY");
        savePermiso("CONTACT_LEADS", "Puede registrar contacto de leads", "LEAD", "CONTACT");
        savePermiso("READ_LEADS_GTR", "Puede ver bandeja de leads para GTR", "LEAD", "READ");

        savePermiso("READ_EVENTOS_LEADS", "Puede ver el historico de eventos de leads", "EVENTO_LEAD", "READ");

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
                getPermiso("REJECT_POSTULANTE_INASISTENCIA"),
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

        // GTR
        Set<Permiso> asesorGtrPermisos = Set.of(
                getPermiso("READ_LEADS_GTR"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_CAMPANA")
        );
        saveRol("ASESOR_GTR", "GTR - Asignacion y seguimiento de leads", asesorGtrPermisos);

        Set<Permiso> supervisorGtrPermisos = Set.of(
                getPermiso("READ_LEADS_GTR"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_CAMPANA")
        );
        saveRol("SUPERVISOR_GTR", "GTR - Supervision de asignacion de leads", supervisorGtrPermisos);

        // ASESOR_VENTAS
        Set<Permiso> asesorVentasPermisos = Set.of(
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_TIPIFICACIONES"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_UBIGEO")
        );
        saveRol("ASESOR_VENTAS", "Ventas - Gestion de leads asignados", asesorVentasPermisos);

        // SUPERVISOR_VENTAS
        Set<Permiso> supervisorVentasPermisos = Set.of(
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_TIPIFICACIONES"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_UBIGEO")
        );
        saveRol("SUPERVISOR_VENTAS", "Ventas - Supervision de leads asignados", supervisorVentasPermisos);

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
                .empleadoId(0L)
                .dni("00000000")
                .nombreCompleto("Edinson Vitterio")
                .activo(true)
                .roles(new HashSet<>(Set.of(adminRol)))
                .build();
        usuarioRepository.save(adminUsuario);

        log.info("══════════════════════════════════════════════════════");
        log.info("✓ Usuario ADMINISTRADOR creado:");
        log.info("  Username: admin@albru.admin.pe");
        log.info("  Password: 123456");
        log.info("  Email: jevbxx@gmail.com");
        log.info("  EmpleadoId: 0");
        log.info("  Dni: 00000000");
        log.info("  NombreCompleto: Edinson Vitterio");
        log.info("  Roles: [ADMINISTRADOR]");
        log.info("═══════════════════════════════════════════════════════");

        log.info("✅ Usuarios Creados");
    }
}
