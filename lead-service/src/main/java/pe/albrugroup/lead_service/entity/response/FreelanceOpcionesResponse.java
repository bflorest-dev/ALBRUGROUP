package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FreelanceOpcionesResponse(
        Long idEquipo,
        List<ProveedorOpcion> proveedores,
        List<PlanOpcion> planes
) {
    public record ProveedorOpcion(
            Long id,
            String nombre,
            boolean requiereSecSotVenta,
            List<CampoConfigResponse> camposCaptura
    ) { }

    public record PlanOpcion(
            Long id,
            String nombre,
            BigDecimal precio,
            Long idProveedor,
            String proveedor,
            LocalDate vigenciaDesde,
            LocalDate vigenciaHasta
    ) { }
}
