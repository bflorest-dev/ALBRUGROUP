package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.UsuarioProveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.response.AsignacionUsuarioProveedorResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.UsuarioProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Administración (ADMIN) de las asignaciones empleado→proveedor sobre la tabla unificada
 * usuario_proveedor. Escritura única del scope por proveedor para BACKOFFICE y POSTVENTA.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UsuarioProveedorService {

    private static final Set<String> ROLES_GESTIONADOS_POR_PROVEEDOR = Set.of(
            "ASESOR_BACKOFFICE", "SUPERVISOR_BACKOFFICE", "MONITOR",
            "ASESOR_POSTVENTA", "SUPERVISOR_POSTVENTA"
    );

    private final UsuarioProveedorRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorMapper proveedorMapper;

    /** Reemplaza el conjunto de proveedores del empleado en el ámbito dado. */
    public List<ProveedorResponse> asignarProveedores(Long idEmpleado, AmbitoProveedor ambito, Set<Long> proveedorIds) {
        Set<Long> ids = proveedorIds == null ? Set.of() : proveedorIds;
        List<Proveedor> proveedores = ids.isEmpty()
                ? List.of()
                : proveedorRepository.findAllById(ids);
        if (proveedores.size() != ids.size()) {
            throw new BadRequestException("Uno o mas proveedores no existen");
        }
        if (proveedores.stream().anyMatch(proveedor -> !Boolean.TRUE.equals(proveedor.getActivo()))) {
            throw new BadRequestException("Solo se pueden asignar proveedores activos");
        }

        reemplazarProveedores(idEmpleado, ambito, proveedores);
        if (ambito == AmbitoProveedor.POSTVENTA) {
            reemplazarProveedores(idEmpleado, AmbitoProveedor.BACKOFFICE, proveedores);
        }
        return listarProveedoresDeEmpleado(idEmpleado, ambito);
    }

    /**
     * Reconciliación interna del scope por proveedor después de un cambio de roles.
     * Ambos ámbitos técnicos representan el mismo scope conceptual y deben conservar
     * exactamente el mismo conjunto cuando todavía existe un rol por proveedor.
     */
    public void reconciliarScopePorRoles(Long idEmpleado, Set<String> roles) {
        Set<String> rolesNormalizados = roles == null ? Set.of() : roles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        boolean conservaRolPorProveedor = rolesNormalizados.stream()
                .anyMatch(ROLES_GESTIONADOS_POR_PROVEEDOR::contains);

        Map<Long, Proveedor> proveedoresPorId = new LinkedHashMap<>();
        if (conservaRolPorProveedor) {
            for (AmbitoProveedor ambito : AmbitoProveedor.values()) {
                repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(idEmpleado, ambito)
                        .forEach(asignacion -> proveedoresPorId.putIfAbsent(
                                asignacion.getProveedor().getId(), asignacion.getProveedor()));
            }
        }

        List<Proveedor> proveedores = new ArrayList<>(proveedoresPorId.values());
        reemplazarProveedores(idEmpleado, AmbitoProveedor.BACKOFFICE, proveedores);
        reemplazarProveedores(idEmpleado, AmbitoProveedor.POSTVENTA, proveedores);
    }

    private void reemplazarProveedores(Long idEmpleado, AmbitoProveedor ambito, List<Proveedor> proveedores) {
        repository.deleteByIdEmpleadoAndAmbito(idEmpleado, ambito);
        repository.flush();
        proveedores.forEach(proveedor -> repository.save(UsuarioProveedor.builder()
                .idEmpleado(idEmpleado)
                .proveedor(proveedor)
                .ambito(ambito)
                .activo(true)
                .build()));
    }

    /** Todas las asignaciones del ámbito, agrupadas por empleado (para el grid de administración). */
    @Transactional(readOnly = true)
    public List<AsignacionUsuarioProveedorResponse> listarAsignaciones(AmbitoProveedor ambito) {
        Map<Long, Set<Long>> porEmpleado = new LinkedHashMap<>();
        repository.findByAmbitoAndActivoTrue(ambito).forEach(asignacion ->
                porEmpleado.computeIfAbsent(asignacion.getIdEmpleado(), key -> new LinkedHashSet<>())
                        .add(asignacion.getProveedor().getId()));
        return porEmpleado.entrySet().stream()
                .map(entry -> new AsignacionUsuarioProveedorResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedoresDeEmpleado(Long idEmpleado, AmbitoProveedor ambito) {
        return repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(idEmpleado, ambito).stream()
                .map(UsuarioProveedor::getProveedor)
                .map(proveedorMapper::toResponse)
                .toList();
    }
}
