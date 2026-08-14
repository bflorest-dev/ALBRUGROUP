package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PostventaAsesorProveedor;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.CalendarioFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.PostventaAsesorProveedorRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PostventaAsesorProveedorService {

    private static final String ADMINISTRADOR = "ADMINISTRADOR";
    private static final Set<String> ROLES_POSTVENTA = Set.of("ASESOR_POSTVENTA", "SUPERVISOR_POSTVENTA");

    private final PostventaAsesorProveedorRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final CalendarioFacturacionPostventaRepository calendarioRepository;
    private final ProveedorMapper proveedorMapper;
    private final CurrentUser currentUser;

    public List<ProveedorResponse> asignarProveedores(Long idEmpleado, Set<Long> proveedorIds) {
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

        repository.deleteByIdEmpleado(idEmpleado);
        repository.flush();
        proveedores.forEach(proveedor -> repository.save(PostventaAsesorProveedor.builder()
                .idEmpleado(idEmpleado)
                .proveedor(proveedor)
                .activo(true)
                .build()));
        return listarProveedoresDeAsesor(idEmpleado);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedoresDeAsesor(Long idEmpleado) {
        return repository.findByIdEmpleadoAndActivoTrueOrderByProveedorNombreAsc(idEmpleado).stream()
                .map(PostventaAsesorProveedor::getProveedor)
                .map(proveedorMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Scope resolverScopeActual() {
        if (!esUsuarioPostventa()) {
            return Scope.sinRestriccion();
        }
        List<PostventaAsesorProveedor> asignaciones = repository.findByIdEmpleadoAndActivoTrueOrderByProveedorNombreAsc(
                currentUser.empleadoID()
        );
        return new Scope(
                true,
                asignaciones.stream().map(asignacion -> asignacion.getProveedor().getId()).collect(Collectors.toSet()),
                asignaciones.stream()
                        .map(asignacion -> normalizarNombre(asignacion.getProveedor().getNombre()))
                        .filter(nombre -> nombre != null && !nombre.isBlank())
                        .collect(Collectors.toSet())
        );
    }

    @Transactional(readOnly = true)
    public void validarLeadVisibleParaUsuarioActual(Lead lead) {
        if (!esLeadVisibleParaUsuarioActual(lead)) {
            Long idLead = lead == null ? null : lead.getId();
            throw new ForbiddenException("No tienes acceso a este lead de Postventa", idLead);
        }
    }

    @Transactional(readOnly = true)
    public boolean esLeadVisibleParaUsuarioActual(Lead lead) {
        Scope scope = resolverScopeActual();
        if (!scope.restringido()) {
            return true;
        }
        if (lead == null || scope.vacio()) {
            return false;
        }
        Long idProveedorPlan = lead.getPlan() == null || lead.getPlan().getProveedor() == null
                ? null
                : lead.getPlan().getProveedor().getId();
        if (idProveedorPlan != null && scope.proveedorIds().contains(idProveedorPlan)) {
            return true;
        }
        String proveedorSnapshot = normalizarNombre(lead.getNombreProveedorSnapshot());
        if (proveedorSnapshot != null && scope.proveedorNombres().contains(proveedorSnapshot)) {
            return true;
        }
        return calendarioRepository.findByLeadId(lead.getId())
                .map(calendario -> normalizarNombre(calendario.getProveedorSnapshot()))
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .map(scope.proveedorNombres()::contains)
                .orElse(false);
    }

    private boolean esUsuarioPostventa() {
        if (currentUser.roles().contains(ADMINISTRADOR)) {
            return false;
        }
        return currentUser.roles().stream().anyMatch(ROLES_POSTVENTA::contains);
    }

    private String normalizarNombre(String nombre) {
        return nombre == null ? null : nombre.trim().toUpperCase(Locale.ROOT);
    }

    public record Scope(boolean restringido, Set<Long> proveedorIds, Set<String> proveedorNombres) {

        static Scope sinRestriccion() {
            return new Scope(false, Set.of(), Set.of());
        }

        public boolean vacio() {
            return restringido && proveedorIds.isEmpty() && proveedorNombres.isEmpty();
        }

        public Collection<Long> idsParaQuery() {
            return proveedorIds.isEmpty() ? List.of(-1L) : proveedorIds;
        }

        public Collection<String> nombresParaQuery() {
            return proveedorNombres.isEmpty() ? List.of("__SIN_PROVEEDOR_POSTVENTA__") : proveedorNombres;
        }
    }
}
