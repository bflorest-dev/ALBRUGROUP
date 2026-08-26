package pe.albrugroup.lead_service.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.UsuarioProveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.repository.UsuarioProveedorRepository;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resuelve, para el usuario del request actual, el conjunto de proveedores que puede ver
 * (scope por proveedor) y — si el frontend envió el header {@value #HEADER_PROVEEDOR} — lo
 * estrecha al proveedor activo del selector. Fail-closed: un usuario acotado sin proveedores
 * asignados no ve nada.
 *
 * Reemplaza la partición por equipo para los roles BACKOFFICE y POSTVENTA. GTR/ventas y ADMIN
 * no pasan por aquí (siguen por equipo / visibilidad global).
 */
@Service
@RequiredArgsConstructor
public class ProveedorScopeService {

    public static final String HEADER_PROVEEDOR = "X-Proveedor-Id";

    private static final String ADMINISTRADOR = "ADMINISTRADOR";
    private static final Set<String> ROLES_BACKOFFICE = Set.of("ASESOR_BACKOFFICE", "SUPERVISOR_BACKOFFICE");
    private static final Set<String> ROLES_POSTVENTA = Set.of("ASESOR_POSTVENTA", "SUPERVISOR_POSTVENTA");

    private final UsuarioProveedorRepository repository;
    private final CurrentUser currentUser;
    private final HttpServletRequest request;

    /** Ámbito por el que se acota el usuario actual, o {@code null} si no se acota por proveedor. */
    public AmbitoProveedor ambitoActual() {
        List<String> roles = currentUser.roles();
        if (roles.contains(ADMINISTRADOR)) {
            return null;
        }
        if (roles.stream().anyMatch(ROLES_BACKOFFICE::contains)) {
            return AmbitoProveedor.BACKOFFICE;
        }
        if (roles.stream().anyMatch(ROLES_POSTVENTA::contains)) {
            return AmbitoProveedor.POSTVENTA;
        }
        return null;
    }

    /** Proveedores asignados al usuario actual en su ámbito (para el selector / /mis-proveedores). */
    @Transactional(readOnly = true)
    public List<Proveedor> misProveedores() {
        AmbitoProveedor ambito = ambitoActual();
        if (ambito == null) {
            return List.of();
        }
        return proveedoresAsignados(currentUser.empleadoID(), ambito);
    }

    /**
     * Scope efectivo para el ámbito dado del usuario actual. Si el header trae un proveedor válido
     * dentro de los asignados, el scope se reduce a ese único proveedor; si no, cubre todos los
     * asignados. Pensado para consumirse desde el filtro de request y desde postventa.
     */
    @Transactional(readOnly = true)
    public Scope resolverScope(AmbitoProveedor ambito) {
        if (ambito == null) {
            return Scope.sinRestriccion();
        }
        List<Proveedor> asignados = proveedoresAsignados(currentUser.empleadoID(), ambito);
        Long activo = proveedorActivoHeader();
        List<Proveedor> efectivos = (activo != null && asignados.stream().anyMatch(p -> activo.equals(p.getId())))
                ? asignados.stream().filter(p -> activo.equals(p.getId())).toList()
                : asignados;
        return new Scope(
                true,
                efectivos.stream().map(Proveedor::getId).collect(Collectors.toSet()),
                efectivos.stream()
                        .map(p -> normalizarNombre(p.getNombre()))
                        .filter(nombre -> nombre != null && !nombre.isBlank())
                        .collect(Collectors.toSet())
        );
    }

    /** Scope del usuario actual resuelto automáticamente por su rol (o sin restricción si no aplica). */
    @Transactional(readOnly = true)
    public Scope resolverScopeActual() {
        return resolverScope(ambitoActual());
    }

    private List<Proveedor> proveedoresAsignados(Long idEmpleado, AmbitoProveedor ambito) {
        return repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(idEmpleado, ambito)
                .stream()
                .map(UsuarioProveedor::getProveedor)
                .toList();
    }

    private Long proveedorActivoHeader() {
        String raw = request == null ? null : request.getHeader(HEADER_PROVEEDOR);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizarNombre(String nombre) {
        return nombre == null ? null : nombre.trim().toUpperCase(Locale.ROOT);
    }

    /**
     * Conjunto de proveedores visibles. {@code restringido=false} = sin filtro (ADMIN / no acotado).
     * Con centinelas fail-closed para las queries cuando el conjunto queda vacío.
     */
    public record Scope(boolean restringido, Set<Long> proveedorIds, Set<String> proveedorNombres) {

        public static Scope sinRestriccion() {
            return new Scope(false, Set.of(), Set.of());
        }

        public boolean vacio() {
            return restringido && proveedorIds.isEmpty() && proveedorNombres.isEmpty();
        }

        public Collection<Long> idsParaQuery() {
            return proveedorIds.isEmpty() ? List.of(-1L) : proveedorIds;
        }

        public Collection<String> nombresParaQuery() {
            return proveedorNombres.isEmpty() ? List.of("__SIN_PROVEEDOR__") : proveedorNombres;
        }
    }
}
