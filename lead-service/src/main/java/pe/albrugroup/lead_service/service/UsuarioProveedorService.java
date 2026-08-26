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

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
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

        repository.deleteByIdEmpleadoAndAmbito(idEmpleado, ambito);
        repository.flush();
        proveedores.forEach(proveedor -> repository.save(UsuarioProveedor.builder()
                .idEmpleado(idEmpleado)
                .proveedor(proveedor)
                .ambito(ambito)
                .activo(true)
                .build()));
        return listarProveedoresDeEmpleado(idEmpleado, ambito);
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
