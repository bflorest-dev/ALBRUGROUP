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
            BigDecimal precioPromocional,
            Integer mesesPromocionPrecio,
            Long idProveedor,
            String proveedor,
            Integer velocidadRegular,
            String unidadVelocidad,
            Integer velocidadPromocional,
            Integer mesesPromocionVelocidad,
            String television,
            Integer cantidadCanales,
            String telefonia,
            Integer minutosTelefonia,
            List<AdicionalOpcion> adicionales,
            LocalDate vigenciaDesde,
            LocalDate vigenciaHasta
    ) { }

    public record AdicionalOpcion(
            String nombre,
            BigDecimal precioUnitario,
            Integer cantidadIncluida,
            boolean permiteCompraAdicional,
            Integer cantidadMaximaAdicional
    ) { }
}
