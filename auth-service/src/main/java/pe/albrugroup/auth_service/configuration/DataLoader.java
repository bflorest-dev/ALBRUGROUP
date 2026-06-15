package pe.albrugroup.auth_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.repository.EquipoRepository;
import pe.albrugroup.auth_service.repository.PermisoRepository;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

import java.util.HashSet;
import java.util.Set;

@Component
@Profile("dev")
@Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private static final String ADMIN_USERNAME = "admin@albru.admin.pe";
    private static final String ADMIN_PASSWORD = "albruadminpe";
    private static final String ADMIN_EMAIL = "jevbxx@gmail.com";
    private static final Long ADMIN_EMPLEADO_ID = 1L;
    private static final String ADMIN_DNI = "76543210";
    private static final String ADMIN_NOMBRE_COMPLETO = "Edinson Vitterio";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository  permisoRepository;
    private final EquipoRepository equipoRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void loadData() {
        log.info("=================================");
        log.info("INICIANDO CARGA DE DATOS INICIAL");

        crearPermisos();
        crearRoles();
        crearUsuariosIniciales();
        crearEquipos();

        log.info("DATOS CARGADOS");
        log.info("=================================");
    }

    private void crearPermisos() {
        log.info("Creando Permisos...");

        // RECRUITMENT-SERVICE - POSTULACIONES
        savePermiso("CREATE_POSTULACIONES", "Puede registrar postulaciones nuevas", "POSTULACION", "CREATE");
        savePermiso("UPDATE_POSTULACIONES", "Puede editar y actualizar postulaciones", "POSTULACION", "UPDATE");
        savePermiso("TYPIFY_POSTULACIONES", "Puede tipificar postulaciones", "POSTULACION", "TYPIFY");
        savePermiso("READ_POSTULACION", "Puede ver el detalle de una postulacion", "POSTULACION", "READ");
        savePermiso("READ_POSTULACIONES", "Puede listar postulaciones", "POSTULACION", "READ");
        savePermiso("READ_POSTULACIONES_RECLUTAMIENTO", "Puede ver la bandeja de postulaciones en reclutamiento", "POSTULACION", "READ");
        savePermiso("READ_POSTULACIONES_CAPACITACION", "Puede ver la bandeja de postulaciones en capacitacion", "POSTULACION", "READ");
        savePermiso("CONFIRM_CONTRATACION_POSTULACIONES", "Puede confirmar la contratacion de postulaciones", "POSTULACION", "CONFIRM");

        // RECRUITMENT-SERVICE - OFERTAS LABORALES
        savePermiso("CREATE_OFERTAS_LABORALES", "Puede registrar ofertas laborales", "OFERTA_LABORAL", "CREATE");
        savePermiso("UPDATE_OFERTAS_LABORALES", "Puede registrar ampliaciones de ofertas laborales", "OFERTA_LABORAL", "UPDATE");
        savePermiso("READ_OFERTAS_LABORALES_ACTIVAS", "Puede listar ofertas laborales activas", "OFERTA_LABORAL", "READ");
        savePermiso("READ_OFERTAS_LABORALES", "Puede listar y ver ofertas laborales", "OFERTA_LABORAL", "READ");
        savePermiso("UPDATE_ESTADO_OFERTAS_LABORALES", "Puede cambiar el estado de las ofertas laborales", "OFERTA_LABORAL", "UPDATE_ESTADO");

        // RECRUITMENT-SERVICE - GRUPOS DE CAPACITACION
        savePermiso("CREATE_GRUPOS_CAPACITACION", "Puede crear grupos de capacitacion", "GRUPO_CAPACITACION", "CREATE");
        savePermiso("READ_GRUPOS_CAPACITACION", "Puede listar y ver grupos de capacitacion", "GRUPO_CAPACITACION", "READ");
        savePermiso("ASSIGN_GRUPOS_CAPACITACION", "Puede asignar postulaciones a grupos de capacitacion", "GRUPO_CAPACITACION", "ASSIGN");
        savePermiso("UPDATE_GRUPOS_CAPACITACION", "Puede actualizar detalles de grupos de capacitacion", "GRUPO_CAPACITACION", "UPDATE");

        // RECRUITMENT-SERVICE - EVENTOS
        savePermiso("READ_EVENTOS_RECRUITMENT", "Puede ver el historico de eventos de recruitment", "EVENTO_RECRUITMENT", "READ");

        // BANDEJAS DE TIPIFICACION
        savePermiso("READ_TIPIFICACIONES_RECLUTAMIENTO", "Puede consultar catalogos de tipificacion de reclutamiento", "TIPIFICACION_RECLUTAMIENTO", "READ");
        savePermiso("READ_TIPIFICACIONES_CAPACITACION", "Puede consultar catalogos de tipificacion de capacitacion", "TIPIFICACION_CAPACITACION", "READ");
        savePermiso("READ_TIPIFICACIONES_PREVENTA", "Puede consultar catalogos de tipificacion de preventa", "TIPIFICACION_PREVENTA", "READ");
        savePermiso("READ_TIPIFICACIONES_VENTA", "Puede consultar catalogos de tipificacion de venta", "TIPIFICACION_VENTA", "READ");
        savePermiso("READ_TIPIFICACIONES_POSTVENTA", "Puede consultar catalogos de tipificacion de postventa", "TIPIFICACION_POSTVENTA", "READ");
        savePermiso("UPDATE_TIPIFICACIONES", "Puede actualizar catalogos de tipificacion", "TIPIFICACION", "UPDATE");


        // POSTULANTES
//        savePermiso("REJECT_POSTULANTE_INASISTENCIA", "Puede rechazar a un postulante por inasistencia", "POSTULANTE", "REJECT");

        // EMPLEADOS
        savePermiso("CREATE_EMPLEADOS", "Puede registrar empleados directamente", "EMPLEADO", "CREATE");
        savePermiso("READ_EMPLEADOS", "Puede listar y ver empleados", "EMPLEADO", "READ");
        savePermiso("READ_PERSONAL_RECRUITMENT", "Puede listar personal activo de recruitment", "EMPLEADO", "READ");
        savePermiso("UPDATE_EMPLEADOS", "Puede editar empleados", "EMPLEADO", "UPDATE");
        savePermiso("BLACKLIST_EMPLEADO", "Puede marcar como lista negra a los empleados", "EMPLEADO", "BLACKLIST");

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

        // SCHEDULE-SERVICE - HORARIOS Y ASISTENCIAS
        savePermiso("CREATE_HORARIOS", "Puede registrar horarios", "HORARIO", "CREATE");
        savePermiso("READ_HORARIOS", "Puede listar y consultar horarios", "HORARIO", "READ");
        savePermiso("READ_HORARIOS_SELF", "Puede consultar su propia informacion de horarios", "HORARIO", "READ_SELF");
        savePermiso("UPDATE_HORARIOS", "Puede actualizar horarios y sus excepciones", "HORARIO", "UPDATE");
        savePermiso("EXTEND_HORARIO", "Puede gestionar excepciones y ampliaciones puntuales del horario", "HORARIO", "EXTEND");
        savePermiso("READ_ASISTENCIAS_SELF", "Puede consultar su propia informacion de asistencia", "ASISTENCIA", "READ_SELF");
        savePermiso("READ_ASISTENCIAS", "Puede consultar asistencia de cualquier empleado autorizado", "ASISTENCIA", "READ");
        savePermiso("READ_ASISTENCIAS_MONITOR", "Puede consultar estados de asistencia en tiempo real para monitoreo", "ASISTENCIA", "READ_MONITOR");
        savePermiso("READ_ASISTENCIAS_CUMPLIMIENTO", "Puede consultar cumplimiento de asistencia por periodos y grupos", "ASISTENCIA", "READ_COMPLIANCE");
        savePermiso("UPDATE_ASISTENCIAS", "Puede registrar movimientos de asistencia", "ASISTENCIA", "UPDATE");

        // LEADS - PREVENTA
        savePermiso("CREATE_CUENTA_PUBLICITARIA", "Puede registrar cuentas publicitarias", "CUENTA_PUBLICITARIA", "CREATE");
        savePermiso("READ_CUENTAS_PUBLICITARIAS", "Puede listar y ver cuentas publicitarias", "CUENTA_PUBLICITARIA", "READ");
        savePermiso("DELETE_CUENTA_PUBLICITARIA", "Puede desactivar cuentas publicitarias", "CUENTA_PUBLICITARIA", "DELETE");

        savePermiso("CREATE_CAMPANA", "Puede registrar campanas", "CAMPANA", "CREATE");
        savePermiso("READ_CAMPANA", "Puede listar y ver campanas", "CAMPANA", "READ");
        savePermiso("UPDATE_CAMPANA", "Puede actualizar campanas", "CAMPANA", "UPDATE");
        savePermiso("DELETE_CAMPANA", "Puede desactivar campanas", "CAMPANA", "DELETE");

        savePermiso("CREATE_PROVEEDORES", "Puede registrar proveedores", "PROVEEDOR", "CREATE");
        savePermiso("READ_PROVEEDORES", "Puede listar y ver proveedores", "PROVEEDOR", "READ");
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


        savePermiso("CREATE_LEADS", "Puede registrar ingresos de leads", "LEAD", "CREATE");
        savePermiso("DELETE_LEADS", "Puede eliminar integralmente leads", "LEAD", "DELETE");
        savePermiso("ASSIGN_LEADS", "Puede asignar leads", "LEAD", "ASSIGN");
        savePermiso("READ_LEADS_ASESOR", "Puede ver bandeja y detalle de leads del asesor", "LEAD", "READ");
        savePermiso("UPDATE_LEADS_ASESOR", "Puede actualizar datos de gestion del lead", "LEAD", "UPDATE");
        savePermiso("TYPIFY_LEADS", "Puede tipificar leads", "LEAD", "TYPIFY");
        savePermiso("CONTACT_LEADS", "Puede registrar contacto de leads", "LEAD", "CONTACT");
        savePermiso("READ_LEADS_GTR", "Puede ver bandeja de leads para GTR", "LEAD", "READ");
        savePermiso("READ_LEADS_SUPERVISOR_VENTAS_RESUMEN", "Puede ver resumen de acumuladores de supervisor de ventas", "LEAD_SUPERVISOR_VENTAS", "READ");
        savePermiso("READ_LEADS_SUPERVISOR_VENTAS_BANDEJA", "Puede ver la bandeja de cualquier asesor para supervisor de ventas", "LEAD_SUPERVISOR_VENTAS", "READ");

        savePermiso("READ_EVENTOS_LEADS", "Puede ver el historico de eventos de leads", "EVENTO_LEAD", "READ");
        savePermiso("READ_LEADS_DIARIOS", "Puede ver el listado de leads ingresados durante el dia", "EVENTO_LEAD", "READ");

        // LEADS - VENTA
        savePermiso("READ_LEADS_VENTA", "Puede ver la bandeja de leads disponibles en venta", "LEAD_VENTA", "READ");

        // LEADS - POSTVENTA
        savePermiso("READ_LEADS_POSTVENTA", "Puede ver la bandeja de leads disponibles en postventa", "LEAD_POSTVENTA", "READ");
        savePermiso("READ_LEADS_COBRANZA", "Puede ver la bandeja de leads disponibles en cobranza", "LEAD_COBRANZA", "READ");

        // EQUIPOS
        savePermiso("VER_TODOS_LOS_EQUIPOS", "Puede ver datos de todos los equipos (salta el filtro por equipo)", "EQUIPO", "READ_ALL");

        log.info("Permisos Creados");
    }

    private void savePermiso(String nombre, String descripcion, String recurso, String accion) {
        permisoRepository.findByNombre(nombre)
                .ifPresentOrElse(
                        permiso -> {
                            permiso.setDescripcion(descripcion);
                            permiso.setRecurso(recurso);
                            permiso.setAccion(accion);
                            permisoRepository.save(permiso);
                        },
                        () -> {
                            Permiso permiso = Permiso.builder()
                                    .nombre(nombre)
                                    .descripcion(descripcion)
                                    .recurso(recurso)
                                    .accion(accion)
                                    .build();
                            permisoRepository.save(permiso);
                        }
                );
    }

    private void crearRoles() {
        log.info("Creando Roles...");

        // ADMINISTRADOR
        Set<Permiso> adminPermisos = new HashSet<>(permisoRepository.findAll());
        saveRol("ADMINISTRADOR", "Gestion completa de Administracion", adminPermisos);

        // RRHH
        Set<Permiso> rrhhPermisos = Set.of(

                getPermiso("CREATE_POSTULACIONES"),
                getPermiso("UPDATE_POSTULACIONES"),
                getPermiso("TYPIFY_POSTULACIONES"),
                getPermiso("READ_POSTULACION"),
                getPermiso("READ_POSTULACIONES"),
                getPermiso("READ_POSTULACIONES_RECLUTAMIENTO"),
                getPermiso("READ_POSTULACIONES_CAPACITACION"),
                getPermiso("CONFIRM_CONTRATACION_POSTULACIONES"),

                getPermiso("CREATE_OFERTAS_LABORALES"),
                getPermiso("UPDATE_OFERTAS_LABORALES"),
                getPermiso("READ_OFERTAS_LABORALES"),
                getPermiso("UPDATE_ESTADO_OFERTAS_LABORALES"),
                getPermiso("READ_OFERTAS_LABORALES_ACTIVAS"),

                getPermiso("READ_EVENTOS_RECRUITMENT"),

                getPermiso("CREATE_EMPLEADOS"),
                getPermiso("READ_EMPLEADOS"),
                getPermiso("READ_PERSONAL_RECRUITMENT"),
                getPermiso("UPDATE_EMPLEADOS"),
                getPermiso("BLACKLIST_EMPLEADO"),

                getPermiso("READ_CONTRATISTAS"),

                getPermiso("CREATE_CONTRATOS"),
                getPermiso("UPDATE_CONTRATOS"),
                getPermiso("READ_CONTRATOS"),
                getPermiso("CANCEL_CONTRATOS"),

                getPermiso("READ_EVENTOS"),
                getPermiso("CREATE_HORARIOS"),
                getPermiso("READ_HORARIOS"),
                getPermiso("READ_HORARIOS_SELF"),
                getPermiso("UPDATE_HORARIOS"),
                getPermiso("EXTEND_HORARIO"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("READ_ASISTENCIAS"),
                getPermiso("READ_ASISTENCIAS_CUMPLIMIENTO"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("READ_ASISTENCIAS_MONITOR")

        );
        saveRol("RRHH", "Recursos Humanos - Gestion de personal", rrhhPermisos);


        // RECLUTADOR
        Set<Permiso> reclutadorPermisos = Set.of(

                getPermiso("TYPIFY_POSTULACIONES"),
                getPermiso("READ_TIPIFICACIONES_RECLUTAMIENTO"),

                getPermiso("READ_POSTULACIONES_RECLUTAMIENTO"),
                getPermiso("READ_POSTULACION"),

                getPermiso("READ_EMPLEADOS"),
                getPermiso("READ_PERSONAL_RECRUITMENT"),

                getPermiso("CREATE_GRUPOS_CAPACITACION"),
                getPermiso("READ_GRUPOS_CAPACITACION"),
                getPermiso("ASSIGN_GRUPOS_CAPACITACION"),
                getPermiso("UPDATE_GRUPOS_CAPACITACION"),

                getPermiso("READ_EVENTOS_RECRUITMENT"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS")
        );
        saveRol("RECLUTADOR", "Recursos Humanos - Contacto con postulantes", reclutadorPermisos);

        // CAPACITADOR
        Set<Permiso> capacitadorPermisos = Set.of(

                getPermiso("READ_GRUPOS_CAPACITACION"),
                getPermiso("READ_EVENTOS_RECRUITMENT"),
                getPermiso("TYPIFY_POSTULACIONES"),

                getPermiso("READ_EMPLEADOS"),
                getPermiso("READ_PERSONAL_RECRUITMENT"),

                getPermiso("READ_POSTULACIONES_CAPACITACION"),
                getPermiso("READ_POSTULACION"),

                getPermiso("READ_TIPIFICACIONES_CAPACITACION"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS")
        );
        saveRol("CAPACITADOR", "Capacitacion - Gestion de postulantes", capacitadorPermisos);

        // COMMUNITY
        Set<Permiso> communityPermisos = Set.of(
                getPermiso("CREATE_CUENTA_PUBLICITARIA"),
                getPermiso("READ_CUENTAS_PUBLICITARIAS"),
                getPermiso("DELETE_CUENTA_PUBLICITARIA"),

                getPermiso("CREATE_CAMPANA"),
                getPermiso("READ_CAMPANA"),
                getPermiso("UPDATE_CAMPANA"),
                getPermiso("DELETE_CAMPANA"),

                getPermiso("CREATE_PROVEEDORES"),
                getPermiso("READ_PROVEEDORES"),
                getPermiso("UPDATE_PROVEEDORES"),

                getPermiso("CREATE_ZONAS"),
                getPermiso("UPDATE_ZONAS"),
                getPermiso("READ_ZONAS"),

                getPermiso("READ_UBIGEO"),

                getPermiso("CREATE_PLANES"),
                getPermiso("READ_PLANES"),
                getPermiso("UPDATE_PLANES"),
                getPermiso("DELETE_PLANES"),

                getPermiso("CREATE_ADICIONALES"),
                getPermiso("READ_ADICIONALES"),

                getPermiso("CREATE_PROMOCIONES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("DELETE_PROMOCIONES"),
                getPermiso("READ_LEADS_DIARIOS"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("VER_TODOS_LOS_EQUIPOS")
        );
        saveRol("COMMUNITY", "Marketing - Generacion y apoyo comercial", communityPermisos);

        // GTR
        Set<Permiso> asesorGtrPermisos = Set.of(
                getPermiso("READ_CAMPANA"),
                getPermiso("READ_ZONAS"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_TIPIFICACIONES_PREVENTA"),

                getPermiso("CREATE_LEADS"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),

                getPermiso("READ_LEADS_GTR"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_LEADS_DIARIOS"),
                getPermiso("READ_ASISTENCIAS_MONITOR"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("EXTEND_HORARIO")
        );
        saveRol("ASESOR_GTR", "GTR - Asignacion y seguimiento de leads", asesorGtrPermisos);

        Set<Permiso> supervisorGtrPermisos = Set.of(
                getPermiso("READ_LEADS_GTR"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_LEADS_DIARIOS"),
                getPermiso("READ_CAMPANA"),
                getPermiso("READ_ASISTENCIAS_MONITOR"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("EXTEND_HORARIO")
        );
        saveRol("SUPERVISOR_GTR", "GTR - Supervision de asignacion de leads", supervisorGtrPermisos);

        // ASESOR_VENTAS
        Set<Permiso> asesorVentasPermisos = Set.of(

                getPermiso("READ_CAMPANA"),
                getPermiso("READ_ZONAS"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_TIPIFICACIONES_PREVENTA"),

                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS")

        );
        saveRol("ASESOR_VENTAS", "Ventas - Gestion de leads asignados", asesorVentasPermisos);
        saveRol("OJT", "On the job training - Gestion de leads asignados", asesorVentasPermisos);

        // SUPERVISOR_VENTAS
        Set<Permiso> supervisorVentasPermisos = Set.of(
                getPermiso("READ_CAMPANA"),
                getPermiso("READ_ZONAS"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_TIPIFICACIONES_PREVENTA"),

                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),

                getPermiso("READ_LEADS_GTR"),
                getPermiso("READ_LEADS_SUPERVISOR_VENTAS_RESUMEN"),
                getPermiso("READ_LEADS_SUPERVISOR_VENTAS_BANDEJA"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_ASISTENCIAS_MONITOR"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("READ_ASISTENCIAS"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("EXTEND_HORARIO")
        );
        saveRol("SUPERVISOR_VENTAS", "Ventas - Supervision de leads asignados", supervisorVentasPermisos);

        // TODO

        // MONITOR
        Set<Permiso> monitorPermisos = Set.of(
                getPermiso("READ_EVENTOS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_EVENTOS_RECRUITMENT"),
                getPermiso("READ_EMPLEADOS"),
                getPermiso("READ_CONTRATOS"),
                getPermiso("READ_POSTULACIONES"),
                getPermiso("READ_POSTULACIONES_RECLUTAMIENTO"),
                getPermiso("READ_POSTULACIONES_CAPACITACION"),
                getPermiso("READ_OFERTAS_LABORALES"),
                getPermiso("READ_GRUPOS_CAPACITACION"),
                getPermiso("READ_HORARIOS"),
                getPermiso("READ_ASISTENCIAS_MONITOR"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("READ_ASISTENCIAS"),
                getPermiso("READ_ASISTENCIAS_CUMPLIMIENTO"),
                getPermiso("VER_TODOS_LOS_EQUIPOS")


        );
        saveRol("MONITOR", "Monitoreo - Consulta transversal de la operacion", monitorPermisos);

        // BACKOFFICE
        Set<Permiso> backofficePermisos = Set.of(
                getPermiso("READ_LEADS_VENTA"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("READ_TIPIFICACIONES_VENTA"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS")
        );
        saveRol("ASESOR_BACKOFFICE", "Backoffice - Gestion operativa comercial", backofficePermisos);
        saveRol("SUPERVISOR_BACKOFFICE", "Backoffice - Supervision operativa comercial", backofficePermisos);

        // ASESOR POSTVENTA
        Set<Permiso> postventaPermisos = Set.of(
                getPermiso("READ_LEADS_POSTVENTA"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_TIPIFICACIONES_POSTVENTA"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("VER_TODOS_LOS_EQUIPOS")
        );
        saveRol("ASESOR_POSTVENTA", "Postventa - Gestion de cartera y seguimiento", postventaPermisos);
        saveRol("SUPERVISOR_POSTVENTA", "Postventa - Supervision de cartera y seguimiento", postventaPermisos);

        // COBRANZA
        Set<Permiso> cobranzaPermisos = Set.of(
                getPermiso("READ_LEADS_COBRANZA"),
                getPermiso("ASSIGN_LEADS"),
                getPermiso("READ_LEADS_ASESOR"),
                getPermiso("UPDATE_LEADS_ASESOR"),
                getPermiso("TYPIFY_LEADS"),
                getPermiso("CONTACT_LEADS"),
                getPermiso("READ_TIPIFICACIONES_POSTVENTA"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_PLANES"),
                getPermiso("READ_ADICIONALES"),
                getPermiso("READ_PROMOCIONES"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("UPDATE_ASISTENCIAS"),
                getPermiso("VER_TODOS_LOS_EQUIPOS")
        );
        saveRol("ASESOR_COBRANZA", "Cobranza - Seguimiento de pagos postventa", cobranzaPermisos);

        // DESARROLLADOR
        Set<Permiso> desarrolladorPermisos = Set.of(
                getPermiso("READ_EVENTOS"),
                getPermiso("READ_EVENTOS_LEADS"),
                getPermiso("READ_EVENTOS_RECRUITMENT"),
                getPermiso("READ_UBIGEO"),
                getPermiso("READ_HORARIOS"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("READ_ASISTENCIAS")
        );
        saveRol("DESARROLLADOR", "Tecnologia - Soporte y mantenimiento", desarrolladorPermisos);

        // CONTADOR
        Set<Permiso> contadorPermisos = Set.of(
                getPermiso("READ_EMPLEADOS"),
                getPermiso("READ_CONTRATOS"),
                getPermiso("READ_PAGOS"),
                getPermiso("CREATE_PAGOS"),
                getPermiso("READ_HORARIOS"),
                getPermiso("READ_ASISTENCIAS_SELF"),
                getPermiso("READ_ASISTENCIAS"),
                getPermiso("READ_ASISTENCIAS_CUMPLIMIENTO"),
                getPermiso("UPDATE_ASISTENCIAS")
        );
        saveRol("CONTADOR", "Contabilidad - Gestion de pagos y consulta laboral", contadorPermisos);

        log.info("Roles Creados");
    }

    private Permiso getPermiso(String nombre) {
        return permisoRepository.findByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Permiso no encontrado " + nombre));
    }
    private void saveRol(String nombre, String descripcion, Set<Permiso> permisos) {
        rolRepository.findByNombre(nombre)
                .ifPresentOrElse(
                        rol -> {
                            rol.setDescripcion(descripcion);
                            rol.setPermisos(new HashSet<>(permisos));
                            rolRepository.save(rol);
                        },
                        () -> {
                            Rol rol = Rol.builder()
                                    .nombre(nombre)
                                    .descripcion(descripcion)
                                    .permisos(new HashSet<>(permisos))
                                    .build();
                            rolRepository.save(rol);
                        }
                );
    }

    private void crearUsuariosIniciales() {
        log.info("Creando Usuarios...");

        log.info("Creando Usuario ADMINISTRADOR INICIAL");
        Rol adminRol = rolRepository.findByNombre("ADMINISTRADOR")
                        .orElseThrow(() -> new RuntimeException("Rol ADMINISTRADOR no encontrado"));
        Usuario adminUsuario = usuarioRepository.findByEmpleadoId(ADMIN_EMPLEADO_ID)
                .or(() -> usuarioRepository.findByUsername(ADMIN_USERNAME))
                .map(usuario -> {
                    usuario.setUsername(ADMIN_USERNAME);
                    usuario.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                    usuario.setPasswordInicializada(true);
                    usuario.setEmail(ADMIN_EMAIL);
                    usuario.setEmpleadoId(ADMIN_EMPLEADO_ID);
                    usuario.setDni(ADMIN_DNI);
                    usuario.setNombreCompleto(ADMIN_NOMBRE_COMPLETO);
                    usuario.setActivo(true);
                    usuario.setRoles(new HashSet<>(Set.of(adminRol)));
                    return usuario;
                })
                .orElseGet(() -> Usuario.builder()
                        .username(ADMIN_USERNAME)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .passwordInicializada(true)
                        .email(ADMIN_EMAIL)
                        .empleadoId(ADMIN_EMPLEADO_ID)
                        .dni(ADMIN_DNI)
                        .nombreCompleto(ADMIN_NOMBRE_COMPLETO)
                        .activo(true)
                        .roles(new HashSet<>(Set.of(adminRol)))
                        .build());
        usuarioRepository.save(adminUsuario);

        log.info("══════════════════════════════════════════════════════");
        log.info("✓ Usuario ADMINISTRADOR creado:");
        log.info("  Username: {}", ADMIN_USERNAME);
        log.info("  Password: {}", ADMIN_PASSWORD);
        log.info("  Email: {}", ADMIN_EMAIL);
        log.info("  EmpleadoId: {}", ADMIN_EMPLEADO_ID);
        log.info("  Dni: {}", ADMIN_DNI);
        log.info("  NombreCompleto: {}", ADMIN_NOMBRE_COMPLETO);
        log.info("  Roles: [ADMINISTRADOR]");
        log.info("═══════════════════════════════════════════════════════");

        log.info("Usuarios Creados");
    }

    private void crearEquipos() {
        log.info("Creando Equipos (seed dev)...");
        saveEquipo("Equipo 1", "WIN, PERUFIBRA, MIFIBRA");
        saveEquipo("Equipo 2", "CLARO");
        log.info("Equipos Creados");
    }

    private void saveEquipo(String nombre, String descripcion) {
        equipoRepository.findByNombre(nombre)
                .ifPresentOrElse(
                        equipo -> {
                            equipo.setDescripcion(descripcion);
                            equipo.setActivo(true);
                            equipoRepository.save(equipo);
                        },
                        () -> equipoRepository.save(Equipo.builder()
                                .nombre(nombre)
                                .descripcion(descripcion)
                                .activo(true)
                                .build())
                );
    }
}
