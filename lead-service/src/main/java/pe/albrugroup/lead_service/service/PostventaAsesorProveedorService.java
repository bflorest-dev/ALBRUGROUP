package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.ForbiddenException;

import java.util.List;
import java.util.Set;

/**
 * Scope de POSTVENTA por proveedor. Delega el conjunto de proveedores a {@link ProveedorScopeService}
 * (tabla unificada usuario_proveedor, ámbito POSTVENTA) y conserva el matcheo lead→proveedor específico
 * de postventa (plan.proveedor, snapshot del lead y snapshot del calendario). La administración de las
 * asignaciones vive en {@link UsuarioProveedorService}.
 */
@Service
@RequiredArgsConstructor
public class PostventaAsesorProveedorService {

    private final ProveedorScopeService proveedorScopeService;
    private final UsuarioProveedorService usuarioProveedorService;

    @Transactional
    public List<ProveedorResponse> asignarProveedores(Long idEmpleado, Set<Long> proveedorIds) {
        return usuarioProveedorService.asignarProveedores(idEmpleado, AmbitoProveedor.POSTVENTA, proveedorIds);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedoresDeAsesor(Long idEmpleado) {
        return usuarioProveedorService.listarProveedoresDeEmpleado(idEmpleado, AmbitoProveedor.POSTVENTA);
    }

    /** Scope postventa del usuario actual: sin restricción si no es postventa (ADMIN incluido). */
    @Transactional(readOnly = true)
    public ProveedorScopeService.Scope resolverScopeActual() {
        if (proveedorScopeService.ambitoActual() != AmbitoProveedor.POSTVENTA) {
            return ProveedorScopeService.Scope.sinRestriccion();
        }
        return proveedorScopeService.resolverScope(AmbitoProveedor.POSTVENTA);
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
        ProveedorScopeService.Scope scope = resolverScopeActual();
        if (!scope.restringido()) {
            return true;
        }
        if (lead == null || scope.vacio()) {
            return false;
        }
        Long idProveedor = lead.getProveedor() == null ? null : lead.getProveedor().getId();
        return idProveedor != null && scope.proveedorIds().contains(idProveedor);
    }
}
