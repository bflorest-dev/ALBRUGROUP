package pe.albrugroup.auth_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.repository.PermisoRepository;
import pe.albrugroup.auth_service.repository.RolRepository;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

@Component @Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository  permisoRepository;

    @PostConstruct
    public void loadData() {
        log.info("=================================");
        log.info("INICIANDO CARGA DE DATOS INICIAL");

        crearPermisos();
        crearRoles();
        crearUsuarios();

        log.info("✅ DATOS CARGADOS");
        log.info("=================================");
    }

    private void crearPermisos() {
        log.info("Creando Permisos...");
        // POSTULANTES
        savePermiso("READ_POSTULANTE", "Puede listar y ver postulantes", "POSTULANTE", "READ");
        savePermiso("WRITE_POSTULANTE", "Puede crear y editar postulantes", "POSTULANTE", "READ");
//        savePermiso("EVALUATE_POSTULANTE")
        // EMPLEADOS
        savePermiso("READ_EMPLEADOS", "Puede ver empleados", "EMPLEADO", "READ");
        savePermiso("WRITE_EMPLEADOS", "Puede crear y editar empleados", "EMPLEADO", "WRITE");
        savePermiso("DELETE_EMPLEADOS", "Puede eliminar empleados", "EMPLEADO", "DELETE");
        // CONTRATOS
        savePermiso("READ_CONTRATOS", "Puede ver contratos", "CONTRATO", "READ");
        savePermiso("WRITE_CONTRATOS", "Puede crear y editar contratos", "CONTRATO", "WRITE");
        savePermiso("APPROVE_CONTRATOS", "Puede aprobar contratos", "CONTRATO", "APPROVE");
        // PAGOS
        savePermiso("READ_PAGOS", "Puede ver pagos", "PAGO", "READ");
        savePermiso("WRITE_PAGOS", "Puede procesar pagos",  "PAGO", "WRITE");

        log.info("✅ Permisos Creados");
    }
    private Permiso savePermiso(String nombre, String descripcion, String recurso, String accion) {
        Permiso permiso = Permiso.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .recurso(recurso)
                .accion(accion)
                .build();
        return permisoRepository.save(permiso);
    }

    private void crearRoles() {
        log.info("Creando Roles...");

        log.info("✅ Roles Creados");
    }
    private Rol saveRol(Rol rol) {
        return rolRepository.save(rol);
    }

    private void crearUsuarios() {
        log.info("Creando Usuarios...");

        log.info("✅ Usuarios Creados");
    }
}
