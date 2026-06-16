package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;

import java.util.List;
import java.util.Set;

/**
 * Aplica el filtro por equipo a los catálogos (campañas/proveedores) reutilizando los listados
 * cacheados (que se devuelven completos) y filtrándolos en memoria por los proveedores visibles
 * del usuario. Mantiene la cache intacta (clave por `activo`) sin multiplicarla por equipo.
 * Visibilidad global (ADMIN/COMMUNITY/MONITOR) → sin filtro (proveedorIdsVisibles == null).
 */
@Service
@RequiredArgsConstructor
public class CatalogoEquipoService {

    private final CampanaService campanaService;
    private final ProveedorService proveedorService;
    private final PlanService planService;
    private final EquipoProveedorService equipoProveedorService;

    public List<CampanaResponse> listarCampanasVisibles(Boolean activo) {
        List<CampanaResponse> todas = campanaService.listarCampanas(activo);
        Set<Long> visibles = equipoProveedorService.proveedorIdsVisibles();
        if (visibles == null) {
            return todas;
        }
        return todas.stream()
                .filter(c -> c.getIdProveedor() != null && visibles.contains(c.getIdProveedor()))
                .toList();
    }

    public List<ProveedorResponse> listarProveedoresVisibles(Boolean activo) {
        List<ProveedorResponse> todos = proveedorService.listarProveedores(activo);
        Set<Long> visibles = equipoProveedorService.proveedorIdsVisibles();
        if (visibles == null) {
            return todos;
        }
        return todos.stream()
                .filter(p -> visibles.contains(p.getId()))
                .toList();
    }

    public List<PlanResponse> listarPlanesVisibles(Long idProveedor, boolean soloVigentes) {
        Set<Long> visibles = equipoProveedorService.proveedorIdsVisibles();
        if (idProveedor != null) {
            // Proveedor específico: si no es visible para el equipo, no se devuelven planes.
            if (visibles != null && !visibles.contains(idProveedor)) {
                return List.of();
            }
            return planService.listarPlanes(idProveedor, soloVigentes);
        }
        // "Todos los planes": filtra a los proveedores del equipo (global = sin filtro).
        List<PlanResponse> todos = planService.listarPlanes(null, soloVigentes);
        if (visibles == null) {
            return todos;
        }
        return todos.stream()
                .filter(p -> p.getIdProveedor() != null && visibles.contains(p.getIdProveedor()))
                .toList();
    }
}
